#!/usr/bin/env python3
"""
Generate SWC morphology files from the axon geometries in jardesignerProtos.py.

Produces:
    axon.swc              — plain unmyelinated axon
    myelinated_axon.swc   — axon with nodes of Ranvier

Run standalone:
    python make_axon_swc.py

No MOOSE required.

SWC column order: index  type  x  y  z  radius  parent
  type 1 = soma, type 2 = axon
  coordinates and radius in micrometers
"""

import numpy as np


# ------------------------------------------------------------------ helpers --

def _write_swc(nodes, filename):
    """Write a list of (type, x, y, z, radius, parent) tuples to an SWC file.
    Nodes are 1-indexed; parent -1 means root."""
    with open(filename, 'w') as f:
        f.write("# SWC morphology\n")
        f.write("# index  type  x(um)  y(um)  z(um)  radius(um)  parent\n")
        for idx, (t, x, y, z, r, parent) in enumerate(nodes, 1):
            f.write(f"{idx}  {t}  {x:.4f}  {y:.4f}  {z:.4f}  {r:.4f}  {parent}\n")
    print(f"Wrote {len(nodes)} nodes → {filename}")


def _axon_nodes(compt_len, num_segments, axon_dia_fn):
    """
    Compute the list of (type, x, y, z, r, parent) nodes for the axon portion.
    axon_dia_fn(i) returns the diameter of segment i (in metres).

    Replicates the spiral trajectory from jardesignerProtos.make_axon /
    make_myelinated_axon exactly: dx/dy are derived from theta *before*
    theta is updated each iteration.
    """
    nodes = []
    theta = 0.0
    x = compt_len      # start of first axon segment = end of soma
    y = 0.0
    parent = 1

    for i in range(num_segments):
        dx = compt_len * np.cos(theta)
        dy = compt_len * np.sin(theta)
        r  = np.sqrt(x * x + y * y)
        theta += compt_len / r

        x_end = x + dx
        y_end = y + dy
        radius_um = axon_dia_fn(i) / 2 * 1e6   # metres → micrometres
        nodes.append((3, x_end * 1e6, y_end * 1e6, 0.0, radius_um, parent))
        parent = len(nodes) + 3   # +3 because soma occupies nodes 1, 2, 3
        x = x_end
        y = y_end

    return nodes


# ------------------------------------------------------------------ public --

def make_axon_swc(
        soma_dia      = 10e-6,
        compt_len     = 10e-6,
        axon_dia      = 2e-6,
        num_segments  = 200,
        output_file   = 'axon.swc'):
    """Convert make_axon() geometry to SWC."""

    soma_r = soma_dia / 2 * 1e6    # micrometres
    nodes = [
        (1,  compt_len*1e6/2,  0.0, 0.0, soma_r, -1),   # soma start (root)
        (1,  0.0,              0.0, 0.0, soma_r,  1),   # soma left
        (1,  compt_len*1e6,    0.0, 0.0, soma_r,  1),   # soma right
    ]
    nodes += _axon_nodes(compt_len, num_segments, lambda i: axon_dia)
    _write_swc(nodes, output_file)


def make_myelinated_axon_swc(
        soma_dia      = 10e-6,
        compt_len     = 10e-6,
        axon_dia      = 2e-6,
        node_dia      = 1e-6,
        num_segments  = 405,
        node_spacing  = 100,
        output_file   = 'myelinated_axon.swc'):
    """Convert make_myelinated_axon() geometry to SWC.

    Segments at multiples of node_spacing are nodes of Ranvier (thin);
    all others are the thicker myelinated sheath.
    """

    soma_r = soma_dia / 2 * 1e6
    nodes = [
        (1,  compt_len*1e6/2,  0.0, 0.0, soma_r, -1),   # soma start (root)
        (1,  0.0,              0.0, 0.0, soma_r,  1),   # soma left
        (1,  compt_len*1e6,    0.0, 0.0, soma_r,  1),   # soma right
    ]

    def dia_fn(i):
        return node_dia if (i % node_spacing == 0) else axon_dia

    nodes += _axon_nodes(compt_len, num_segments, dia_fn)
    _write_swc(nodes, output_file)


# ----------------------------------------------------------------------- main

if __name__ == '__main__':
    make_axon_swc()
    make_myelinated_axon_swc()
