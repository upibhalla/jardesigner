// src/components/colormap.js

import * as THREE from 'three';

const colormaps = {
  jet: [
    { stop: 0.0, color: new THREE.Color(0, 0, 0.5625) },
    { stop: 0.125, color: new THREE.Color(0, 0, 1) },      // Blue
    { stop: 0.375, color: new THREE.Color(0, 1, 1) },      // Cyan
    { stop: 0.625, color: new THREE.Color(1, 1, 0) },      // Yellow
    { stop: 0.875, color: new THREE.Color(1, 0, 0) },      // Red
    { stop: 1.0, color: new THREE.Color(0.5, 0, 0) },
  ],
};

/**
 * Gets a color from a colormap.
 * @param {number} value - A normalized value between 0 and 1.
 * @param {string} mapName - The name of the colormap (e.g., 'jet').
 * @param {boolean} asThreeColor - If true, returns a THREE.Color object. Otherwise, returns a CSS string.
 * @returns {THREE.Color | string} The interpolated color.
 */
export function getColor(value, mapName = 'jet', asThreeColor = false) {
  const cmap = colormaps[mapName] || colormaps.jet;
  const clampedValue = Math.max(0, Math.min(1, value));
  let resultColor = cmap[0].color.clone();

  for (let i = 0; i < cmap.length - 1; i++) {
    if (clampedValue >= cmap[i].stop && clampedValue <= cmap[i + 1].stop) {
      const t = (clampedValue - cmap[i].stop) / (cmap[i + 1].stop - cmap[i].stop);
      resultColor = cmap[i].color.clone().lerp(cmap[i + 1].color, t);
      break;
    }
  }

  return asThreeColor ? resultColor : resultColor.getStyle();
}
