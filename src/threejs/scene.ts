import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { Galaxy } from "./Galaxy";
import { globalResources } from "./GlobalResources";

export var renderTimeSeconds = 0;
export var rtPlane: any;
// Setup scene
let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  100000
);
camera.position.set(15, 3, 15);
let renderer = new THREE.WebGLRenderer();
export const userControls = new OrbitControls(camera, renderer.domElement);
userControls.update();
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


const SPHERE_SIZE = 50000;
const OUTER_RIM_SIZE = 100000;


const galaxy = new Galaxy(
  SPHERE_SIZE,
  OUTER_RIM_SIZE,
  3,
  3
);
scene.add(galaxy)

let clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);

  galaxy.updateAnimation(clock, camera, renderer);
}

animate();








