import {TabulatorFull as Tabulator} from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator.min.css';
const $=id=>document.getElementById(id);
const core=['id','name','path','bpm','desc'];
const libraryChannel=new BroadcastChannel('jev-library');
let table, token, revision, columns=[], dirty=false, editVersion=0, saving=false, selected=null, previewVersion=0;
let missing=new Set();
function notice(text,error=false){$('notice').textContent=text;$('notice').classList.toggle('error',error);}
async function api(path,data){
 const response=await fetch(path,data===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json','X-Jev-Token':token},body:JSON.stringify(data)});
 const result=await response.json();if(!response.ok)throw Error(result.error||'Request failed.');return result;
}
function changed(){dirty=true;editVersion++;updateStatus();}
function updateStatus(){
 $('save').disabled=saving||!dirty;
 $('save-state').textContent=saving?'Saving…':revision===null?'Set media folders':dirty?'Unsaved changes':'Saved locally';
 const rows=table?.getData()||[];
 $('row-count').textContent=`${rows.length} footage · ${rows.filter(r=>r.desc?.trim()).length} described`;
}
function columnDefinitions(){
 return ['name','bpm','desc',...columns.filter(field=>!core.includes(field)),'path'].map(field=>({title:({name:'Name',path:'Path',bpm:'BPM',desc:'Description'})[field]||field,field,
  editor:field==='desc'?'textarea':'input',formatter:'plaintext',variableHeight:field==='desc',
  width:field==='name'?220:field==='bpm'?85:field==='path'?320:undefined,minWidth:field==='desc'?320:100,widthGrow:field==='desc'?3:1,
  frozen:field==='name',editorParams:field==='bpm'?{elementAttributes:{inputmode:'decimal'}}:{},
  cellClick:(_event,cell)=>void preview(cell.getRow().getData()),
 }));
}
function updateColumns(){
 table.setColumns(columnDefinitions());
 $('column-select').replaceChildren(new Option('Custom column…',''),...columns.filter(c=>!core.includes(c)).map(c=>new Option(c,c)));
}
async function save(){
 if(saving)return false;
 if(revision===null){notice('Set an available media folder before saving.',true);return false;}
 if(!dirty)return true;
 saving=true;updateStatus();const version=editVersion;
 try{
  const result=await api('/api/library/save',{columns,rows:table.getData().map(row=>Object.fromEntries(columns.map(key=>[key,row[key]??'']))),revision});
  revision=result.revision;libraryChannel.postMessage('changed');
  if(version===editVersion)dirty=false;
  notice('Saved. Described footage and custom attributes are available to Jev.');
  return true;
 }catch(error){notice(error.message,true);return false;}
 finally{saving=false;updateStatus();}
}
async function preview(row){
 if(selected?.id===row.id&&selected?.path===row.path)return;
 selected={...row};$('remove-row').disabled=false;
 const version=++previewVersion, video=$('preview');video.pause();video.removeAttribute('src');video.load();
 $('preview-name').textContent=row.name;$('preview-state').textContent='Preparing preview…';
 try{
  const {asset}=await api('/api/library/preview',{path:row.path});
  for(let i=0;i<600&&version===previewVersion;i++){
   const job=await api('/api/asset/'+asset);if(version!==previewVersion)return;
   if(job.state==='error')throw Error(job.error);
   if(job.state==='ready'){
    video.src=job.url;video.playbackRate=1;
    try{await video.play();}catch{/* Native controls allow playback when autoplay is blocked. */}
    if(version===previewVersion)$('preview-state').textContent='Original speed · local playback';
    return;
   }
   await new Promise(resolve=>setTimeout(resolve,500));
  }
  if(version===previewVersion)throw Error('Preview timed out. Select another row and retry.');
 }catch(error){if(version===previewVersion)$('preview-state').textContent=error.message;}
}
async function addPaths(paths){
 if(!paths.length)return;
 notice('Finding videos…');
 const result=await api('/api/library/import',{paths});
 const existing=table.getData(),ids=new Set(existing.map(r=>r.id)),knownPaths=new Set(existing.map(r=>r.path));
 const rows=result.rows.filter(r=>!ids.has(r.id)&&!knownPaths.has(r.path));
 for(const row of rows)for(const col of columns)if(!(col in row))row[col]='';
 if(rows.length){await table.addData(rows);changed();}
 notice(`Added ${rows.length} footage. ${result.rows.length-rows.length} already in the library.`+(result.errors.length?'\n'+result.errors.join('\n'):''),!!result.errors.length);
 if(rows.length&&!selected)void preview(rows[0]);
}
function lines(value){return value.split(/\r?\n/).map(s=>s.trim().replace(/^['"](.*)['"]$/,'$1')).filter(Boolean);}
async function run(action){try{await action();}catch(error){notice(error.message,true);}}
$('save').addEventListener('click',()=>{document.activeElement?.blur();void save();});
$('library-table').addEventListener('input',changed);
$('save-roots').addEventListener('click',()=>void run(async()=>{
 const result=await api('/api/library/roots',{roots:lines($('roots').value)});
 $('roots').value=result.roots.join('\n');$('roots-summary').textContent=result.roots.join(' · ');
 if(revision===null){revision=result.catalog.revision;await table.replaceData(result.catalog.rows);updateStatus();}
 libraryChannel.postMessage('changed');
 notice('Media folders saved. Drop videos to add them.');
}));
$('import-paths').addEventListener('click',()=>void run(()=>addPaths(lines($('paths').value))));
$('search').addEventListener('input',()=>{
 const query=$('search').value.trim().toLowerCase();
 table.setFilter(row=>columns.some(c=>String(row[c]??'').toLowerCase().includes(query)));
});
$('add-column').addEventListener('click',()=>{
 const name=$('column-name').value.trim();
 if(!/^[\p{L}\p{N}_ .-]{1,80}$/u.test(name)||columns.includes(name)||['__proto__','constructor','prototype'].includes(name)){notice('Choose a unique column name using letters, numbers, spaces, dots, underscores or hyphens.',true);return;}
 columns.push(name);for(const row of table.getData())row[name]='';updateColumns();changed();$('column-name').value='';
});
$('remove-column').addEventListener('click',()=>{
 const name=$('column-select').value;if(!name||core.includes(name))return;
 columns=columns.filter(c=>c!==name);for(const row of table.getData())delete row[name];updateColumns();changed();
});
$('remove-row').addEventListener('click',()=>void run(async()=>{
 if(!selected)return;
 await table.deleteRow(selected.id);selected=null;++previewVersion;
 $('preview').pause();$('preview').removeAttribute('src');$('preview').load();$('preview-name').textContent='Select footage to preview';$('preview-state').textContent='Original speed · local playback';$('remove-row').disabled=true;changed();
 notice('Row removed. The video file is unchanged. Save to apply.');
}));
$('export').addEventListener('click',()=>void run(async()=>{
 if(!await save())return;
 const a=document.createElement('a');a.href='/api/library/csv';a.download='footage.csv';a.click();
}));

async function droppedFiles(files){
 if(!files.length)return;
 notice('Matching videos in your media folders…');
 const result=await api('/api/library/resolve',{files:files.map(f=>({name:f.name,size:f.size,relative_path:f.webkitRelativePath||f.relativePath||''}))});
 const unique=result.files.filter(f=>f.matches.length===1).map(f=>f.matches[0]);
 const unresolved=result.files.filter(f=>f.matches.length!==1);
 if(unique.length)await addPaths(unique);
 if(!unresolved.length){$('matches-panel').hidden=true;return;}
 $('matches').replaceChildren(...unresolved.map(file=>{
  const row=document.createElement('div');row.className='match-row';
  const label=document.createElement('span');label.textContent=file.name;row.append(label);
  if(file.matches.length){
   const select=document.createElement('select');select.setAttribute('aria-label',`Path for ${file.name}`);
   select.append(new Option('Choose the original file…',''),...file.matches.map(p=>new Option(p,p)));row.append(select);
  }else{
   const text=document.createElement('span');text.className='missing';text.textContent='Not found. Add its media folder above, or paste its path.';row.append(text);
  }
  return row;
 }));$('matches-panel').hidden=false;
 notice(`${unique.length} matched; ${unresolved.length} need your attention.`);
}
$('add-matches').addEventListener('click',()=>void run(async()=>{
 const selects=[...$('matches').querySelectorAll('select')].filter(el=>el.value);
 if(!selects.length){notice('Choose a path first.',true);return;}
 await addPaths(selects.map(el=>el.value));for(const select of selects)select.parentElement.remove();
 if(!$('matches').children.length)$('matches-panel').hidden=true;
}));
$('dismiss-matches').addEventListener('click',()=>{$('matches-panel').hidden=true;});
$('browse').addEventListener('click',event=>{event.stopPropagation();$('files').click();});
$('drop-zone').addEventListener('click',event=>{if(event.target!==$('files'))$('files').click();});
$('drop-zone').addEventListener('keydown',event=>{if(event.target===$('drop-zone')&&['Enter',' '].includes(event.key)){event.preventDefault();$('files').click();}});
$('files').addEventListener('change',()=>void run(async()=>{await droppedFiles([...$('files').files]);$('files').value='';}));
const zone=$('drop-zone');
for(const type of ['dragenter','dragover'])zone.addEventListener(type,event=>{event.preventDefault();zone.classList.add('dragging');});
zone.addEventListener('dragleave',()=>zone.classList.remove('dragging'));
zone.addEventListener('drop',event=>{
 event.preventDefault();zone.classList.remove('dragging');
 // Capture File objects synchronously; drop data is protected after this event.
 const files=[...event.dataTransfer.files];
 if(files.length)void run(()=>droppedFiles(files));
 else void run(()=>addPaths(lines(event.dataTransfer.getData('text/plain'))));
});
// Keep a drop outside the target from navigating away and discarding edits.
window.addEventListener('dragover',event=>event.preventDefault());window.addEventListener('drop',event=>event.preventDefault());
window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
try{
 const data=await api('/api/library');token=data.token;revision=data.revision;columns=data.columns;missing=new Set(data.missing);
 $('roots').value=data.roots.join('\n');$('roots-summary').textContent=data.roots.join(' · ');
 table=new Tabulator('#library-table',{data:data.rows,index:'id',columns:columnDefinitions(),nestedFieldSeparator:false,
  height:'max(320px, calc(100vh - 465px))',layout:'fitColumns',placeholder:'Drop videos or add paths to start your library.',
  editTriggerEvent:'dblclick',selectableRows:1,
  rowFormatter:row=>{const record=row.getData();row.getCell('desc')?.getElement().classList.toggle('needs-desc',!record.desc?.trim());row.getCell('path')?.getElement().classList.toggle('file-missing',missing.has(record.id));},
 });
 table.on('cellEdited',cell=>{changed();if(selected?.id===cell.getRow().getData().id){$('preview-name').textContent=cell.getRow().getData().name;}});
 table.on('rowClick',(_event,row)=>void preview(row.getData()));
 table.on('tableBuilt',()=>{updateColumns();updateStatus();if(data.setup_message)notice(data.setup_message,true);});
}catch(error){notice(error.message,true);$('save-state').textContent='Could not load library';}
