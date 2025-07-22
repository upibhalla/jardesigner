/**
 * This function derives the 3D config from the main jsonData
 * @param {object} sourceJsonData - The complete jsonData object for the model.
 * @returns {object|null} A configuration object for the 3D viewer or null.
 */
export const generateThreeDConfig = (sourceJsonData) => {
    const { cellProto, displayMoogli: displaySettings } = sourceJsonData;

    // If there's no valid procedural morphology, check for raw moogli data.
    // This allows for loading pre-defined 3D scenes.
    if (!cellProto || !cellProto.type || cellProto.type === 'file') {
        if (sourceJsonData.moogli && sourceJsonData.moogli.length > 0) {
            return {
                moogli: sourceJsonData.moogli,
                displayMoogli: sourceJsonData.displayMoogli || {}
            };
        }
        return null; // Otherwise, there is nothing to display.
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
            moogli[0].shape.push({ type: 'sphere', C: [0, 0, 0], diameter: cellProto.somaDia, value: 0 });
            displayMoogli.center = [0, 0, 0];
            break;
        case 'ballAndStick': {
            const { somaDia, dendLen, dendDia, dendNumSeg = 1 } = cellProto;
            moogli[0].shape.push({ type: 'sphere', C: [0, 0, 0], diameter: somaDia, value: 0 });

            const segLen = dendLen / dendNumSeg;
            for (let i = 0; i < dendNumSeg; i++) {
                moogli[0].shape.push({
                    type: 'cylinder',
                    C: [i * segLen, 0, 0],
                    C2: [(i + 1) * segLen, 0, 0],
                    diameter: dendDia,
                    value: 0
                });
            }
            displayMoogli.center = [dendLen / 2, 0, 0];
            break;
        }
        case 'branchedCell': {
            const { somaDia, dendLen, dendDia, dendNumSeg = 1, branchLen, branchDia, branchNumSeg = 1 } = cellProto;
            moogli[0].shape.push({ type: 'sphere', C: [0, 0, 0], diameter: somaDia, value: 0 });

            // Subdivide the main dendrite trunk
            const trunkSegLen = dendLen / dendNumSeg;
            for (let i = 0; i < dendNumSeg; i++) {
                moogli[0].shape.push({ type: 'cylinder', C: [i * trunkSegLen, 0, 0], C2: [(i + 1) * trunkSegLen, 0, 0], diameter: dendDia, value: 0 });
            }

            // Define branch vectors from the end of the trunk
            const trunkEnd = [dendLen, 0, 0];
            const angle = Math.PI / 4; // 45 degrees
            const branch1End = [trunkEnd[0] + branchLen * Math.cos(angle), trunkEnd[1] + branchLen * Math.sin(angle), 0];
            const branch2End = [trunkEnd[0] + branchLen * Math.cos(-angle), trunkEnd[1] + branchLen * Math.sin(-angle), 0];
            const branch1Vec = [branch1End[0] - trunkEnd[0], branch1End[1] - trunkEnd[1], 0];
            const branch2Vec = [branch2End[0] - trunkEnd[0], branch2End[1] - trunkEnd[1], 0];

            // Subdivide the daughter branches
            for (let i = 0; i < branchNumSeg; i++) {
                const frac_start = i / branchNumSeg;
                const frac_end = (i + 1) / branchNumSeg;
                
                // Branch 1 segments
                const seg1Start = [trunkEnd[0] + branch1Vec[0] * frac_start, trunkEnd[1] + branch1Vec[1] * frac_start, 0];
                const seg1End = [trunkEnd[0] + branch1Vec[0] * frac_end, trunkEnd[1] + branch1Vec[1] * frac_end, 0];
                moogli[0].shape.push({ type: 'cylinder', C: seg1Start, C2: seg1End, diameter: branchDia, value: 0 });

                // Branch 2 segments
                const seg2Start = [trunkEnd[0] + branch2Vec[0] * frac_start, trunkEnd[1] + branch2Vec[1] * frac_start, 0];
                const seg2End = [trunkEnd[0] + branch2Vec[0] * frac_end, trunkEnd[1] + branch2Vec[1] * frac_end, 0];
                moogli[0].shape.push({ type: 'cylinder', C: seg2Start, C2: seg2End, diameter: branchDia, value: 0 });
            }
            displayMoogli.center = [dendLen / 2, 0, 0];
            break;
        }
        default: return null;
    }
    return { moogli, displayMoogli };
};

