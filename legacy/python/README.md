# Legacy Python implementation

The Node app in `src/` is the maintained runtime. These files preserve the previous player, its tests, and the optional Resolume OSC bridge. They are not needed by `npm run dev`.

Run the bridge from the repository root (Python 3.9+):

```sh
python3 legacy/python/server.py
```

Its UI and OSC mapping are `index.html`, `app.js`, `style.css` and `catalog.json` in this directory. The API key is read from the repository environment or root `.env`.

Run the preserved Python tests:

```sh
python3 -m unittest discover -s legacy/python -p 'test_*.py'
```

`verify_live.py` is a manual live integration check: it calls Jev and sends commands to Resolume. It is not part of the test suite.
