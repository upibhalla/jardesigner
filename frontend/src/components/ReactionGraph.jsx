import React, { useMemo, useState, useEffect } from 'react';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Box, Paper, Typography, IconButton, ToggleButton, ToggleButtonGroup, Collapse, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { ZoomIn, ZoomOut, Refresh, Layers, ExpandLess, ExpandMore } from '@mui/icons-material';
import { parseSplineToPath } from '../utils/splineUtils';

// --- GEOMETRY HELPERS ---

// Calculates where a line should stop to touch the edge of an ellipse/circle
const getEllipseIntersect = (cx, cy, rx, ry, targetX, targetY) => {
    const dx = targetX - cx;
    const dy = targetY - cy;
    const angle = Math.atan2(dy, dx);
    return { 
        x: cx + rx * Math.cos(angle), 
        y: cy + ry * Math.sin(angle) 
    };
};

// Calculates where a line should stop to touch the edge of a rectangle
const getRectIntersect = (cx, cy, w, h, targetX, targetY) => {
    const dx = targetX - cx;
    const dy = targetY - cy;
    if (dx === 0 && dy === 0) return { x: cx, y: cy };
    
    // Avoid division by zero
    const halfW = w / 2;
    const halfH = h / 2;
    const scaleX = halfW / (Math.abs(dx) || 0.0001);
    const scaleY = halfH / (Math.abs(dy) || 0.0001);
    const scale = Math.min(scaleX, scaleY);

    return {
        x: cx + dx * scale,
        y: cy + dy * scale
    };
};

// --- COLOR HELPER ---
const extractColor = (obj, type = 'fill') => {
    let c;
    if (type === 'fill') {
        c = obj.fillcolor || obj.fill || obj.bgcolor;
        // Fallback: if style is filled but no color, use grey. If not filled, white.
        if (!c) {
             if (obj.style && obj.style.includes('filled')) return '#d3d3d3';
             return 'white';
        }
    } else {
        c = obj.color || obj.stroke;
        if (!c) return 'black';
    }
    // Handle Graphviz gradients "color1:color2"
    return c.split(':')[0]; 
};

const ReactionGraph = (props) => {
  const { graphData } = props;
  const [viewMode, setViewMode] = useState('reaction');
  const [hoveredNode, setHoveredNode] = useState(null);
  const [legendOpen, setLegendOpen] = useState(true);

  // --- DATA PROCESSING ---

  // 1. Node Map
  const nodeMap = useMemo(() => {
    if (!graphData?.objects) return {};
    return graphData.objects.reduce((acc, obj) => {
        acc[obj.name] = obj; // Map by Name (Graphviz ID)
        return acc;
    }, {});
  }, [graphData]);

  // 2. ViewBox
  const viewBox = useMemo(() => {
    if (!graphData?.bb) return "0 0 1000 1000";
    const bb = graphData.bb.split(",").map(parseFloat);
    const width = bb[2] - bb[0];
    const height = bb[3] - bb[1];
    return `${bb[0]} ${bb[1]} ${width} ${height}`;
  }, [graphData]);

  // --- RENDERING ---

  const renderObjects = () => {
    if (!graphData?.objects) return null;

    const clusters = [];
    const nodes = [];

    graphData.objects.forEach(obj => {
       if (obj.name.startsWith('cluster_')) clusters.push(obj);
       else nodes.push(obj);
    });

    const renderCluster = (obj) => {
        if (!obj.bb) return null;
        const [llx, lly, urx, ury] = obj.bb.split(',').map(parseFloat);
        const width = urx - llx;
        const height = ury - lly;
        const cx = llx + width / 2;
        const cy = ury - 14; 
        const titleText = obj.label || obj.name.replace(/^cluster_/, '');
        
        const fillColor = extractColor(obj, 'fill');
        const strokeColor = extractColor(obj, 'stroke');
        const isRounded = obj.style && obj.style.includes('rounded');

        return (
            <g key={obj._gvid}>
                 <rect 
                    x={llx} y={lly} width={width} height={height} 
                    fill={fillColor !== 'white' ? fillColor : 'none'} 
                    stroke={strokeColor} 
                    rx={isRounded ? 8 : 0} 
                 />
                 <text x={cx} y={cy} textAnchor="middle" fill="#666" fontSize="14" fontWeight="bold" style={{ pointerEvents: 'none', userSelect: 'none', fontFamily: 'Arial' }}>
                     {titleText}
                 </text>
            </g>
        );
    };

    const renderNode = (obj) => {
        if (!obj.pos) return null; 
        const [x, y] = obj.pos.split(",").map(parseFloat);
        const meta = obj.metadata || {};
        
        // Graphviz dims are in inches, convert to points (1in = 72pt)
        const width = (parseFloat(obj.width) || 0.5) * 72; 
        const height = (parseFloat(obj.height) || 0.5) * 72;

        const fillColor = extractColor(obj, 'fill');
        const strokeColor = extractColor(obj, 'stroke');
        const isRounded = obj.style && obj.style.includes('rounded');

        let Shape;
        let LabelContent = obj.label;

        if (obj.shape === "Mrecord") {
            // Enzyme Complex
            LabelContent = null; 
            Shape = (
                <g>
                    <rect x={-width/2} y={-height/2} width={width} height={height} fill={fillColor} stroke={strokeColor} strokeWidth="2" rx={isRounded?4:0} />
                    <line x1={0} y1={-height/2} x2={0} y2={height/2} stroke={strokeColor} strokeWidth="1.5" />
                    <text x={-width/4} y="0.3em" textAnchor="middle" fontSize="10" fill="#555">E</text>
                    <text x={width/4} y="0.3em" textAnchor="middle" fontSize="10" fill="#555">C</text>
                </g>
            );
        } else if (obj.shape === "noverhang") {
            // Channel
            Shape = (
                <g>
                    <rect x={-width/2} y={-height/2} width={width} height={height} fill={fillColor} stroke={strokeColor} strokeWidth="2" />
                    <line x1={-width/2 + 5} y1={-height/2} x2={-width/2 + 5} y2={height/2} stroke={strokeColor} strokeWidth="1" strokeDasharray="2,2"/>
                    <line x1={width/2 - 5} y1={-height/2} x2={width/2 - 5} y2={height/2} stroke={strokeColor} strokeWidth="1" strokeDasharray="2,2"/>
                </g>
            );
        } else if (obj.shape === "doublecircle") {
             // MM Enzyme
             Shape = (
                <g>
                    <circle r={width/2} fill={fillColor} stroke={strokeColor} strokeWidth="1" />
                    <circle r={(width/2) - 4} fill="none" stroke={strokeColor} strokeWidth="1" />
                </g>
             );
        } else if (obj.shape === "square") {
            // Reaction Node
            Shape = <rect x={-width/2} y={-height/2} width={width} height={height} fill={fillColor} stroke={strokeColor} />;
        } else if (obj.shape === "rect" || obj.shape === "box") {
            // Pool / Box
            Shape = <rect x={-width/2} y={-height/2} width={width} height={height} rx={isRounded?8:0} fill={fillColor} stroke={strokeColor} strokeWidth="2" />;
        } else {
            // Default Ellipse/Circle
            Shape = <ellipse rx={width/2} ry={height/2} fill={fillColor} stroke={strokeColor} strokeWidth="2" />;
        }

        return (
            <g 
                key={obj._gvid} 
                transform={`translate(${x}, ${y})`} 
                onMouseEnter={(e) => setHoveredNode({ ...meta, x: e.clientX, y: e.clientY })} 
                onMouseLeave={() => setHoveredNode(null)} 
                style={{ cursor: 'pointer' }}
            >
                {Shape}
                {LabelContent && (
                    <text 
                        textAnchor="middle" 
                        dy=".3em" 
                        fontSize="10" 
                        fill={fillColor === 'black' ? 'white' : 'black'}
                        style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                        {LabelContent}
                    </text>
                )}
            </g>
        );
    };

    return <>{clusters.map(renderCluster)}{nodes.map(renderNode)}</>;
  };

  const renderEdges = () => {
    if (!graphData?.edges) return null;

    return graphData.edges.map((edge) => {
        const sourceNode = nodeMap[edge.tail];
        const targetNode = nodeMap[edge.head];
        
        let d = parseSplineToPath(edge.pos);
        
        // --- 1. Style Logic (Dashed Lines) ---
        // Backend now explicitly sends style="dashed" for enzyme parents
        const isDashed = edge.style === 'dashed';
        
        // --- 2. Boundary Intersection Logic (Arrowheads touching shapes) ---
        if (targetNode && sourceNode) {
            const tW = (parseFloat(targetNode.width) || 0.5) * 72;
            const tH = (parseFloat(targetNode.height) || 0.5) * 72;
            const [tx, ty] = targetNode.pos.split(',').map(parseFloat);
            
            // Get approach angle from spline
            const allPoints = edge.pos.match(/-?[\d\.]+/g).map(parseFloat);
            let approachX, approachY;
            
            // 'e' = endpoint, usually indices 2,3 are the first control point
            if (edge.pos.startsWith('e,')) {
                 approachX = allPoints[2]; 
                 approachY = allPoints[3];
            } else {
                 const len = allPoints.length;
                 approachX = allPoints[len-4];
                 approachY = allPoints[len-3];
            }
            
            let newEnd;
            if (['square', 'rect', 'box', 'noverhang', 'Mrecord'].includes(targetNode.shape)) {
                newEnd = getRectIntersect(tx, ty, tW, tH, approachX, approachY);
            } else {
                newEnd = getEllipseIntersect(tx, ty, tW/2, tH/2, approachX, approachY);
            }

            // Update path 'd'
            const dParts = d.trim().split(' ');
            dParts[dParts.length - 2] = newEnd.x.toFixed(2);
            dParts[dParts.length - 1] = newEnd.y.toFixed(2);
            d = dParts.join(' ');
        }

        // --- 3. Labels (Stoichiometry) ---
        // Backend provides 'lp' (Label Position) and 'label'
        let labelElement = null;
        if (edge.label && edge.lp) {
            const [lx, ly] = edge.lp.split(',').map(parseFloat);
            labelElement = (
                <text x={lx} y={ly} dy="-2" textAnchor="middle" fill="red" fontSize="12" fontWeight="bold">
                    {edge.label}
                </text>
            );
        }

        return (
            <g key={edge._gvid}>
                <path 
                    d={d} 
                    fill="none" 
                    stroke="black" 
                    strokeWidth="1" 
                    strokeDasharray={isDashed ? "5,5" : "none"}
                    markerEnd={edge.arrowhead === 'none' ? '' : 'url(#arrowhead)'}
                />
                {labelElement}
            </g>
        );
    });
  };

  // --- LEGEND COMPONENT ---
  const renderLegend = () => (
      <Paper sx={{ position: 'absolute', bottom: 50, right: 10, zIndex: 10, width: 200 }}>
          <ListItem button onClick={() => setLegendOpen(!legendOpen)} dense>
              <ListItemIcon><Layers /></ListItemIcon>
              <ListItemText primary="Legend" />
              {legendOpen ? <ExpandMore /> : <ExpandLess />}
          </ListItem>
          <Collapse in={legendOpen}>
              <List dense disablePadding>
                  <ListItem>
                      <Box component="span" sx={{ width: 20, height: 20, border: '1px solid black', borderRadius: '50%', mr: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Box sx={{ width: 14, height: 14, border: '1px solid black', borderRadius: '50%' }} />
                      </Box>
                      <ListItemText primary="Enzyme" />
                  </ListItem>
                  <ListItem>
                      <Box component="span" sx={{ width: 20, height: 20, bgcolor: 'black', mr: 2 }} />
                      <ListItemText primary="Reaction Site" />
                  </ListItem>
                  <ListItem>
                      <Box component="span" sx={{ width: 20, height: 20, border: '2px solid black', borderRadius: '4px', mr: 2 }} />
                      <ListItemText primary="Pool / Object" />
                  </ListItem>
                  <ListItem>
                      <Box component="span" sx={{ width: 20, height: 0, borderTop: '2px dashed black', mr: 2 }} />
                      <ListItemText primary="Enzyme Parent" />
                  </ListItem>
                  <ListItem>
                      <Box component="span" sx={{ width: 20, height: 0, borderTop: '2px solid black', mr: 2 }} />
                      <ListItemText primary="Reaction Flow" />
                  </ListItem>
              </List>
          </Collapse>
      </Paper>
  );

  if (!graphData) {
      return (
         <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5' }}>
             <Typography sx={{ color: '#888' }}>No Graph Data</Typography>
         </Box>
      );
  }

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative', bgcolor: '#f5f5f5', overflow: 'hidden' }}>
      
      {/* View Toggles */}
      <Paper elevation={2} sx={{ position: 'absolute', top: 10, right: 10, zIndex: 10, p: 0.5 }}>
        <ToggleButtonGroup value={viewMode} exclusive onChange={(e, val) => val && setViewMode(val)} size="small">
          <ToggleButton value="reaction">Reaction</ToggleButton>
          <ToggleButton value="block">Block</ToggleButton>
        </ToggleButtonGroup>
      </Paper>

      {/* Main Graph Area */}
      <TransformWrapper 
          initialScale={1} minScale={0.01} maxScale={100} limitToBounds={false} centerOnInit
      >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              {/* Zoom Controls */}
              <Paper elevation={2} sx={{ position: 'absolute', bottom: 10, left: 10, zIndex: 10 }}>
                <IconButton onClick={() => zoomIn()} size="small"><ZoomIn /></IconButton>
                <IconButton onClick={() => zoomOut()} size="small"><ZoomOut /></IconButton>
                <IconButton onClick={() => resetTransform()} size="small"><Refresh /></IconButton>
              </Paper>

              <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
                <svg width="100%" height="100%" viewBox={viewBox} style={{ pointerEvents: 'all' }}>
                  <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                      <polygon points="0 0, 10 3.5, 0 7" fill="black" />
                    </marker>
                  </defs>
                  <g>
                    {renderObjects()}
                    {renderEdges()}
                  </g>
                </svg>
              </TransformComponent>
            </>
          )}
        </TransformWrapper>

      {/* Legend */}
      {renderLegend()}

      {/* Hover Tooltip */}
      {hoveredNode && (
        <Paper sx={{ position: 'fixed', top: hoveredNode.y + 15, left: hoveredNode.x + 15, p: 1.5, zIndex: 100, maxWidth: 300, pointerEvents: 'none', border: '1px solid #ccc', boxShadow: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{hoveredNode.name}</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>{hoveredNode.className}</Typography>
          {Object.entries(hoveredNode).map(([k, v]) => {
             if (['name', 'className', 'x', 'y', 'path'].includes(k)) return null;
             return (
                 <Box key={k} sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ marginRight: 10, color: '#555' }}>{k}:</span>
                    <b>{typeof v === 'number' ? v.toPrecision(4) : v}</b>
                 </Box>
             );
          })}
        </Paper>
      )}
    </Box>
  );
};

export default ReactionGraph;
