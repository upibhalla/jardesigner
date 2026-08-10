##############################################
# neuromorpho_routes.py — Flask routes for NeuroMorpho.org
##############################################
import json
import traceback
from pathlib import Path

from flask import Blueprint, jsonify, request

from .neuromorpho import (
    fetch_species,
    fetch_neuron_metadata,
    fetch_neuron_by_id,
    fetch_swc_direct,
    search_neurons,
)

neuromorpho_routes = Blueprint("neuromorpho", __name__)

# Cache directory for species metadata (shared across sessions)
_CACHE_DIR = Path("metadata") / "neuromorpho"
_CACHE_DIR.mkdir(parents=True, exist_ok=True)

USER_UPLOADS_DIR = Path(__file__).resolve().parent.parent / "user_uploads"


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@neuromorpho_routes.route("/", methods=["GET"])
def get_species():
    """GET /neuromorpho/  — list all available species."""
    try:
        return jsonify({"species": fetch_species()})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@neuromorpho_routes.route("/metadata", methods=["GET"])
def get_metadata():
    """
    GET /neuromorpho/metadata?species=rat
    Returns brain regions, cell types, archives for the species.
    Result is cached in metadata/neuromorpho/<safe_name>.json.
    """
    species = request.args.get("species")
    if not species:
        return jsonify({"error": "species query param required"}), 400

    safe_name = species.strip().lower().replace(" ", "_")
    cache_file = _CACHE_DIR / f"{safe_name}.json"
    if cache_file.exists():
        try:
            return jsonify(json.loads(cache_file.read_text()))
        except Exception:
            cache_file.unlink(missing_ok=True)

    try:
        result = fetch_neuron_metadata(species)
        cache_file.write_text(json.dumps(result, indent=2))
        return jsonify(result)
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@neuromorpho_routes.route("/search", methods=["POST"])
def search():
    """
    POST /neuromorpho/search
    Body: { species, brain_region, cell_type, archive, page, size }
    """
    body = request.get_json(force=True, silent=True) or {}

    species      = body.get("species") or None
    brain_region = body.get("brain_region") or None
    cell_type    = body.get("cell_type") or None
    archive      = body.get("archive") or None
    page         = body.get("page", 0)
    size         = body.get("size", 20)

    try:
        result = search_neurons(
            species=species,
            brain_region=brain_region,
            cell_type=cell_type,
            archive=archive,
            page=page,
            size=size,
        )
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

    neurons = result.get("_embedded", {}).get("neuronResources", [])
    page_info = result.get("page", {})
    current_page = page_info.get("number", 0)
    total_pages = page_info.get("totalPages", 0)

    return jsonify({
        "neurons": neurons,
        "page": page_info,
        "total_pages": total_pages,
        "current_page": current_page,
        "has_next": current_page < total_pages - 1,
        "has_prev": current_page > 0,
    })


def stage_neuron(neuron_id: int, client_id: str) -> dict:
    """Download SWC for neuron_id and save to the user's session directory.
    Returns {"filename": "<name>.swc"}. Raises on failure."""
    rec = fetch_neuron_by_id(neuron_id)
    archive = rec.get("archive", "")
    name = rec.get("neuron_name", "")
    if not archive or not name:
        raise ValueError(f"Missing archive or neuron_name for neuron {neuron_id}")

    successes, failures = fetch_swc_direct(archive, name, neuron_id)
    if not successes:
        raise RuntimeError(f"SWC download failed: {failures}")

    swc = successes[0]
    filename = f"{swc.neuron_name}.swc"
    dest_dir = USER_UPLOADS_DIR / client_id
    dest_dir.mkdir(parents=True, exist_ok=True)
    (dest_dir / filename).write_text(swc.swc_content, encoding="utf-8")
    return {"filename": filename}


@neuromorpho_routes.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})
