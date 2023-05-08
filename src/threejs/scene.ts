import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GUI } from "dat.gui";
import { lerp } from "three/src/math/MathUtils";

import * as TWEEN from '@tweenjs/tween.js'

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

const imageTx = new THREE.TextureLoader().load("/profileSm.jpg");
const imgMaterial = new THREE.ShaderMaterial({
  uniforms: {
    texture: { value: imageTx },
  },
  vertexShader: `
      attribute vec2 uv;
  
      void main() {
        vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * modelViewPosition;
      }
    `,
  fragmentShader: `
      uniform sampler2D texture;
  
      void main() {
        vec4 color = texture2D(texture, vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y));
        gl_FragColor = vec4(color.rgb, color.a * opacity);
      }
    `,
  transparent: true,
  depthWrite: false,
});


let material = new THREE.PointsMaterial({
  size: 0.125,
  transparent: true,
  depthTest: false,
  blending: THREE.AdditiveBlending,
  sizeAttenuation: true,
  //@ts-expect-error
  onBeforeCompile: (shader: {
    uniforms: { time: { value: number } };
    vertexShader: string;
    fragmentShader: string;
  }) => {
    shader.uniforms.time = gu.time;
    shader.vertexShader = `
    uniform float time;
    attribute float sizes;
    attribute vec4 shift;
    varying vec3 vColor;
    ${shader.vertexShader}
    `
      .replace(`gl_PointSize = 30.0;`, `gl_PointSize = size * sizes;`)
      .replace(
        `#include <color_vertex>`,
        `#include <color_vertex>
        float d = length(abs(position) / vec3(40., 10., 40));
        d = clamp(d, 0., 1.);
        vColor = mix(vec3(227., 155., 0.), vec3(100., 50., 255.), d) / 255.;
        `
      )
      .replace(
        `#include <begin_vertex>`,
        `#include <begin_vertex>
          float t = time;
          float moveT = mod(shift.x + shift.z * t, PI2);
          float moveS = mod(shift.y + shift.z * t, PI2);
          transformed += vec3(cos(moveS) * sin(moveT), cos(moveT), sin(moveS) * sin(moveT)) * shift.w;
          `
      );
    console.log(shader.vertexShader);
    shader.fragmentShader = `
    varying vec3 vColor;
    ${shader.fragmentShader}
    `
      .replace(
        `#include <clipping_planes_fragment>`,
        `#include <clipping_planes_fragment>
      float d = length(gl_PointCoord.xy - 0.5);
      //if (d > 0.5) discard;
      `
      )
      .replace(
        `vec4 diffuseColor = vec4( diffuse, opacity );`,
        `vec4 diffuseColor = vec4( vColor, smoothstep(0.5, 0.1, d)/* * 0.5 + 0.5*/ );`
      );
    console.log(shader.fragmentShader);
  },
});



const sizes: number[] = [];
let shift: number[] = [];
const pushShift = () => {
  shift.push(
    Math.random() * Math.PI,
    Math.random() * Math.PI * 2,
    (Math.random() * 0.9 + 0.1) * Math.PI * 0.1,
    Math.random() * 0.9 + 0.1
  );
};

let SPHERE_SIZE = 50000
let OUTER_RIM_SIZE = 100000
let TOTAL_SIZE = SPHERE_SIZE + OUTER_RIM_SIZE; // 150000


// Generate inner SPEHERE
let galaxyPoints = new Array(SPHERE_SIZE).fill(null).map(p => {
  sizes.push(Math.random() * 1.5 + 0.5);
  pushShift();
  return new THREE.Vector3().randomDirection().multiplyScalar(Math.random() * 0.5 + 9.5);
})

// Generate outer RIM
for(let i = 0; i < OUTER_RIM_SIZE; i++){
  let r = 10, R = 40;
  let rand = Math.pow(Math.random(), 1.5);
  let radius = Math.sqrt(R * R * rand + (1 - rand) * r * r);
  galaxyPoints.push(new THREE.Vector3().setFromCylindricalCoords(radius, Math.random() * 2 * Math.PI, (Math.random() - 0.5) * 2 ));
  sizes.push(Math.random() * 1.5 + 0.5);
  pushShift();
}

let gu = {
  time: { value: 0 },
};


const galaxyGeometry = new THREE.BufferGeometry().setFromPoints(galaxyPoints);
galaxyGeometry.setAttribute("size", new THREE.Float32BufferAttribute(sizes, 1));
galaxyGeometry.setAttribute("shift", new THREE.Float32BufferAttribute(shift, 4));

const galaxyPositionsAttribute = new THREE.Float32BufferAttribute( galaxyGeometry.attributes.position.array, 3 );

const particleMaterial = new THREE.PointsMaterial({
  size: 0.125,
  depthTest: false,
  // blending: THREE.AdditiveBlending,
  sizeAttenuation: true,
  vertexColors: true,
});
const galaxyPointsSystem = new THREE.Points(galaxyGeometry, material);
scene.add(galaxyPointsSystem);





//                                                    //
//    -------- Generate Image Particles ----------    //
//                                                    //                  





function getPixelColor(
  imageData: { width: number; data: any[] },
  x: number,
  y: number
) {
  const index = (x + y * imageData.width) * 4;
  const r = imageData.data[index];
  const g = imageData.data[index + 1];
  const b = imageData.data[index + 2];

  return new THREE.Color(r / 255, g / 255, b / 255);
}


generateImageParticles("/profile387.jpg");

async function generateImageArrays(imageData: any) {
  const particleCount = TOTAL_SIZE;
  console.log("IMAGE SIZE ", imageData.width, imageData.height);
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    const x = i % imageData.width;
    const y = Math.floor(i / imageData.width);

    const color = getPixelColor(imageData, x, y);
    positions[i * 3] = x - imageData.width / 2;
    positions[i * 3 + 1] = imageData.height / 2 - y;

    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  return {
    positions,
    colors,
  };
}

let targetPositions: Float32Array;
let targetColors: Float32Array;

let targetPositionsAttribute: THREE.BufferAttribute;

function generateImageParticles(path: string) {
  const image = new Image();
  let imageData: ImageData;
  image.src = path;

  image.onload = async () => {
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d");

    //@ts-expect-error
    ctx.drawImage(image, 0, 0, image.width, image.height);
    //@ts-expect-error
    imageData = ctx.getImageData(0, 0, image.width, image.height);

    const { positions, colors } = await generateImageArrays(imageData);

    targetPositions = positions;
    targetColors = colors;

    const imageGeometry = new THREE.BufferGeometry();
    imageGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    imageGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const particleSystem = new THREE.Points(imageGeometry, particleMaterial);
    particleSystem.scale.set(0.1, 0.1, 0.1);

    targetPositionsAttribute = imageGeometry.getAttribute("position") as THREE.Float32BufferAttribute;


    console.log("Morph attribtes image" , galaxyPointsSystem.geometry.morphAttributes.position)
    console.log("Image Postions", targetPositionsAttribute)
    // scene.add(particleSystem);
  };
}




//                                                                  //                
//   -----------------  Morph Particles Animation ----------------- //
//                                                                  //            

let iSGalaxyMode = true;

function setProfileMode(){
  iSGalaxyMode = false;
  galaxyPointsSystem.material = particleMaterial; 
  galaxyPointsSystem.geometry.setAttribute("color", new THREE.BufferAttribute(targetColors, 3));
}
function setGalaxyMode(){
  iSGalaxyMode = true;
  galaxyPointsSystem.material = material;


}

// Update Particles frin initial position to target position

function updateParticleSys(
  startTime: number, 
  duration: number, 
  initialPositionsAttribute: THREE.Float32BufferAttribute, 
  targetPositionsAttribute: THREE.Float32BufferAttribute,
  DistanceScale: number = 1
) {
  const currentTime = Date.now();
  const elapsed = currentTime - startTime;
  const progress = elapsed / duration;
  const t = Math.min(progress, 1);

  for (let i = 0; i < TOTAL_SIZE; i++) {
    const initialX = initialPositionsAttribute.getX(i);
    const initialY = initialPositionsAttribute.getY(i);
    const initialZ = initialPositionsAttribute.getZ(i);
    const finalX = targetPositionsAttribute.getX(i);
    const finalY = targetPositionsAttribute.getY(i);
    const finalZ = targetPositionsAttribute.getZ(i);

    const x = initialX * (1 - t) + finalX * t / DistanceScale ;
    const y = initialY * (1 - t) + finalY * t / DistanceScale;
    const z = initialZ * (1 - t) + finalZ * t / DistanceScale;

    galaxyPointsSystem.geometry.attributes.position.setXYZ(i, x, y, z);
  }

  galaxyPointsSystem.geometry.attributes.position.needsUpdate = true;
}

const gui = new GUI();
const morphTrigger = gui.add({ on: false }, "on");

let startTime = 0;
let isAnimating = false;
let morph = false;
morphTrigger.onChange((value) => {
  isAnimating = true;
  startTime = Date.now();
  if(value)
  {
    setProfileMode();
    console.log("Morphing into ", targetPositionsAttribute )
  }
  else {
    setGalaxyMode();
    console.log("Morphing into galaxy", galaxyPositionsAttribute)
  }
});

let clock = new THREE.Clock();

const DURATION = 10000;


function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
  
  let t = clock.getElapsedTime() * 0.5;
  gu.time.value = t * Math.PI;
  const time = Date.now() * 0.001;
  imgMaterial.opacity = Math.sin(time * 2.0) * 0.5 + 0.5;


  const currentTime = Date.now();
  const elapsed = currentTime - startTime;

  TWEEN.update(); // update the tweens

  if (isAnimating) {
    if(iSGalaxyMode){
      updateParticleSys(
        startTime,  
        DURATION, 
        galaxyPointsSystem.geometry.getAttribute("position") as THREE.Float32BufferAttribute, 
        galaxyPositionsAttribute);
    }
    else{
      updateParticleSys(
        startTime,  
        DURATION, 
        galaxyPointsSystem.geometry.getAttribute("position") as THREE.Float32BufferAttribute, 
        targetPositionsAttribute,
        20
      );
    }

    if(elapsed >= DURATION / 10)
    {
      isAnimating = false;
    }
  }

}

animate();
