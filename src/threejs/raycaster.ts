import * as THREE from 'three';

export default class RaycasterSystem extends THREE.Raycaster {
  pointer: THREE.Vector2 = new THREE.Vector2(0, 0);
  objects: THREE.Object3D[] | null = null;

  constructor() {
    super();
  }

  setClickable(objects: THREE.Object3D[]) {
    this.objects = objects;
  }

  findIntersectingObject(event: any, clickableObjects: THREE.Object3D[], camera: THREE.Camera) {
    console.log("Mouse Click");
    this.objects = clickableObjects;
    this.setFromCamera(this.pointer, camera);

    const intersects = this.intersectObjects(this.objects!);
    console.log("intersects ", intersects)
    if (intersects.length > 0) {
      return intersects[0].object;

    }

    return null;
  }

  onMouseMove(event: any) {
    this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }

  update(camera: THREE.Camera) {
    this.setFromCamera(this.pointer, camera);

    if (this.objects) {
      const intersects = this.intersectObjects(this.objects!);
      for (let i = 0; i < intersects.length; i++) {
        // @ts-ignore
        intersects[i].object.material.color.set(0xff0000);
        console.log("object intersected", this.intersectObject);
      }
    }
  }
}