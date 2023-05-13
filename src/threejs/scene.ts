import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GUI } from "dat.gui";
import { lerp } from "three/src/math/MathUtils";

import * as TWEEN from '@tweenjs/tween.js'
import { Galaxy } from "./galaxy";
import { ProfileWindow } from "./ProfileWindow";
import { globalResources } from "./GlobalResources";
import { ProfileItem } from "./ProfileItem";
import { Octree } from '@brakebein/threeoctree';

export var renderTimeSeconds = 0;
export var rtPlane:any;
// Setup scene
let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  1,
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

controls.enableDamping = true;
controls.enablePan = false;

scene.background = new THREE.Color(0x160016);

controls.update();

camera.position.z = 5;



let clock = new THREE.Clock();

const SPHERE_SIZE = 50000;
const OUTER_RIM_SIZE = 100000;


const galaxy = new Galaxy(
  SPHERE_SIZE,
  OUTER_RIM_SIZE,
);

scene.add(galaxy)


export function renderText(text:any, h:any, x:any, y:any, clr:any, align:any) { // Рендер текста

  let shapes = globalResources.Gfont.generateShapes(text, h);
  let xMid;
  let textGeo = new THREE.ShapeGeometry( shapes ); // new THREE.ShapeBufferGeometry( shapes );

  textGeo.computeBoundingBox();
  if(textGeo.boundingBox)
    xMid = textGeo.boundingBox.max.x;
  if (align == 'c') 
    textGeo.translate( -xMid/2, 0, 0 );
  else if (align == 'r') 
    textGeo.translate( -xMid, 0, 0 );

  let textMaterial = new THREE.MeshLambertMaterial( {
    color: clr,
    emissive: clr,
    side: THREE.DoubleSide,
    blending: THREE.NormalBlending
  } );

  let mesh = new THREE.Mesh( textGeo, textMaterial );
  mesh.position.set(x, y, 0.001);
  mesh.visible = true;

  return mesh;
}


export function clear3DChilds(obj3d?:any) { // Меши (3D-объекта) от потомков, с освобождением занимаемой памяти. При отсутствии аргумента - Очистка сцены работающей с рендер-таргетами.
	if (!obj3d) obj3d = rtPlane;
	for (let i = obj3d.children.length - 1; i > -1; i--) if (obj3d.children[i]) {
		let c = obj3d.children[i];
		clear3DChilds(c);
		obj3d.remove(c);
		c.geometry.dispose(); // Предотвращаем утечку памяти
		c.material.dispose(); // Материал для текста. Может сохранить его глобально?
		c = null;
	}
}

export function makeRenderTarget(baseColor: any, textColor: any, textList: string | any[], rtWidth: number, rtHeight: number ) { // Создает новый Рендер-таргет с новыми параметрами
	clear3DChilds();
	let mtl = new THREE.MeshLambertMaterial( {
			color: baseColor,
			side: THREE.DoubleSide,
			blending: THREE.NormalBlending
		} );
	rtPlane.material = mtl;
	rtPlane.material.needsUpdate = true;
	for (let i = 0; i < textList.length; i++) {
		let textItem = textList[i];
		rtPlane.add(renderText(textItem.text, textItem.h, textItem.x, textItem.y, textColor, textItem.align));
	}
	let renderTarget = new THREE.WebGLRenderTarget(rtWidth, rtHeight, {
		anisotropy: maxEnabledAnisotropy
	});
	// draw render target scene to render target
	renderer.clear();
	renderer.setSize(rtWidth, rtHeight);
    renderer.setRenderTarget(renderTarget);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
	resizeRenderer();
	return renderTarget;
};


const isNearGalaxy = (camera: THREE.Camera) => {
  return camera.position.length() < SPHERE_SIZE + 1000;
}



// As there are over 150000 points in the scene calculating the distnace between the camera and every point would be to costly.
// We create a bounding Sphere that encloses the Outer Rim and check if the camera is inside it or not.



const profileItem = new ProfileItem("/profileSm.jpg");
scene.add(profileItem);





console.log(galaxy.pointsSystem.geometry.getAttribute("position"))



function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);

  profileItem.update(camera);

  galaxy.updateAnimation(clock, camera);

}

animate();








