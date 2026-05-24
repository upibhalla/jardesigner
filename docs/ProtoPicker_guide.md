# ProtoPicker Integration Guide

**For:** Developers adding external database support to jardesigner's prototype picker  
**Prerequisite:** You have working code that calls your target database API and retrieves model records

---

## What the ProtoPicker is

Jardesigner's ProtoPicker is a modal dialog used in three places: morphology selection
(MorphoMenuBox), channel selection (ChanMenuBox), and chemical model selection
(ChemMenuBox). It shows a curated list of locally available prototypes and lets the
user search one or more external databases. Your job is to wire your existing database
API code into the search path.

When a user types a query and selects a database from the dropdown, the frontend calls:

```
GET /proto_search/<type>?q=<query>&db=<DatabaseName>
```

Your code handles that request, calls your DB API, maps the results to a common item
schema, and returns them. The frontend displays them identically to local items. That's
the entire integration.

---

## Files you will modify

You only need to touch **one file** for a basic integration:

```
backend/server.py          ← add your search branch here (required)
```

Optionally, if you want curated items to appear before any search is done:

```
backend/proto_registry/morpho_protos.json   ← morphology items
backend/proto_registry/chan_protos.json     ← channel/conductance items
backend/proto_registry/chem_protos.json    ← chemical model items
```

You do **not** modify any frontend files unless you need to add a new database name to
the dropdown (see the DB_OPTIONS section in `ProtoPicker_spec.md`).

---

## The mapping task

Your database returns records in its own format. You need to map each record to the
ProtoPicker item schema. The full schema is in `ProtoPicker_spec.md`. The fields that
matter most for search results are:

```
id          → a unique string; prefix with your DB tag (e.g. "nm_", "bm_")
name        → the model/cell name shown in the table
source      → "AuthorName DB Year" — shown in the Source column
description → one sentence — shown in the Description column
source_type → the file format: "sbml", "kkit", "neuroml", "file" (see spec)
details     → optional richer information shown in the side panel
```

### Example mappings (illustrative — adapt to your actual API responses)

**NeuroMorpho → morpho item**
```python
def nm_record_to_item(record):
    return {
        "id":          f"nm_{record['neuron_id']}",
        "name":        record['neuron_name'],
        "source":      f"NeuroMorpho / {record['archive']}",
        "description": f"{record['species']} {record['brain_region']} {record['cell_type']}",
        "source_type": "file",
        "topTen":      False,
        "details": {
            "full_description": record.get('note', ''),
            "references": [{"text": record.get('reference', ''), "url": record.get('doi', '')}]
        }
    }
```

**BioModels → chem item**
```python
def bm_record_to_item(record):
    return {
        "id":          f"bm_{record['biomdId']}",
        "name":        record['name'],
        "source":      f"BioModels / {record.get('submitter', '')}",
        "description": record.get('description', '')[:120],
        "source_type": "sbml",
        "topTen":      False,
        "details": {
            "full_description": record.get('description', ''),
            "references": [{"text": r['citation'], "url": r.get('url', '')}
                           for r in record.get('references', [])]
        }
    }
```

**ModelDB → chan item**
```python
def mdb_record_to_item(record):
    return {
        "id":          f"mdb_{record['id']}",
        "name":        record['name'],
        "source":      f"ModelDB / {record.get('authors', '')}",
        "description": record.get('description', '')[:120],
        "source_type": "neuroml",
        "topTen":      False,
        "details": {
            "full_description": record.get('description', ''),
            "references": [{"text": record.get('reference', '')}]
        }
    }
```

These are structural templates. Field names will differ from your actual API responses —
use them as a guide for the mapping, not as working code.

---

## Wiring into server.py

Open `backend/server.py` and find the `search_protos` function (~line 239). It currently
looks like:

```python
@app.route('/proto_search/<proto_type>', methods=['GET'])
def search_protos(proto_type):
    if proto_type not in ('morpho', 'chan', 'chem'):
        return jsonify({'error': 'Invalid type'}), 400
    q   = request.args.get('q', '').lower().strip()
    db  = request.args.get('db', 'Local')          # ← add this line if not present
    data = _load_registry(proto_type)
    ...local search...
```

Add your branch **before** the local search fallback:

```python
    if db == 'NeuroMorpho' and proto_type == 'morpho':
        try:
            raw = your_neuromorpho_search_function(q)
            items = [nm_record_to_item(r) for r in raw]
            return jsonify({'items': items})
        except Exception as e:
            return jsonify({'error': str(e), 'items': []}), 500
```

Wrap in try/except so a DB timeout doesn't crash the server.

---

## File download (staging)

If your DB items are file-based, the user's click triggers:

```
POST /proto_stage/<proto_id>/<client_id>
```

Find `stage_proto_file` in `server.py`. Add a branch for your ID prefix:

```python
elif proto_id.startswith('nm_'):
    swc_url  = your_neuromorpho_download_url(proto_id[3:])   # strip "nm_"
    response = requests.get(swc_url, timeout=30)
    response.raise_for_status()
    filename = f"{proto_id}.swc"
    dest = os.path.join(USER_UPLOADS_DIR, client_id, filename)
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    with open(dest, 'wb') as f:
        f.write(response.content)
    return jsonify({'filename': filename})
```

The `filename` returned here is what the simulation engine receives as the morphology
source path.

---

## Adding curated items to the local registry

If there are specific models from your database that should always be visible (before
any search), add them directly to the appropriate JSON file in
`backend/proto_registry/`. Set `"topTen": true` for the most important ones (up to 10
per file). These appear immediately when the dialog opens.

---

## Testing your integration

1. Start the backend: `cd backend && python server.py`
2. In a browser, open the jardesigner app and open the relevant MenuBox (Morpho/Chan/Chem)
3. Click "Browse Library…"
4. Select your database from the dropdown
5. Type a search term and click Search
6. Verify items appear with correct name/source/description
7. Click an item name or the return-key icon to select it
8. Verify the prototype appears in the MenuBox tab

---

## Where to get help

- Full API contract: `docs/ProtoPicker_spec.md` in this repo
- Server endpoint code: `backend/server.py` lines ~210–290
- Registry examples: `backend/proto_registry/*.json`
- Frontend dialog (read-only reference): `frontend/src/components/ProtoPickerDialog.jsx`
- Questions: open an issue on the jardesigner repository
