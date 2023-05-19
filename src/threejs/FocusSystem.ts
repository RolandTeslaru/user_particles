import  * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as TWEEN from '@tweenjs/tween.js'


export default class FocusSystem {
  targetPos!: THREE.Vector3;
  distance: number | undefined;
  camera: THREE.Camera;
  cameraPos!: THREE.Vector3;
  cameraRotation!: THREE.Euler;
  endFocus: boolean = false;
  controls: OrbitControls;

  constructor(camera: THREE.Camera, controls: OrbitControls) {
    this.camera = camera;
    this.controls = controls;
    this.cameraRotation = new THREE.Euler();

    window.addEventListener("wheel", this.onScroll.bind(this), false);
  }

  focusOnTarget(targetObj: THREE.Object3D) {
    this.targetPos = new THREE.Vector3();
    targetObj.getWorldPosition(this.targetPos);
    this.distance = this.camera.position.distanceTo(this.targetPos);
    this.cameraPos = this.camera.position.clone();
    this.cameraRotation.copy(this.camera.rotation);

    console.log("targeting", targetObj);

    // Calculate the offset position
    const offset = new THREE.Vector3(-0.1, -0.1, -0.1); // Adjust the values as needed
    const destination = this.targetPos.clone().add(offset);

    new TWEEN.Tween(this.cameraPos)
      .to(
        { x: destination.x, y: destination.y, z: destination.z },
        this.distance * 200
      )
      .onUpdate(() => {
        this.camera.position.set(
          this.cameraPos.x,
          this.cameraPos.y,
          this.cameraPos.z
        );

        const targetQuaternion = new THREE.Quaternion();
        const lookAtDirection = new THREE.Vector3().subVectors(this.targetPos, this.camera.position).normalize();

        if (lookAtDirection.lengthSq() === 0) {
          // Handle the case where the camera is already at the target position
          this.camera.lookAt(this.targetPos);
        } else {
          // Create a rotation matrix or quaternion that aligns the camera's forward direction with the target position
          this.camera.matrix.lookAt(this.camera.position, this.targetPos, this.camera.up);
          this.camera.matrixWorldNeedsUpdate = true;
          this.camera.quaternion.setFromRotationMatrix(this.camera.matrix);
        }
      })
      .onStart(() => {
        this.controls.enabled = false;
      })
      .onComplete(() => {
        this.stopFocus();
      })
      .start();
  }

  stopFocus() {
    this.endFocus = true;
    this.controls.enabled = true;
    TWEEN.removeAll();
  }

  onScroll(event: any) {
    console.log("Scrolling");
    if (this.endFocus) {
      this.endFocus = false;
      this.controls.enabled = true;
    }
  }

  update(camera: THREE.Camera) {
    this.camera = camera;
    TWEEN.update();
  }
}