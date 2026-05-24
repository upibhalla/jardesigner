# ProtoPicker Integration Spec

This file is intended to be imported into a Claude Code session via a single line in
`CLAUDE.md`:

```
@/path/to/jardesigner/docs/ProtoPicker_spec.md
```

It defines the complete contract for adding a new external database to the ProtoPicker
system in jardesigner. The implementor owns the database access code; this spec defines
exactly how to connect it.

---

## Architecture in one sentence

The frontend sends `GET /proto_search/morpho|chan|chem?q=<query>&db=<DbName>` to the
Flask backend. The backend calls the appropriate DB API, maps results to the item schema
below, and returns `{"items": [...]}`. The frontend displays results identically
regardless of source.

---

## The item schema

Every item returned by any endpoint must conform to this structure:

```json
{
  "id":          "unique_string",
  "name":        "Display name shown in table",
  "source":      "Author/DB Year",
  "description": "One-line description shown in table",
  "topTen":      false,
  "source_type": "builtin|file|kkit|sbml|neuroml|parametric",
  "builtin_fn":  "make_Na()",
  "server_file": "MODELS/relative/path.g",
  "details": {
    "full_description": "Longer text shown in detail panel",
    "parameters": {
      "param_name": { "value": "0.12", "units": "S/m²" }
    },
    "image_url":  "https://...",
    "references": [{ "text": "Author (year) ...", "url": "https://..." }],
    "notes":      "Implementation notes"
  }
}
```

**Required fields:** `id`, `name`, `source`, `description`, `source_type`  
**Optional:** all others; omit rather than set to null

### source_type values and their effects

| source_type | Meaning | What the frontend does on select |
|-------------|---------|----------------------------------|
| `builtin`   | MOOSE built-in function | Uses `id` directly as the proto type |
| `file`      | Morphology file on server | Stages `server_file` to user_uploads |
| `neuroml`   | NeuroML file (chan)     | Stages `server_file`, sets type='File' |
| `sbml`      | SBML file (chem)       | Stages `server_file`, sets type='sbml' |
| `kkit`      | GENESIS kkit file (chem) | Stages `server_file`, sets type='kkit' |
| `parametric`| Procedural morphology  | Switches to the parametric tab given by `morpho_type` field |

For external DB results that return downloadable files, use `sbml`/`kkit`/`neuroml`/`file`
and implement the staging endpoint to download the file on demand (see Staging below).

### topTen flag

`"topTen": true` pins the item above all others with a gold highlight. Use sparingly —
at most 10 per proto_type. For dynamic search results from external DBs, leave false.

---

## The four endpoints

All are in `backend/server.py`. Implementors only need to modify `search_protos`.

### 1. GET /proto_digest/\<type\>
Returns all local registry items for initial display when the dialog opens.
**No changes needed** — reads from `backend/proto_registry/<type>_protos.json`.

### 2. GET /proto_search/\<type\>?q=\<query\>&db=\<DbName\>
**This is the integration hook.** The `db` parameter matches the string in the
frontend's `DB_OPTIONS` dict. Currently only `'Local'` is handled.

To add a new database, add an `elif` branch **before** the local-search fallback:

```python
@app.route('/proto_search/<proto_type>', methods=['GET'])
def search_protos(proto_type):
    if proto_type not in ('morpho', 'chan', 'chem'):
        return jsonify({'error': 'Invalid type'}), 400
    q   = request.args.get('q', '').lower().strip()
    db  = request.args.get('db', 'Local')

    if db == 'NeuroMorpho':           # <-- add your branch here
        items = search_neuromorpho(q, proto_type)   # your function
        return jsonify({'items': items})

    elif db == 'BioModels':
        items = search_biomodels(q)
        return jsonify({'items': items})

    # Local fallback (already present)
    data = _load_registry(proto_type)
    ...
```

Your function `search_neuromorpho(q, proto_type)` calls your existing DB API code and
**returns a list of items conforming to the schema above**.

### 3. GET /proto_detail/\<proto_id\>
Returns the `details` object for a single item. For local registry items this is
automatic. For dynamic DB results, either embed full `details` in the search response
(preferred) or add a lookup branch here keyed on an ID prefix convention such as
`"nm_"`, `"bm_"`, etc.

### 4. POST /proto_stage/\<proto_id\>/\<client_id\>
Copies a server-side file to `user_uploads/<client_id>/` so the simulation engine can
find it. For external DB results, this is where you **download** the file from the
remote DB and save it to the session directory:

```python
elif proto_id.startswith('nm_'):       # NeuroMorpho item
    url  = neuromorpho_download_url(proto_id)
    data = requests.get(url).content
    filename = f"{proto_id}.swc"
    dest = os.path.join(USER_UPLOADS_DIR, client_id, filename)
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    with open(dest, 'wb') as f:
        f.write(data)
    return jsonify({'filename': filename})
```

The frontend uses the returned `filename` as the path passed to the simulation engine.

---

## Frontend DB_OPTIONS (read-only for implementors)

Located in `frontend/src/components/ProtoPickerDialog.jsx`:

```js
const DB_OPTIONS = {
    morpho: ['Local', 'NeuroMorpho'],
    chan:   ['Local', 'ModelDB', 'NeuroML-DB'],
    chem:   ['Local', 'BioModels', 'DOQCS'],
};
```

The strings here are exactly what arrive as the `db` query parameter. To add a new
database, add its name to this list **and** handle it in `search_protos`. The string
must match exactly.

---

## Registry JSON files (for static/curated items)

Located in `backend/proto_registry/`:
- `morpho_protos.json`
- `chan_protos.json`
- `chem_protos.json`

These hold the local curated items (the "Top 10" and others). Implementors can add
entries here for well-known items they want permanently available without a search.
The file format is `{"type": "morpho|chan|chem", "items": [...]}`.

---

## ID namespacing convention (recommended)

To avoid collisions between local and DB items, prefix IDs with a short DB tag:

| Database    | Prefix | Example             |
|-------------|--------|---------------------|
| Local       | (none) | `"Na_HH"`           |
| NeuroMorpho | `nm_`  | `"nm_cnic_001"`     |
| ModelDB     | `mdb_` | `"mdb_87284"`       |
| NeuroML-DB  | `nml_` | `"nml_HH_Na"`       |
| BioModels   | `bm_`  | `"bm_BIOMD0000001"` |
| DOQCS       | `dq_`  | `"dq_Ca_spine"`     |

---

## Checklist for a new DB integration

- [ ] Write `search_<db>(query)` → returns list of schema-conforming items
- [ ] Add `elif db == '<DbName>':` branch in `search_protos` in `server.py`
- [ ] If items are file-based: implement download in `stage_proto_file` in `server.py`
- [ ] Use `source_type` that matches the file format (`sbml`, `kkit`, `neuroml`, `file`)
- [ ] Confirm `<DbName>` matches the string already in `DB_OPTIONS` in `ProtoPickerDialog.jsx`
- [ ] (Optional) Add curated top items to the registry JSON for instant display on open
