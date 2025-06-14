# Model Documentation

This document explains the structure and key fields of the `model.json` file used in this application.

## Top-Level Fields

The JSON model has several primary keys that control the simulation.

| Key | Type | Description |
| --- | --- | --- |
| `runtime` | number | The total simulation time in seconds. |
| `elecDt` | number | The time step for electrical calculations. |
| `turnOffElec`| boolean | If `true`, electrical simulations are disabled. |

---

## Cell Morphology

The `cellProto` object defines the neuron's physical structure.

* **Segments**: Defined by `name`, `parent`, `L` (length), and `diam` (diameter).
* **Connectivity**: The `parent` key links a segment to its parent by name.

```json
"cellProto": {
  "soma": { "L": 20e-6, "diam": 20e-6, "parent": null },
  "dend": { "L": 500e-6, "diam": 1e-6, "parent": "soma" }
}
