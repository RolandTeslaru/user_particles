import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GUI } from "dat.gui";
import { lerp } from "three/src/math/MathUtils";

import * as TWEEN from '@tweenjs/tween.js'
import { Galaxy } from "./galaxy";
import { globalResources } from "./GlobalResources";
import { ProfileItem } from "./ProfileItem";
import { RaycasterUI } from "./raycaster";

import { clickableObjects } from "./galaxy";

export var renderTimeSeconds = 0;
export var rtPlane:any;
// Setup scene
let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  100000
  );
  let renderer = new THREE.WebGLRenderer();
  let controls = new OrbitControls(camera, renderer.domElement);
  
  renderer.setSize(window.innerWidth, window.innerHeight);
  //@ts-ignore
  document.getElementById("threejsCanvas").appendChild(renderer.domElement);
  console.log(document.getElementById("threejsCanvas"));
  
  function resizeRenderer() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
window.addEventListener("resize", resizeRenderer);


scene.background = new THREE.Color(0x160016);

controls.update();

camera.position.z = 5;



let clock = new THREE.Clock();

const SPHERE_SIZE = 50000;
const OUTER_RIM_SIZE = 100000;


const galaxy = new Galaxy(
  SPHERE_SIZE,
  OUTER_RIM_SIZE,
  3,
  3
);
  
// const raycaster = new RaycasterUI();
// window.addEventListener("mousemove", raycaster.onMouseMove);
// window.addEventListener("click", (event) =>  raycaster.onClick(event, new Array(clickableObjects.values())));


scene.add(galaxy)



function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);


  galaxy.updateAnimation(clock, camera, renderer);

}

animate();








