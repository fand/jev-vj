import csv
import http.client
import io
import json
from pathlib import Path
import tempfile
import threading
import unittest
from unittest.mock import patch

from footage_library import FootageStore, CORE, Problem
from player_server import Library, Player, create_server, request_body


class CatalogTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name).resolve()
        self.media = self.root / 'media'
        (self.media / 'foo').mkdir(parents=True)
        self.video = self.media / 'foo/test.mp4'
        self.video.write_bytes(b'video')
        self.store = FootageStore(self.root / 'data', self.media)

    def test_import_preserves_paths_and_is_draft_only(self):
        rows = self.store.import_paths([str(self.video), str(self.media)])['rows']
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]['name'], 'foo/test.mp4')
        self.assertEqual(rows[0]['path'], str(self.video))
        self.assertIsNone(rows[0]['bpm'])
        self.assertEqual(rows[0]['desc'], '')
        self.assertEqual(self.store.snapshot()['rows'], [])
        rows[0].update(id='old-catalog-id', desc='Keep this description', bpm=158.52)
        self.store.save(CORE, rows, self.store.snapshot()['revision'])
        self.assertEqual(self.store.import_paths([str(self.video)])['rows'][0]['id'], 'old-catalog-id')
        self.assertEqual(self.store.snapshot()['rows'][0]['desc'], 'Keep this description')

    def test_csv_quotes_newlines_unicode_custom_columns_and_conflicts(self):
        old = self.store.snapshot()
        row = self.store.import_paths([str(self.video)])['rows'][0]
        row.update(desc='赤, blue "white"\nゆっくり', bpm=158.52, **{'camera.motion': 'forward'})
        saved = self.store.save(CORE + ['camera.motion'], [row], old['revision'])
        reopened = FootageStore(self.root / 'data', self.media).snapshot()
        self.assertEqual(reopened['rows'], [row])
        self.assertEqual(reopened['revision'], saved['revision'])
        with self.assertRaises(Problem) as error:
            self.store.save(CORE, [], old['revision'])
        self.assertEqual(error.exception.status, 409)
        self.assertEqual(self.store.snapshot()['rows'], [row])
        del row['camera.motion']
        self.store.save(CORE, [row], saved['revision'])
        self.assertNotIn('camera.motion', self.store.snapshot()['columns'])

    def test_drop_matching_requires_name_and_size_and_reports_ambiguity(self):
        other = self.media / 'bar/test.mp4';other.parent.mkdir();other.write_bytes(b'video')
        missing = {'name': 'missing.mp4', 'size': 5}
        result = self.store.resolve_drops([{'name': 'test.mp4', 'size': 5}, missing])
        self.assertEqual(len(result['files'][0]['matches']), 2)
        self.assertEqual(result['files'][1]['matches'], [])
        self.assertEqual(self.store.resolve_drops([{'name':'test.mp4','size':999}])['files'][0]['matches'], [])
        result = self.store.resolve_drops([{'name':'test.mp4','size':5,'relative_path':'foo/test.mp4'}])
        self.assertEqual(result['files'][0]['matches'], [str(self.video)])

    def test_root_configuration_and_symlink_boundary(self):
        outside = self.root / 'outside.mp4';outside.write_bytes(b'video')
        (self.media / 'outside.mp4').symlink_to(outside)
        self.assertEqual(self.store.resolve_drops([{'name':'outside.mp4','size':5}])['files'][0]['matches'], [])
        result = self.store.set_roots([str(self.root), str(self.root)])
        self.assertEqual(result['roots'], [str(self.root)])
        with self.assertRaises(Problem):self.store.set_roots(['relative'])
        with self.assertRaises(Problem):self.store.set_roots([str(self.root/'missing')])

    def test_invalid_data_never_overwrites_csv(self):
        row = self.store.import_paths([str(self.video)])['rows'][0]
        revision = self.store.snapshot()['revision']
        for field, value in [('bpm',-1),('bpm','NaN'),('bpm','inf'),('path','relative.mp4'),('path',str(self.root/'secret.key')),('name','')]:
            with self.subTest(field=field,value=value),self.assertRaises(Problem):
                self.store.save(CORE, [dict(row, **{field:value})], revision)
        for columns, rows in [(CORE,[row,row]),(CORE[:-1],[row]),(CORE+['name'],[row])]:
            with self.assertRaises(Problem):self.store.save(columns,rows,revision)
        self.assertEqual(self.store.snapshot()['revision'],revision)

    def test_csv_missing_video_is_retained_for_offline_drives(self):
        row=self.store.import_paths([str(self.video)])['rows'][0]
        self.video.unlink()
        self.store.save(CORE,[row],self.store.snapshot()['revision'])
        self.assertEqual(len(self.store.snapshot()['rows']),1)

    def test_catalog_applies_descriptions_without_stale_derived_metadata(self):
        library=Library(root=self.media,cache=self.root/'cache')
        store=library.ensure_store()
        row=store.import_paths([str(self.video)])['rows'][0]
        row.update(id='legacy-id',desc='old description',bpm=120)
        library.legacy_clips[row['id']]={'id':row['id'],'description':'old normalized','attributes':{'color':'red'}}
        library.legacy_notes[row['id']]={'source_note':'old description'}
        library.apply_catalog({'rows':[row]})
        self.assertEqual(library.clips[0]['attributes'],{'color':'red'})
        row.update(desc='blue calm scene',bpm=158.52,**{'camera.motion':'forward'})
        store.save(CORE+['camera.motion'],[row],store.snapshot()['revision']);library.scan()
        self.assertEqual(library.clips[0]['description'],'blue calm scene')
        self.assertEqual(library.clips[0]['attributes'],{'camera.motion':'forward'})
        self.assertEqual(library.public(row['id'])['source_bpm'],158.52)
        self.assertNotIn(str(self.media),json.dumps(request_body('calm',library.clips,[],None,library.available(),'candidates')))
        restarted=Library(root=self.media,cache=self.root/'cache')
        self.assertEqual(restarted.available(),[row['id']])
        row['desc']=''
        library.apply_catalog({'rows':[row]})
        self.assertEqual(library.available(),[])
        self.assertIn(row['id'],library.paths)  # Undescribed videos can still be previewed.

    def test_offline_first_open_never_creates_an_empty_catalog(self):
        offline=self.root/'offline'
        library=Library(root=offline,cache=self.root/'cache')
        with self.assertRaises(Problem):library.ensure_store()
        self.assertFalse((library.data_dir/'footage.csv').exists())
        (offline/'ducky3d').mkdir(parents=True)
        (offline/'ducky3d/animation 1.mp4').write_bytes(b'video')
        rows=library.ensure_store().snapshot()['rows']
        self.assertEqual([r['id'] for r in rows],['ducky3d/animation 1.mp4'])
        self.assertTrue(rows[0]['desc'])

    def test_http_save_permissions_size_and_missing_files(self):
        library=Library(root=self.media,cache=self.root/'cache')
        player=Player(library)
        server=create_server(0,player)
        thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
        self.addCleanup(server.server_close);self.addCleanup(server.shutdown)
        def request(method,path,data=None,token=True,origin=None):
            connection=http.client.HTTPConnection('127.0.0.1',server.server_port)
            headers={'Content-Type':'application/json'}
            if token:headers['X-Jev-Token']=player.token
            if origin:headers['Origin']=origin
            connection.request(method,path,None if data is None else json.dumps(data),headers)
            response=connection.getresponse();body=response.read();connection.close()
            return response.status,body
        status,body=request('GET','/api/library');self.assertEqual(status,200)
        snap=json.loads(body)
        rows=library.store.import_paths([str(self.video)])['rows'];rows[0]['desc']='a'*9000
        payload={'columns':CORE,'rows':rows,'revision':snap['revision']}
        self.assertEqual(request('POST','/api/library/save',payload,token=False)[0],403)
        self.assertEqual(request('POST','/api/library/save',payload,origin='https://example.com')[0],403)
        player.busy=True
        self.assertEqual(request('POST','/api/library/save',payload)[0],409);player.busy=False
        self.assertEqual(request('POST','/api/library/save',payload)[0],200)
        self.assertEqual(library.available(),[rows[0]['id']])
        status,body=request('GET','/api/library/csv');self.assertEqual(status,200)
        self.assertEqual(list(csv.DictReader(io.StringIO(body.decode())))[0]['desc'],'a'*9000)
        with patch.object(library,'prepare_path',return_value='preview-key') as prepare:
            self.assertEqual(request('POST','/api/library/preview',{'path':str(self.video)})[0],200)
            prepare.assert_called_once_with(self.video)
        self.video.unlink()
        self.assertEqual(json.loads(request('GET','/api/library')[1])['missing'],[rows[0]['id']])
        self.assertEqual(request('POST','/api/candidates',{'prompt':'a'*9000})[0],413)
