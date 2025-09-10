import * as THREE from 'three';

// Define the constant points for the lathe shape once
const lathePoints = [
    [0.2, 0], [0.2, 1], [1, 1], [1, 0.6], [0.5, 0.3], [0.5, 0], [0.2, 0]
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
            mesh.position.set(...primitive.C);
            const normal = new THREE.Vector3(...primitive.C2).normalize();
            const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
            mesh.quaternion.copy(quaternion);
            break;
        }

        case 'stim': { // Octahedron
            geometry = new THREE.OctahedronGeometry(primitive.diameter / 2);
            mesh = new THREE.Mesh(geometry, material);
            const direction = new THREE.Vector3(...primitive.C2).normalize();
            const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
            mesh.quaternion.copy(quaternion);
            // Position the mesh center so one vertex is at C
            const centerOffset = direction.clone().multiplyScalar(primitive.diameter / 2);
            const centerPosition = new THREE.Vector3(...primitive.C).add(centerOffset);
            mesh.position.copy(centerPosition);
            break;
        }

        case 'chan1': // Torus with square tube
        case 'chan2': { // Torus with triangular tube
            const tubularSegments = (primitive.type === 'chan1') ? 4 : 3;
            geometry = new THREE.TorusGeometry(primitive.diameter / 2, primitive.diameter / 3, 16, tubularSegments);
            mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(...primitive.C);
            const axis = new THREE.Vector3(...primitive.C2).normalize();
            const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), axis);
            mesh.quaternion.copy(quaternion);
            break;
        }

        case 'chan3': { // Custom Lathe shape
            geometry = new THREE.LatheGeometry(lathePoints, 32);
            mesh = new THREE.Mesh(geometry, material);
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
