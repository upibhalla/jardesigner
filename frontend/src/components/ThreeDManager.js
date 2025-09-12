import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { getColor } from './colormap';
import { createShape } from './ShapeFactory';

export default class ThreeDManager {
  constructor(container, onSelectionChange) {
    this.container = container;
    this.onSelectionChange = onSelectionChange;
    this.activeGroupId = null;
    this.diameterScales = new Map();

    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.container.appendChild(this.renderer.domElement);
    this.camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 1e-9, 1e3);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.boundingBox = new THREE.Box3();
    this.sceneObjects = [];
    this.entityConfigs = new Map();

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(5, 5, 5);
    this.scene.add(dirLight);

    this.onWindowResize = this.onWindowResize.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleClick = this.handleClick.bind(this);
    window.addEventListener('resize', this.onWindowResize);
    window.addEventListener('keydown', this.handleKeyDown);
    this.renderer.domElement.addEventListener('click', this.handleClick);

    this.animate();
  }
  
  getBoundingBoxSize() {
    const size = new THREE.Vector3();
    this.boundingBox.getSize(size);
    return { x: size.x, y: size.y, z: size.z };
  }

  setActiveGroupId(groupId) {
    this.activeGroupId = groupId;
  }

  buildScene(config) {
    if (!config || !config.drawables) {
        return;
    }

    this.sceneObjects = [];
    this.entityConfigs.clear();
    this.diameterScales.clear();
    while(this.scene.children.length > 2){
        const child = this.scene.children[2];
        this.scene.remove(child);
        if(child.geometry) child.geometry.dispose();
        if(child.material) child.material.dispose();
    }

    this.renderer.setClearColor(new THREE.Color(config.bg === 'default' ? '#FFFFFF' : config.bg || '#FFFFFF'));
    this.boundingBox.makeEmpty();

    config.drawables.forEach(entity => {
      this.entityConfigs.set(entity.groupId, {
          title: entity.title, vmin: entity.vmin, vmax: entity.vmax,
          colormap: config.colormap, transparency: entity.transparency || 1.0
      });
      const initialScale = entity.diaScale ?? 1.0;
      this.diameterScales.set(entity.groupId, initialScale);
      
      entity.shape.forEach((primitive, i) => {
        const normalizedValue = (primitive.value - entity.vmin) / (entity.vmax - entity.vmin);
        const materialColor = getColor(normalizedValue, config.colormap, true);
        const material = new THREE.MeshStandardMaterial({
            color: materialColor, 
            transparent: true, 
            opacity: entity.transparency || 1.0,
        });

        const shapeObject = createShape(primitive, material);

        if (shapeObject) {
            shapeObject.userData = { 
                entityName: entity.groupId, 
				shapeIndex: i, 
				originalValue: primitive.value,
                originalPosition: shapeObject.position.clone(),
                simPath: primitive.simPath,
            };

            if (shapeObject.type === 'Mesh') {
                if (shapeObject.geometry.type === 'SphereGeometry') {
                    shapeObject.scale.set(initialScale, initialScale, initialScale);
                } else if (shapeObject.geometry.type === 'CylinderGeometry' || shapeObject.geometry.type === 'ConeGeometry') {
                    shapeObject.scale.set(initialScale, 1, initialScale);
                }
            }

            this.scene.add(shapeObject);
            this.sceneObjects.push(shapeObject);
            this.boundingBox.expandByObject(shapeObject);
        }
      });
    });
    this.focusCamera();
    setTimeout(() => this.onWindowResize(), 0);
  }

  applyExplodeView(isExploded, offset, drawableOrder) {
    if (this.sceneObjects.length === 0) return;
    const offsetVector = new THREE.Vector3(
        parseFloat(offset.x) || 0, parseFloat(offset.y) || 0, parseFloat(offset.z) || 0
    );
    this.sceneObjects.forEach(obj => {
        if (!obj.userData.originalPosition) return;
        if (!isExploded) {
            obj.position.copy(obj.userData.originalPosition);
        } else {
            const drawableIndex = drawableOrder.indexOf(obj.userData.entityName);
            if (drawableIndex !== -1) {
                const cumulativeOffset = offsetVector.clone().multiplyScalar(drawableIndex);
                obj.position.copy(obj.userData.originalPosition).add(cumulativeOffset);
            }
        }
    });
  }

  setDrawableVisibility(visibilityMap) {
      this.sceneObjects.forEach(obj => {
          const groupId = obj.userData.entityName;
          if (visibilityMap.hasOwnProperty(groupId)) {
              obj.visible = visibilityMap[groupId];
          }
      });
  }

  updateColorRange(groupId, newRange) {
    const config = this.entityConfigs.get(groupId);
    if (config) {
        config.vmin = newRange.vmin;
        config.vmax = newRange.vmax;
        this.entityConfigs.set(groupId, config);
        this.redrawColors();
    }
  }

  redrawColors() {
    this.sceneObjects.forEach(obj => {
        const config = this.entityConfigs.get(obj.userData.entityName);
        if (config) {
            const normalizedValue = (obj.userData.originalValue - config.vmin) / (config.vmax - config.vmin);
            const newColor = getColor(normalizedValue, config.colormap, true);
            if (obj.material) { 
                obj.material.color.set(newColor);
            }
        }
    });
  }

  updateSceneData(frameData) {
    const { groupId, data } = frameData;
    const entityConfig = this.entityConfigs.get(groupId);
    if (!entityConfig) { return; }
    const { vmin, vmax, colormap } = entityConfig;
    const relevantObjects = this.sceneObjects.filter(obj => obj.userData.entityName === groupId);
    data.forEach((value, index) => {
        if (index < relevantObjects.length) {
            const obj = relevantObjects[index];
            const normalizedValue = (value - vmin) / (vmax - vmin);
            const newColor = getColor(normalizedValue, colormap, true);
            if (obj.material) {
                obj.material.color.set(newColor);
            }
        }
    });
  }

  handleClick(event) {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.sceneObjects, true);

      if (intersects.length > 0) {
          let clickedObject = intersects[0].object;
          let userData = clickedObject.userData;

          // Traverse up the hierarchy to find the parent group with the main userData
          // We stop when userData has a simPath, or we hit the scene object
          while (!userData.simPath && clickedObject.parent && clickedObject.parent !== this.scene) {
              clickedObject = clickedObject.parent;
              userData = clickedObject.userData;
          }

          if (this.onSelectionChange && userData && userData.simPath) {
              this.onSelectionChange(userData, event.ctrlKey);
          }
      }
  }

  updateSelectionVisuals(clickSelected) {
    const isSelected = (obj) => {
        return clickSelected.some(sel =>
            sel.entityName === obj.userData.entityName && sel.shapeIndex === obj.userData.shapeIndex
        );
    };
    this.sceneObjects.forEach(obj => {
        const config = this.entityConfigs.get(obj.userData.entityName);
        if (config) {
            const normalizedValue = isSelected(obj) ? 1.0 : (obj.userData.originalValue - config.vmin) / (config.vmax - config.vmin);
            const newColor = getColor(normalizedValue, config.colormap, true);
            if (obj.material) {
                obj.material.color.set(newColor);
                obj.material.needsUpdate = true;
            }
        }
    });
  }

  handleKeyDown(event) {
    if (event.target.tagName.toLowerCase() === 'input' || event.target.tagName.toLowerCase() === 'textarea') return;
    const rotateSpeed = 0.05;
    const offset = new THREE.Vector3().subVectors(this.camera.position, this.controls.target);
    const right = new THREE.Vector3().setFromMatrixColumn(this.camera.matrix, 0);
    const up = new THREE.Vector3().setFromMatrixColumn(this.camera.matrix, 1);
    const forward = new THREE.Vector3().setFromMatrixColumn(this.camera.matrix, 2);
    switch(event.key) {
        case 'r': this.camera.up.applyAxisAngle(forward, rotateSpeed); break;
        case 'R': this.camera.up.applyAxisAngle(forward, -rotateSpeed); break;
        case 'p': offset.applyAxisAngle(right, rotateSpeed); break;
        case 'P': offset.applyAxisAngle(right, -rotateSpeed); break;
        case 'y': offset.applyAxisAngle(up, rotateSpeed); break;
        case 'Y': offset.applyAxisAngle(up, -rotateSpeed); break;
        case ',': case '<': offset.multiplyScalar(1.05); break;
        case '.': case '>': offset.multiplyScalar(0.95); break;
        case 'ArrowUp': {
            event.preventDefault();
            const panOffset = up.clone().multiplyScalar(this.camera.position.distanceTo(this.controls.target) * 0.05);
            this.camera.position.sub(panOffset); this.controls.target.sub(panOffset); break;
        }
        case 'ArrowDown': {
            event.preventDefault();
            const panOffset = up.clone().multiplyScalar(this.camera.position.distanceTo(this.controls.target) * 0.05);
            this.camera.position.add(panOffset); this.controls.target.add(panOffset); break;
        }
        case 'ArrowLeft': {
            event.preventDefault();
            const panOffset = right.clone().multiplyScalar(this.camera.position.distanceTo(this.controls.target) * 0.05);
            this.camera.position.add(panOffset); this.controls.target.add(panOffset); break;
        }
        case 'ArrowRight': {
            event.preventDefault();
            const panOffset = right.clone().multiplyScalar(this.camera.position.distanceTo(this.controls.target) * 0.05);
            this.camera.position.sub(panOffset); this.controls.target.sub(panOffset); break;
        }
        case 'a': this.focusCamera(); return;
        case 'd': this.updateDiameterScale(this.activeGroupId, 0.9); break;
        case 'D': this.updateDiameterScale(this.activeGroupId, 1.1); break;
        default: return;
    }
    this.camera.position.copy(this.controls.target).add(offset);
  }

  updateDiameterScale(targetGroupId, factor) {
      if (!targetGroupId) return;
      const currentScale = this.diameterScales.get(targetGroupId) || 1.0;
      const newScale = currentScale * factor;
      this.diameterScales.set(targetGroupId, newScale);
      
      this.sceneObjects.forEach(obj => {
          if (obj.userData.entityName === targetGroupId && obj.type === 'Mesh') {
              if (obj.geometry.type === 'SphereGeometry') {
                  obj.scale.set(newScale, newScale, newScale);
              } else if (obj.geometry.type === 'CylinderGeometry') {
                  obj.scale.set(newScale, 1, newScale);
              }
          }
      });
  }

  focusCamera() {
    if (this.boundingBox.isEmpty()) return;
    const center = this.boundingBox.getCenter(new THREE.Vector3());
    const size = this.boundingBox.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = this.camera.fov * (Math.PI / 180);
    const cameraDistance = Math.abs(maxDim / 1.5 / Math.tan(fov / 2));
    this.camera.position.copy(center);
    this.camera.position.z += cameraDistance;
    this.controls.target.copy(center);
    this.camera.near = cameraDistance / 100;
    this.camera.far = cameraDistance * 100;
    this.camera.updateProjectionMatrix();
  }

  onWindowResize() {
    if (!this.container || this.container.clientWidth === 0) return;
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }

  animate = () => {
    requestAnimationFrame(this.animate);
    const canvas = this.renderer.domElement;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (canvas.width !== width || canvas.height !== height) {
        this.onWindowResize();
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    window.removeEventListener('resize', this.onWindowResize);
    window.removeEventListener('keydown', this.handleKeyDown);
    this.renderer.domElement.removeEventListener('click', this.handleClick);
    if(this.container && this.renderer.domElement) {
        this.container.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }
}
