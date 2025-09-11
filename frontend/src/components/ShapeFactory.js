import * as THREE from 'three';

// Define the constant points for the lathe shapes once
const chan3LathePoints = [
    [0.2, 0], [0.2, 1], [1, 1], [1, 0.6], [0.5, 0.3], [0.5, 0], [0.2, 0]
].map(p => new THREE.Vector2(p[0], p[1]));

// Profile updated to be 50% taller
const stimLathePoints = [
    [0, 0], [0, 1], [0.15, 1], [0.07, 0.5], [0.15, 0.5], [0, 0]
].map(p => new THREE.Vector2(p[0], p[1]));


export function createShape(primitive, material) {
    let mesh;
    let geometry;

    switch (primitive.type) {
        case 'sphere': {
            geometry = new THREE.SphereGeometry(primitive.diameter / 2, 16, 8);
            mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(...primitive.C);
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
            mesh = new THREE.Mesh(geometry, material);
            const direction = new THREE.Vector3().subVectors(end, start);
            const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
            mesh.quaternion.copy(quaternion);
            mesh.position.copy(start).add(direction.multiplyScalar(0.5));
            break;
        }

        case 'moogli': { // Square Plane
            geometry = new THREE.PlaneGeometry(primitive.diameter, primitive.diameter);
            mesh = new THREE.Mesh(geometry, material);
            mesh.material.side = THREE.DoubleSide; 
            mesh.position.set(...primitive.C);
            const normal = new THREE.Vector3(...primitive.C2).normalize();
            const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
            mesh.quaternion.copy(quaternion);
            break;
        }

        case 'stim': { // Custom Lathe shape
            geometry = new THREE.LatheGeometry(stimLathePoints, 16);
            mesh = new THREE.Mesh(geometry, material);
            
            // 1. Scale the mesh
            const scale = primitive.diameter;
            mesh.scale.set(scale, scale, scale);
            
            // 2. Orient the mesh along the C2 vector
            const direction = new THREE.Vector3(...primitive.C2).normalize();
            mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);

            // 3. Position the mesh's base at C
            mesh.position.set(...primitive.C);
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
            mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(...primitive.C);
            const axis = new THREE.Vector3(...primitive.C2).normalize();
            const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), axis);
            mesh.quaternion.copy(quaternion);
            break;
        }

        case 'chan3': { // Custom Lathe shape
            geometry = new THREE.LatheGeometry(chan3LathePoints, 32);
            mesh = new THREE.Mesh(geometry, material);
            
            // Force opaque and double-sided rendering
            mesh.material.opacity = 1.0;
            mesh.material.transparent = false;
            mesh.material.side = THREE.DoubleSide;

            // Scale, Orient, then Position
            const scale = primitive.diameter / 2;
            mesh.scale.set(scale, scale, scale);
            const axis = new THREE.Vector3(...primitive.C2).normalize();
            const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis);
            mesh.quaternion.copy(quaternion);
            mesh.position.set(...primitive.C);
            break;
        }

        default:
            return null;
    }

    return mesh;
}
