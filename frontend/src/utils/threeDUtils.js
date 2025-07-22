/**
 * This function derives the 3D config from the main jsonData.
 * It now accepts an optional second argument, a string containing SWC data,
 * which is used for rendering when available.
 *
 * @param {object} sourceJsonData - The complete jsonData object for the model.
 * @param {string|null} swcDataString - A string of SWC data for rendering, not part of the serializable state.
 * @returns {Promise<object|null>} A Promise that resolves to a configuration object for the 3D viewer or null.
 */
export const generateThreeDConfig = async (sourceJsonData, swcDataString = null) => {
    // Use a mutable variable for cellProto to allow for defaults.
    let { cellProto, displayMoogli: displaySettings } = sourceJsonData;

    // If cellProto is not defined, is empty, or has no type, create a default soma.
    if (!cellProto || Object.keys(cellProto).length === 0 || !cellProto.type) {
        if (sourceJsonData.moogli && sourceJsonData.moogli.length > 0) {
            return {
                moogli: sourceJsonData.moogli,
                displayMoogli: sourceJsonData.displayMoogli || {}
            };
        }
        cellProto = {
            type: 'soma',
            somaDia: 10e-6
        };
    }

    // Start with default or existing display settings from jsonData.
    const displayMoogli = {
        frameDt: 0.1, runtime: 0.3, colormap: "jet", center: [0, 0, 0], bg: '#FFFFFF',
        ...(displaySettings || {})
    };

    const moogli = [{
        name: 'cell', vmin: -0.08, vmax: 0.04, dt: 0.1, transparency: 0.5, shape: []
    }];

    // Generate shapes based on the procedural morphology type.
    switch (cellProto.type) {
        case 'soma':
            moogli[0].shape.push({ type: 'sphere', C: [0, 0, 0], diameter: cellProto.somaDia, value: 0, swcType: 1 });
            displayMoogli.center = [0, 0, 0];
            break;

        case 'cylSoma': {
            const length = cellProto.length || 10e-6;
            const radius = cellProto.radius || 10e-6;
            const diameter = radius * 2;
            const halfLength = length / 2;

            moogli[0].shape.push({
                type: 'cylinder',
                C: [-halfLength, 0, 0],
                C2: [halfLength, 0, 0],
                diameter: diameter,
                value: 0,
                swcType: 1, // Soma type
                flat_caps: true // Render with flat ends
            });
            displayMoogli.center = [0, 0, 0];
            break;
        }

        case 'ballAndStick': {
            const { somaDia, dendLen, dendDia, dendNumSeg = 1 } = cellProto;
            moogli[0].shape.push({ type: 'sphere', C: [0, 0, 0], diameter: somaDia, value: 0, swcType: 1 });

            const segLen = dendLen / dendNumSeg;
            for (let i = 0; i < dendNumSeg; i++) {
                moogli[0].shape.push({
                    type: 'cylinder',
                    C: [i * segLen, 0, 0],
                    C2: [(i + 1) * segLen, 0, 0],
                    diameter: dendDia,
                    value: 0,
                    swcType: 4,
                    flat_caps: true // Render with flat ends
                });
            }
            displayMoogli.center = [dendLen / 2, 0, 0];
            break;
        }

        case 'branchedCell': {
            const { somaDia, dendLen, dendDia, dendNumSeg = 1, branchLen, branchDia, branchNumSeg = 1 } = cellProto;
            moogli[0].shape.push({ type: 'sphere', C: [0, 0, 0], diameter: somaDia, value: 0, swcType: 1 });

            const trunkSegLen = dendLen / dendNumSeg;
            for (let i = 0; i < dendNumSeg; i++) {
                moogli[0].shape.push({
                    type: 'cylinder',
                    C: [i * trunkSegLen, 0, 0],
                    C2: [(i + 1) * trunkSegLen, 0, 0],
                    diameter: dendDia,
                    value: 0,
                    swcType: 4,
                    flat_caps: true // Render with flat ends
                });
            }

            const trunkEnd = [dendLen, 0, 0];
            const angle = Math.PI / 4;
            const branch1End = [trunkEnd[0] + branchLen * Math.cos(angle), trunkEnd[1] + branchLen * Math.sin(angle), 0];
            const branch2End = [trunkEnd[0] + branchLen * Math.cos(-angle), trunkEnd[1] + branchLen * Math.sin(-angle), 0];
            const branch1Vec = [branch1End[0] - trunkEnd[0], branch1End[1] - trunkEnd[1], 0];
            const branch2Vec = [branch2End[0] - trunkEnd[0], branch2End[1] - trunkEnd[1], 0];

            for (let i = 0; i < branchNumSeg; i++) {
                const frac_start = i / branchNumSeg;
                const frac_end = (i + 1) / branchNumSeg;
                
                const seg1Start = [trunkEnd[0] + branch1Vec[0] * frac_start, trunkEnd[1] + branch1Vec[1] * frac_start, 0];
                const seg1End = [trunkEnd[0] + branch1Vec[0] * frac_end, trunkEnd[1] + branch1Vec[1] * frac_end, 0];
                moogli[0].shape.push({ type: 'cylinder', C: seg1Start, C2: seg1End, diameter: branchDia, value: 0, swcType: 4, flat_caps: true });

                const seg2Start = [trunkEnd[0] + branch2Vec[0] * frac_start, trunkEnd[1] + branch2Vec[1] * frac_start, 0];
                const seg2End = [trunkEnd[0] + branch2Vec[0] * frac_end, trunkEnd[1] + branch2Vec[1] * frac_end, 0];
                moogli[0].shape.push({ type: 'cylinder', C: seg2Start, C2: seg2End, diameter: branchDia, value: 0, swcType: 4, flat_caps: true });
            }
            displayMoogli.center = [dendLen / 2, 0, 0];
            break;
        }
        
        case 'file': {
            const swcText = swcDataString;

            if (!swcText || typeof swcText !== 'string') {
                console.log("Cannot render morphology: SWC data string not available.");
                return null;
            }

            try {
                const points = new Map();
                const lines = swcText.split('\n');
                let minX = Infinity, minY = Infinity, minZ = Infinity;
                let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

                lines.forEach(line => {
                    line = line.trim();
                    if (line.startsWith('#') || line === '') return;
                    const parts = line.split(/\s+/).map(parseFloat);
                    if (parts.length < 7) return;
                    const [n, type, x, y, z, radius, parent] = parts;
                    points.set(n, { n, type, x, y, z, radius, parent });
                    minX = Math.min(minX, x - radius);
                    minY = Math.min(minY, y - radius);
                    minZ = Math.min(minZ, z - radius);
                    maxX = Math.max(maxX, x + radius);
                    maxY = Math.max(maxY, y + radius);
                    maxZ = Math.max(maxZ, z + radius);
                });

                if (points.size === 0) {
                    console.error("SWC file contains no valid data points.");
                    return null;
                }

                points.forEach((p) => {
                    if (p.type === 1 || p.parent === -1) { //Soma type is 1
                    	moogli[0].shape.push({
                        	type: 'sphere', C: [p.x, p.y, p.z], diameter: p.radius * 2, value: 0, swcType: p.type, id: p.n
                    	});
					} else {
						// } if (p.parent !== -1) {
                        const parentPoint = points.get(p.parent);
                        if (parentPoint) {
                            moogli[0].shape.push({
                                type: 'cylinder',
                                C: [parentPoint.x, parentPoint.y, parentPoint.z],
                                C2: [p.x, p.y, p.z],
                                diameter: p.radius * 2,
                                value: 0,
                                swcType: p.type,
                                id: p.n,
                                flat_caps: true // Render with flat ends
                            });
                        }
                    }
                });

                displayMoogli.center = [(minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2];
                return { moogli, displayMoogli };

            } catch (error) {
                console.error("Error parsing SWC string:", error);
                return null;
            }
        }

        default: 
            return null;
    }

    return { moogli, displayMoogli };
};

