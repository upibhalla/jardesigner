import os
import json
import re
import subprocess
import moose
from collections import defaultdict, OrderedDict
import matplotlib.colors

# --- 1. COLORING UTILITIES (Ported from GSgraph_new.py) ---

# Get standard matplotlib colors
matplotcolors = []
for name, hexno in matplotlib.colors.cnames.items():
    matplotcolors.append(name)

ignorecolors = [
    'yellow', "chartreuse", "peachpuff", "paleturquoise", "palegreen", "olive", "slategray", 
    "slategrey", "lavenderblush", "lemonchiffon", "lightblue", "lightcyan", "lightgoldenrodyellow", 
    "lavender", "khaki", "seashell", "gainsboro", "burlywood", "darkgrey", "darkgray", 
    "palegoldenrod", "linen", "silver", "darkkhaki", "lightpink", "mediumpurple", "lightgreen", 
    "thistle", "papayawhip", "preachpuff", "pink", "tan", "powderBlue", "navajowhite", 
    "moccasin", "mistyrose", "lightgrey", "lightgray", "grey", "gray", "aquamarine", 
    "cadetblue", "white", "wheat", "aqua", "whitesmoke", "mintcream", "oldlace", "black", 
    "snow", "aliceblue", "azure", "cornsilk", "beige", "bisque", "blanchedalmond", 
    "antiquewhite", "lightyellow", "lightsteelblue", "ghostwhite", "floralwhite", "ivory", "honeydew"
]

def getColor(gIndex, fwd_rev="forward"):
    """Cycles through matplotlib colors, skipping ignored ones."""
    if gIndex < len(matplotcolors):
        grpcolor = matplotcolors[gIndex]
        if grpcolor in ignorecolors:
            if fwd_rev == "reverse":
                gIndex = gIndex - 1
            else:
                gIndex = gIndex + 1
            return getColor(gIndex, fwd_rev)
        else:
            if fwd_rev == "reverse":
                gIndex = gIndex - 1
            else:
                gIndex = gIndex + 1
            return (grpcolor, gIndex)
    else:
        return getColor(0)

# --- 2. HELPER FUNCTIONS ---

def _sanitize_id(name):
    """Ensures names are valid DOT identifiers (alphanumeric + underscore)."""
    return re.sub(r'[^a-zA-Z0-9_]', '_', name)

def _get_metadata(element):
    """Extracts simulation constants."""
    meta = {
        "name": element.name,
        "className": element.className,
        "path": element.path
    }
    if element.className in ['Pool', 'BufPool']:
        meta["concInit"] = element.concInit
        meta["nInit"] = element.nInit
    elif element.className == 'Reac':
        meta["Kf"] = element.Kf
        meta["Kb"] = element.Kb
    elif element.className in ['Enz', 'MMenz']:
        meta["Km"] = getattr(element, 'Km', 0)
        meta["kcat"] = getattr(element, 'kcat', 0)
    return meta

def findGroup_compt(melement):
    """Finds the visual parent group."""
    curr = melement.parent
    while not (curr.className in ["Neutral", "ChemCompt", "CubeMesh", "CyclMesh", "Shell"]):
        if curr.path == '/': break
        curr = curr.parent
    return curr

def countX(lst, x):
    """Counts occurrences of item x in list lst."""
    return lst.count(x)

def unique(list1):
    """Returns unique elements preserving order."""
    output = []
    for x in list1:
        if x not in output:
            output.append(x)
    return output

# --- 3. MAIN GRAPH GENERATION ---

def get_reaction_graph(model_root, view_options=None):
    print(f"--- GraphGen: Starting generation for root: {model_root} ---")
    
    if not moose.exists(model_root):
        print(f"Error: Model root {model_root} does not exist.")
        return None

    # State Containers
    groupmap = defaultdict(list)    # GroupPath -> [NodeID]
    element_map = {}                # NodeID -> MooseObj
    metadata_map = {}               # NodeID -> MetadataDict
    node_colors = {}                # NodeID -> Hex/ColorName
    group_colors = {}               # GroupPath -> Hex/ColorName
    enz_cplx_nodes = set()          # IDs of Enzymes acting as complex substrates
    
    # Color Index Iterator
    color_idx = len(matplotcolors) - 1

    # --- A. Collect Groups & Assign Group Colors ---
    # We scan for display groups first to assign their colors
    displayGroups = []
    
    # Simple logic: Find all Neutrals/ChemCompts that contain relevant items
    # (Simplified from GSgraph logic to just color used groups)
    
    # --- B. Collect Nodes & Assign Node Colors ---
    
    # 1. Pools (ISA=PoolBase)
    for pool in moose.wildcardFind(f"{model_root}/##[ISA=PoolBase]"):
        if pool.parent.className == 'Enz': continue # Handled with Enz

        node_id = _sanitize_id(pool.name)
        grp = findGroup_compt(pool)
        
        # Color Assignment
        c, color_idx = getColor(color_idx)
        node_colors[node_id] = c
        
        # Add to maps
        groupmap[grp.path].append(node_id)
        element_map[node_id] = pool
        metadata_map[node_id] = _get_metadata(pool)

        # Assign Group Color if new
        if grp.path not in group_colors:
            gc, color_idx = getColor(color_idx)
            group_colors[grp.path] = gc

    # 2. Channels
    for chan in moose.wildcardFind(f"{model_root}/##[ISA=ConcChan]"):
        node_id = _sanitize_id(chan.name)
        grp = findGroup_compt(chan)
        
        groupmap[grp.path].append(node_id)
        element_map[node_id] = chan
        metadata_map[node_id] = _get_metadata(chan)
        if grp.path not in group_colors:
            gc, color_idx = getColor(color_idx)
            group_colors[grp.path] = gc

    # 3. Enzymes
    for enz in moose.wildcardFind(f"{model_root}/##[ISA=EnzBase]"):
        node_id = _sanitize_id(enz.name)
        grp = findGroup_compt(enz)
        
        groupmap[grp.path].append(node_id)
        element_map[node_id] = enz
        metadata_map[node_id] = _get_metadata(enz)
        if grp.path not in group_colors:
            gc, color_idx = getColor(color_idx)
            group_colors[grp.path] = gc

    # 4. Reactions
    for reac in moose.wildcardFind(f"{model_root}/##[ISA=Reac]"):
        node_id = _sanitize_id(reac.name)
        grp = findGroup_compt(reac)
        
        groupmap[grp.path].append(node_id)
        element_map[node_id] = reac
        metadata_map[node_id] = _get_metadata(reac)
        if grp.path not in group_colors:
            gc, color_idx = getColor(color_idx)
            group_colors[grp.path] = gc

        # Check for Complex Usage (Enzymes as substrates)
        for sub in reac.neighbors['sub']:
            if sub.parent.className == 'Enz':
                enz_id = _sanitize_id(sub.parent.name)
                enz_cplx_nodes.add(enz_id)

    # 5. Functions
    for func in moose.wildcardFind(f"{model_root}/##[ISA=Function]"):
        node_id = _sanitize_id(func.name)
        grp = findGroup_compt(func)
        
        groupmap[grp.path].append(node_id)
        element_map[node_id] = func
        metadata_map[node_id] = _get_metadata(func)
        if grp.path not in group_colors:
            gc, color_idx = getColor(color_idx)
            group_colors[grp.path] = gc

    # --- C. Generate DOT Content ---
    
    dot_lines = [
        "digraph ReactionGraph {",
        "rankdir=LR;", 
        "compound=true;",
        "ranksep=0.5;",
        "node [fontsize=12 fontname=\"Arial\" penwidth=2];",
        "edge [fontsize=10 fontname=\"Arial\"];"
    ]

    # Sort groups for consistent output
    sorted_groups = sorted(groupmap.keys())
    
    for i, grp_path in enumerate(sorted_groups):
        grp_obj = moose.element(grp_path)
        cluster_id = f"cluster_{i}"
        
        # Group Styling
        g_color = group_colors.get(grp_path, "black")
        
        dot_lines.append(f'\nsubgraph "{cluster_id}" {{')
        dot_lines.append(f'label="{grp_obj.name}";')
        dot_lines.append(f'color="{g_color}";')
        dot_lines.append('style="rounded";') # Border style
        dot_lines.append('fontsize=14;')
        dot_lines.append('margin=10;')

        # Render Nodes within Group
        for node_id in groupmap[grp_path]:
            element = element_map[node_id]
            color = node_colors.get(node_id, "white") # Default white if not assigned
            
            # -- Shape & Style Definitions matching GSgraph_new --
            if element.className in ['Pool', 'BufPool']:
                # Pools: Colored, Box (rect)
                dot_lines.append(f'"{node_id}" [label="{element.name}", shape="rect", style="filled", fillcolor="{color}", color="black"];')
            
            elif element.className == 'Reac':
                # Reactions: Small Square, white/empty
                dot_lines.append(f'"{node_id}" [label="", shape="square", width=0.2, height=0.2, style="filled", fillcolor="white", color="black"];')
                
            elif element.className in ['Enz', 'MMenz']:
                # Enzyme: Circle or Mrecord (if complex)
                if node_id in enz_cplx_nodes:
                    # Mrecord for Complex
                    dot_lines.append(f'"{node_id}" [label="{{<e>|<c>}}", shape="Mrecord", style="filled", fillcolor="white", color="black"];')
                elif element.className == 'MMenz':
                    dot_lines.append(f'"{node_id}" [label="", shape="doublecircle", width=0.2, style="filled", fillcolor="white", color="black"];')
                else:
                    dot_lines.append(f'"{node_id}" [label="", shape="circle", width=0.15, style="filled", fillcolor="white", color="black"];')
            
            elif element.className == 'ConcChan':
                dot_lines.append(f'"{node_id}" [label="", shape="noverhang", width=1, style="filled", fillcolor="#e0f7fa", color="black"];')

            elif element.className == 'Function':
                lbl = element.name
                if lbl.startswith("plus"): lbl = "+"
                if lbl.startswith("sigma"): lbl = "&Sigma;"
                dot_lines.append(f'"{node_id}" [label="{lbl}", shape="circle", width=0.2, margin=0];')

        dot_lines.append("}") # End Cluster

    # --- D. Generate Edges (with Logic for Counts/Labels & Dashed Lines) ---
    
    # 1. Reactions
    for reac in moose.wildcardFind(f"{model_root}/##[ISA=Reac]"):
        reac_id = _sanitize_id(reac.name)
        
        # Substrates (Input -> Reac)
        subs = reac.neighbors['sub']
        unique_subs = unique(subs)
        
        for sub in unique_subs:
            # Count stoichiometry
            count = countX(subs, sub)
            label_attr = f'label="{count}"' if count > 1 else ''
            
            # Determine source ID
            if sub.parent.className == 'Enz':
                src_id = _sanitize_id(sub.parent.name)
                # From Complex side of enzyme
                dot_lines.append(f'"{src_id}":c -> "{reac_id}" [arrowhead="normal", {label_attr}];')
            else:
                src_id = _sanitize_id(sub.name)
                if src_id in element_map:
                    dot_lines.append(f'"{src_id}" -> "{reac_id}" [arrowhead="normal", {label_attr}];')
        
        # Products (Reac -> Output)
        prds = reac.neighbors['prd']
        unique_prds = unique(prds)
        
        for prd in unique_prds:
            count = countX(prds, prd)
            label_attr = f'label="{count}"' if count > 1 else ''
            dest_id = _sanitize_id(prd.name)
            
            if dest_id in element_map:
                dot_lines.append(f'"{reac_id}" -> "{dest_id}" [arrowhead="vee", {label_attr}];')

    # 2. Enzymes
    for enz in moose.wildcardFind(f"{model_root}/##[ISA=EnzBase]"):
        enz_id = _sanitize_id(enz.name)
        
        # A. Parent Pool -> Enzyme Site (DASHED LINE)
        # This explicitly handles "Enzyme parents not identified"
        parent = enz.parent
        if parent.className in ['Pool', 'BufPool']:
            src_id = _sanitize_id(parent.name)
            # Dashed line, no arrowhead
            dot_lines.append(f'"{src_id}" -> "{enz_id}" [style="dashed", arrowhead="none", weight=0];')

        # B. Substrates -> Enzyme
        subs = enz.neighbors['sub']
        unique_subs = unique(subs)
        for sub in unique_subs:
            count = countX(subs, sub)
            label_attr = f'label="{count}"' if count > 1 else ''
            src_id = _sanitize_id(sub.name)
            # To Enzyme side
            port = ":e" if enz_id in enz_cplx_nodes else ""
            dot_lines.append(f'"{src_id}" -> "{enz_id}"{port} [arrowhead="normal", {label_attr}];')

        # C. Enzyme -> Products
        prds = enz.neighbors['prd']
        unique_prds = unique(prds)
        for prd in unique_prds:
            count = countX(prds, prd)
            label_attr = f'label="{count}"' if count > 1 else ''
            dest_id = _sanitize_id(prd.name)
            # From Enzyme side
            port = ":e" if enz_id in enz_cplx_nodes else ""
            dot_lines.append(f'"{enz_id}"{port} -> "{dest_id}" [arrowhead="vee", {label_attr}];')

    # 3. Functions
    for func in moose.wildcardFind(f"{model_root}/##[ISA=Function]"):
        func_id = _sanitize_id(func.name)
        if moose.exists(func.path + '/x'):
            inputs = moose.element(func.path+'/x').neighbors['input']
            unique_inputs = unique(inputs)
            for inp in unique_inputs:
                count = countX(inputs, inp)
                label_attr = f'label="{count}"' if count > 1 else ''
                src_id = _sanitize_id(inp.name)
                dot_lines.append(f'"{src_id}" -> "{func_id}" [arrowhead="vee", {label_attr}];')
        
        # Outputs
        outs = func.neighbors['valueOut']
        unique_outs = unique(outs)
        for out in unique_outs:
            count = countX(outs, out)
            label_attr = f'label="{count}"' if count > 1 else ''
            dest_id = _sanitize_id(out.name)
            dot_lines.append(f'"{func_id}" -> "{dest_id}" [arrowhead="vee", {label_attr}];')
    
    # 4. Channels
    for chan in moose.wildcardFind(f"{model_root}/##[ISA=ConcChan]"):
        chan_id = _sanitize_id(chan.name)
        # Parent -> Chan (Parameter/Dashed)
        if chan.parent:
            src_id = _sanitize_id(chan.parent.name)
            dot_lines.append(f'"{src_id}" -> "{chan_id}" [style="dashed", arrowhead="none"];')
        
        # InPool
        for sub in unique(chan.neighbors['inPoolOut']):
             src_id = _sanitize_id(sub.name)
             dot_lines.append(f'"{src_id}" -> "{chan_id}" [arrowhead="normal"];')
        
        # OutPool
        for prd in unique(chan.neighbors['outPoolOut']):
            dest_id = _sanitize_id(prd.name)
            dot_lines.append(f'"{chan_id}" -> "{dest_id}" [arrowhead="vee"];')

    dot_lines.append("}") # Close Digraph

    # --- E. Execution ---
    dot_content = "\n".join(dot_lines)
    
    # Debug: Print DOT to check labels
    # print(dot_content)

    try:
        process = subprocess.Popen(
            ['dot', '-Tjson'], 
            stdin=subprocess.PIPE, 
            stdout=subprocess.PIPE, 
            stderr=subprocess.PIPE,
            text=True
        )
        stdout, stderr = process.communicate(input=dot_content)
        
        if process.returncode != 0:
            print(f"Graphviz Error: {stderr}")
            return None
            
        layout_json = json.loads(stdout)
        
        # Inject metadata
        for obj in layout_json.get('objects', []):
            node_id = obj.get('name')
            if node_id in metadata_map:
                obj['metadata'] = metadata_map[node_id]
                
        return layout_json

    except Exception as e:
        print(f"Error: {e}")
        return None

