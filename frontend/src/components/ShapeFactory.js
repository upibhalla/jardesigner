import * as THREE from 'three';

// Define the constant points for the lathe shapes once
const chan3LathePoints = [
    [0.2, 0], [0.2, 1], [1, 1], [1, 0.6], [0.5, 0.3], [0.5, 0], [0.2, 0]
].map(p => new THREE.Vector2(p[0], p[1]));

const stimLathePoints = [
    [0, 0], [0, 1], [0.15, 1], [0.07, 0.5], [0.15, 0.5], [0, 0]
].map(p => new THREE.Vector2(p[0], p[1]));


export function createShape(primitive, material) {
    let shapeObject;
    let geometry;

    switch (primitive.type) {
        case 'sphere': {
            geometry = new THREE.SphereGeometry(primitive.diameter / 2, 16, 8);
            shapeObject = new THREE.Mesh(geometry, material);
            shapeObject.position.set(...primitive.C);
            break;
        }
        
        case 'cylinder':
        case 'cone': {
            const start = new THREE.Vector3(...primitive.C);
            const end = new THREE.Vector3(...primitive.C2);
            const length = start.distanceTo(end);
            const d1 = primitive.diameter;
            const d2 = (primitive.type === 'cone') ? 0 : d1;
            geometry = new THREE.CylinderGeometry(d2 / 2, d1 / 2, length, 16);
            shapeObject = new THREE.Mesh(geometry, material);
            const direction = new THREE.Vector3().subVectors(end, start);
            const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
            shapeObject.quaternion.copy(quaternion);
            shapeObject.position.copy(start).add(direction.multiplyScalar(0.5));
            break;
        }

        case 'moogli': { // Square Plane
            geometry = new THREE.PlaneGeometry(primitive.diameter, primitive.diameter);
            shapeObject = new THREE.Mesh(geometry, material);
            shapeObject.material.side = THREE.DoubleSide; 
            shapeObject.position.set(...primitive.C);
            const normal = new THREE.Vector3(...primitive.C2).normalize();
            const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
            shapeObject.quaternion.copy(quaternion);
            break;
        }

        case 'stim': { // Custom Lathe shape
            geometry = new THREE.LatheGeometry(stimLathePoints, 16);
            shapeObject = new THREE.Mesh(geometry, material);
            
            const scale = primitive.diameter * 2; // Made twice as big
            shapeObject.scale.set(scale, scale, scale);
            
            const direction = new THREE.Vector3(...primitive.C2).normalize();
            shapeObject.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);

            shapeObject.position.set(...primitive.C);
            break;
        }
        
        case 'vclamp': {
            const group = new THREE.Group();
            const coneHeight = primitive.diameter * 1.5;
            const coneRadius = primitive.diameter / 3;

            // 1. Create the Cone Body (tip at +Y, base at -Y in local space)
            const coneGeometry = new THREE.CylinderGeometry(0, coneRadius, coneHeight, 16);
            const coneMesh = new THREE.Mesh(coneGeometry, material);
            group.add(coneMesh);

            // 2. Create the "V" Arms at the cone's base
            const armLength = coneRadius * 3;
            const armThickness = primitive.diameter / 10;
            const vArmGeometry = new THREE.BoxGeometry(armThickness, armLength, armThickness);
            const angle = Math.PI / 8; // 30-degree angle for each arm

            // V Arm 1
            const vArm1 = new THREE.Mesh(vArmGeometry, material);
            vArm1.rotation.z = angle;
            vArm1.position.x = Math.sin(angle) * (armLength / 2);
            vArm1.position.y = -coneHeight / 2 - Math.cos(angle) * (armLength / 2); // Corrected Y position
            group.add(vArm1);

            // V Arm 2
            const vArm2 = new THREE.Mesh(vArmGeometry, material);
            vArm2.rotation.z = -angle;
            vArm2.position.x = -Math.sin(angle) * (armLength / 2);
            vArm2.position.y = -coneHeight / 2 - Math.cos(angle) * (armLength / 2); // Corrected Y position
            group.add(vArm2);

            // 3. Final Orientation and Positioning
            const direction = new THREE.Vector3(...primitive.C2).normalize();
            const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().negate());
            group.quaternion.copy(quaternion);

            const localTip = new THREE.Vector3(0, coneHeight / 2, 0);
            const worldOffset = localTip.applyQuaternion(quaternion.clone());
            const pivotPosition = new THREE.Vector3(...primitive.C).sub(worldOffset);
            group.position.copy(pivotPosition);
            
            shapeObject = group;
            break;
        }

        case 'tetra': { // Composite icon of four tetrahedra
            const group = new THREE.Group();

            const s = primitive.diameter / 3;
            const largeSide = primitive.diameter;
            const tetraRadius = s * Math.sqrt(3 / 8); 
            const positionScale = largeSide / (2 * Math.sqrt(2));

            const tetraGeometry = new THREE.TetrahedronGeometry(tetraRadius);
            const tetraMaterial = material.clone();
            tetraMaterial.opacity = 1.0;
            tetraMaterial.transparent = false;

            const positions = [
                new THREE.Vector3(1, 1, 1),
                new THREE.Vector3(1, -1, -1),
                new THREE.Vector3(-1, 1, -1),
                new THREE.Vector3(-1, -1, 1)
            ];

            positions.forEach(pos => {
                const tetraMesh = new THREE.Mesh(tetraGeometry, tetraMaterial);
                tetraMesh.position.copy(pos).multiplyScalar(positionScale);
                group.add(tetraMesh);
            });

            group.position.set(...primitive.C);
            shapeObject = group;
            break;
        }

        case 'chan0':
        case 'chan1':
        case 'chan2': { 
            let radialSegments = 16;
            let tubularSegments = 16;

            switch (primitive.type) {
                case 'chan0':
                    radialSegments = 4;
                    tubularSegments = 16;
                    break;
                case 'chan1':
                    radialSegments = 16;
                    tubularSegments = 4;
                    break;
                case 'chan2':
                    radialSegments = 16;
                    tubularSegments = 3;
                    break;
            }
            
            geometry = new THREE.TorusGeometry(primitive.diameter / 2, primitive.diameter / 3, radialSegments, tubularSegments);
            shapeObject = new THREE.Mesh(geometry, material);
            shapeObject.position.set(...primitive.C);
            const axis = new THREE.Vector3(...primitive.C2).normalize();
            const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), axis);
            shapeObject.quaternion.copy(quaternion);
            break;
        }

        case 'chan3': { // Custom Lathe shape
            geometry = new THREE.LatheGeometry(chan3LathePoints, 32);
            shapeObject = new THREE.Mesh(geometry, material);
            
            shapeObject.material.opacity = 1.0;
            shapeObject.material.transparent = false;
            shapeObject.material.side = THREE.DoubleSide;

            const scale = primitive.diameter / 2;
            shapeObject.scale.set(scale, scale, scale);
            const axis = new THREE.Vector3(...primitive.C2).normalize();
            const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis);
            shapeObject.quaternion.copy(quaternion);
            shapeObject.position.set(...primitive.C);
            break;
        }

        default:
            return null;
    }

    return shapeObject;
}
