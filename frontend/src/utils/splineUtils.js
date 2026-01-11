// src/utils/splineUtils.js

/**
 * Parses Graphviz JSON 'pos' string into an SVG path 'd' attribute.
 * Format usually: "e,x,y s,x,y x,y x,y x,y ..."
 * e: end point, s: start point (optional), followed by cubic bezier control points.
 */
export const parseSplineToPath = (posString) => {
  if (!posString) return "";

  const parts = posString.split(" ");
  let d = "";
  let startPoint = null;
  let endPoint = null;
  let points = [];

  parts.forEach((part) => {
    if (part.startsWith("e,")) {
      const coords = part.substring(2).split(",");
      endPoint = { x: parseFloat(coords[0]), y: parseFloat(coords[1]) };
    } else if (part.startsWith("s,")) {
      const coords = part.substring(2).split(",");
      startPoint = { x: parseFloat(coords[0]), y: parseFloat(coords[1]) };
    } else {
      const coords = part.split(",");
      points.push({ x: parseFloat(coords[0]), y: parseFloat(coords[1]) });
    }
  });

  // Graphviz splines are usually sequences of Cubic Beziers (4 points: start, c1, c2, end)
  // The points array contains: [Start, C1, C2, End, C1, C2, End, ...]
  // BUT Graphviz often omits the "Start" of the next segment because it's the "End" of the previous.
  
  // Standard Graphviz JSON output for splines:
  // p0 p1 p2 p3 (first curve)
  // p3 p4 p5 p6 (second curve) ...
  
  if (points.length >= 4) {
    // Move to first point
    d += `M ${points[0].x} ${points[0].y} `;
    
    for (let i = 1; i < points.length; i += 3) {
      if (i + 2 < points.length) {
        d += `C ${points[i].x} ${points[i].y}, ${points[i+1].x} ${points[i+1].y}, ${points[i+2].x} ${points[i+2].y} `;
      }
    }
  }

  // Draw arrowheads if needed (this logic renders the line, arrowheads are usually separate 'head'/'tail' polygons in JSON)
  // But Graphviz 'pos' usually defines the edge *up to* the arrow tip.
  
  return d;
};
