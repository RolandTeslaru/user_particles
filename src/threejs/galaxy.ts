
import * as THREE from "three"
import { ProfileIconUI, ProfileItem } from "./ProfileItem";
import * as TWEEN from '@tweenjs/tween.js';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { userControls } from "./scene"; 
import FocusSystem from "./FocusSystem";
import RaycasterSystem from "./RaycasterSystem";

interface IProfileData {
  profileId: number;
  profileItem : ProfileItem | null; 
}


export let activeProfiles: Map<number, ProfileItem> = new Map();
export let clickableObjects: Map<number, THREE.Object3D> = new Map();

export class Chunk extends THREE.Mesh{

  index_I: number = 0;
  index_J: number = 0;
  points: Array<THREE.Vector3> = [];
  particleSystem!: THREE.Points;
  boundingBox!: THREE.Box3;
  chunkParticleMaterial!: THREE.PointsMaterial;
  sizes: number[] = [];
  shift: number[] = [];
  freezeChunk: boolean = false;
  time = { value: 0 };

  pointer: THREE.Vector2
  
  constructor(geometry: THREE.BufferGeometry, material: THREE.Material){
    super(geometry, material);
    this.pointer = new THREE.Vector2(0, 0);
    this.chunkParticleMaterial = new THREE.PointsMaterial({
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
        shader.uniforms.time = this.time;
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
      },
    });
  }


  update(clock: THREE.Clock){
    if(this.freezeChunk === false)
    {
      this.time.value = clock.getElapsedTime() * Math.PI;
    }
  }

  isCameraNear(camera: THREE.Camera, distanceThreshold: number): boolean{
    const cameraPos = camera.position;
    camera.getWorldPosition(cameraPos);

    if(this.boundingBox.distanceToPoint(cameraPos) < distanceThreshold)
      this.freezeChunk = true;
    else
      this.freezeChunk = false;
    
    return this.boundingBox.distanceToPoint(cameraPos) < distanceThreshold;
  }
}




export class Galaxy extends THREE.Group {
  TOTAL_SIZE: number;
  SPHERE_SIZE: number;
  OUTER_RIM_SIZE: number;
  targetPositionsAttribute: THREE.Float32BufferAttribute | undefined;
  galaxyPositionsAttribute: THREE.Float32BufferAttribute | undefined;
  galaxyGeometry: THREE.BufferGeometry | undefined;
  galaxyMaterial: THREE.PointsMaterial;

  galaxyReady: boolean = false;

  sizes: number[] = []; // this is for the inner sphere
  shift: number[] = []; // this is for hte inner spherr 
  // The Outer rim has the size and shift arrays in seperate chunks

  galaxyPoints: Array<THREE.Vector3> = []; // this is for the inner sphere

  pointsSystem: THREE.Points<
    THREE.BufferGeometry<THREE.NormalBufferAttributes>,
    THREE.PointsMaterial | THREE.ShaderMaterial
  > = new THREE.Points(); // this is for the inner sphere


  startTime: number = 0;
  DURATION: number = 10000;
  currentTime: number = 0;

  CHUNKS_NUM: number = 100;
  CHUNK_LEN: number;
  ChunksArray: Chunk[][] = [];

  OUTER_RIM_RADIUS: number = 40;
  CHUNK_DISTANCE_THRESHOLD: number = 4;
  POINT_DISTANCE_THRESHOLD: number = 4;

  time: { value: number } = { value: 0 };

  raycaster: RaycasterSystem;
  clock!: THREE.Clock;
  camera!: THREE.Camera;
  renderer!: THREE.WebGLRenderer;

  focusSys: FocusSystem;

  constructor(
    SPHERE_SIZE: number,
    OUTER_RIM_SIZE: number,
    CHUNK_DISTANCE_THRESHOLD: number = 4,
    POINT_DISTANCE_THRESHOLD: number = 4,
    OUTER_RIM_RADIUS = 42
  ) {
    super();
    this.TOTAL_SIZE = SPHERE_SIZE + OUTER_RIM_SIZE;
    this.SPHERE_SIZE = SPHERE_SIZE;
    this.OUTER_RIM_SIZE = OUTER_RIM_SIZE;
    this.OUTER_RIM_RADIUS = OUTER_RIM_RADIUS;
    this.CHUNK_LEN = 6;
    this.CHUNK_DISTANCE_THRESHOLD = CHUNK_DISTANCE_THRESHOLD;
    this.POINT_DISTANCE_THRESHOLD = POINT_DISTANCE_THRESHOLD;
    this.raycaster = new RaycasterSystem();
    this.focusSys = new FocusSystem(this.camera, userControls);

    window.addEventListener("mousemove", (event: any) => this.raycaster.onMouseMove(event));
    window.addEventListener("click", (event: any) => this.onClick(event));

    
    this.galaxyMaterial = new THREE.PointsMaterial({
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
        shader.uniforms.time = this.time;
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
      },
    });

    this.generateGalaxy();
  }


  onClick(event: any){
    const target = this.raycaster.findIntersectingObject(event, Array.from(clickableObjects.values()), this.camera);
    console.log("Array from ", Array.from(clickableObjects.values()));
    if(target){
      this.focusSys.update(this.camera);
      this.focusSys.focusOnTarget(target);
    }
    else
      console.log("Target not found");
  }

  
  // if the camera is within the threshold of the chunk 
  //and within the threshold of the point then add it to the array
  activateProfile(point: THREE.Vector3, index: number) {
    if (!activeProfiles.has(index)) {
      const profileItem = new ProfileItem("/profileSm.jpg", index);
      profileItem.position.set(point.x, point.y, point.z);
      activeProfiles.set(index, profileItem);
      this.add(profileItem);
      profileItem.animateAppear();

      clickableObjects.set(index, profileItem);
    }
  }

  // Search if the camera is within the threshold of the chunk
  findPoints(chunkDistanceThreshold: number, pointDistanceThreshold: number) {
    const cameraDirection = this.camera.getWorldDirection(new THREE.Vector3());
  
    for (let i = 0; i < Math.sqrt(this.CHUNKS_NUM); i++) {
      for (let j = 0; j < Math.sqrt(this.CHUNKS_NUM); j++) {
        const chunk = this.ChunksArray[i][j];
        const chunkCenter = new THREE.Vector3();
        chunk.getWorldPosition(chunkCenter);

        if (this.ChunksArray[i][j].isCameraNear(this.camera, chunkDistanceThreshold)) {
          // Check for near points inside the chunk
          for (let k = 0; k < this.ChunksArray[i][j].points.length; k++) {
            const point = this.ChunksArray[i][j].points[k];
            const cameraToPoint = new THREE.Vector3().subVectors(point, this.camera.position).normalize();
            const THRESHOLD = 0.7;
            
            if (this.camera.position.distanceTo(point) < pointDistanceThreshold) 
              if(cameraToPoint.dot(cameraDirection) > THRESHOLD)
                if (!activeProfiles.has(k)) 
                  this.activateProfile(point, k);
          }
        }
      }
    }
  }

  getOuterRimAraray() {
    const outerRimPoints = this.galaxyPoints;
    outerRimPoints.slice(0, this.SPHERE_SIZE);
    outerRimPoints.push(...outerRimPoints.splice(this.SPHERE_SIZE));

    return outerRimPoints;
  }


  // findTargetWindow(){
  //   for(this.raycaster. )
  // }

  generateChunks() {
    const geom = new THREE.BoxGeometry(
      (2 * this.OUTER_RIM_RADIUS) / Math.sqrt(this.CHUNKS_NUM),
      (2 * this.OUTER_RIM_RADIUS) / Math.sqrt(this.CHUNKS_NUM),
      (2 * this.OUTER_RIM_RADIUS) / Math.sqrt(this.CHUNKS_NUM)
    );
    const material = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      wireframe: true,
    });
  
    this.ChunksArray = []; // Initialize the array
  
    for (let i = 0; i < Math.sqrt(this.CHUNKS_NUM); i++) {
      this.ChunksArray[i] = []; // Initialize the inner arrays
      for (let j = 0; j < Math.sqrt(this.CHUNKS_NUM); j++) {
        const chunk = new Chunk(geom, material);
  
        const posX = ((2 * this.OUTER_RIM_RADIUS) / Math.sqrt(this.CHUNKS_NUM)) * (j - 4.5) ;
        const posZ = ((2 * this.OUTER_RIM_RADIUS) / Math.sqrt(this.CHUNKS_NUM)) * (i - 4.5);
        chunk.position.set(posX, 0, posZ);
        chunk.index_I = i;
        chunk.index_J = j;

        this.ChunksArray[i][j] = chunk;

        const boundingBox = new THREE.Box3().setFromObject(chunk);
        this.ChunksArray[i][j].boundingBox = boundingBox;
      }
    }
  }

  generateChunkParticleSys() {
    for (let i = 0; i <  Math.sqrt(this.CHUNKS_NUM); i++) {
      for (let j = 0; j <  Math.sqrt(this.CHUNKS_NUM); j++) {
        
        const geometry = new THREE.BufferGeometry().setFromPoints(this.ChunksArray[i][j].points);
        geometry.setAttribute('sizes', new THREE.Float32BufferAttribute(this.ChunksArray[i][j].sizes, 1));
        geometry.setAttribute('shift', new THREE.Float32BufferAttribute(this.ChunksArray[i][j].shift, 4));

        this.ChunksArray[i][j].particleSystem = new THREE.Points(
          geometry,
          this.ChunksArray[i][j].chunkParticleMaterial
        );
        this.add(this.ChunksArray[i][j].particleSystem);
      }
    }
  }

  assigPointToChunk(point: THREE.Vector3) {
    for (let i = 0; i < Math.sqrt(this.CHUNKS_NUM); i++) {
      for (let j = 0; j <  Math.sqrt(this.CHUNKS_NUM); j++) {
        if (this.ChunksArray[i][j].boundingBox.containsPoint(point)) {

          this.ChunksArray[i][j].points.push(point);
          this.ChunksArray[i][j].sizes.push(Math.random() * 1.5 * 0.5);
          this.pushShift(this.ChunksArray[i][j].shift);
          
          return; // We found the chunk, so we can stop searching.
        }
      }
    }
  }  

  getCameraAngle(){
    const cameraDirection = this.camera.getWorldDirection(new THREE.Vector3());
    const angle = cameraDirection.angleTo(this.camera.position);
    return angle;
  }

  isProfileValid(profile: ProfileItem){
    const distance = profile!.position.distanceTo(this.camera.position);
    const cameraToPoint = new THREE.Vector3().subVectors(profile!.position, this.camera.position).normalize();
    const THRESHOLD = 0.7;
    if( distance > this.POINT_DISTANCE_THRESHOLD || 
        cameraToPoint.dot(this.camera.getWorldDirection(new THREE.Vector3())) < THRESHOLD)
        return false;
    
    return true;
  }
  
  generateGalaxy() {
    // Generate inner sphere points
    this.galaxyPoints = new Array(this.SPHERE_SIZE).fill(null).map((p) => {
      this.sizes.push(Math.random() * 1.5 + 0.5);
      this.pushShift(this.shift);
      return new THREE.Vector3()
      .randomDirection()
      .multiplyScalar(Math.random() * 0.5 + 9.5);
    });
    
    // Generate Chunks
    this.generateChunks();

    // Generate outer rim points
    for (let i = 0; i < this.OUTER_RIM_SIZE; i++) {
      let r = 10, R = 40;
      let rand = Math.pow(Math.random(), 1.5);
      let radius = Math.sqrt(R * R * rand + (1 - rand) * r * r);
      const point = new THREE.Vector3().setFromCylindricalCoords(
        radius,
        Math.random() * 2 * Math.PI,
        (Math.random() - 0.5) * 2
      );
      // Assign outer rim points to chunks
      this.assigPointToChunk(point);
    }
    this.generateChunkParticleSys();

    this.galaxyGeometry = new THREE.BufferGeometry().setFromPoints(this.galaxyPoints);
    this.galaxyGeometry.setAttribute("size",new THREE.Float32BufferAttribute(this.sizes, 1));
    this.galaxyGeometry.setAttribute("shift",new THREE.Float32BufferAttribute(this.shift, 4));

    this.galaxyPositionsAttribute = 
      new THREE.Float32BufferAttribute(this.galaxyGeometry.attributes.position.array,3);

    this.pointsSystem = new THREE.Points(this.galaxyGeometry, this.galaxyMaterial);
    this.add(this.pointsSystem);
    this.galaxyReady = true;
  }

  pushShift(array: number[]) {
    array.push(
      Math.random() * Math.PI,
      Math.random() * Math.PI * 2,
      (Math.random() * 0.9 + 0.1) * Math.PI * 0.1,
      Math.random() * 0.9 + 0.1
    );
  }

  updateAnimation(clock: THREE.Clock, camera : THREE.Camera, renderer: THREE.WebGLRenderer) {
    this.clock = clock;
    this.camera = camera;
    this.renderer = renderer;
    
    let t = this.clock.getElapsedTime();
    this.time.value = t * Math.PI;

    const chunkRows = this.ChunksArray;
    const rowsLength = chunkRows.length;

    for (let i = 0; i < rowsLength; i++) {
      const chunkRow = chunkRows[i];
      const chunksLength = chunkRow.length;

      for (let j = 0; j < chunksLength; j++) {
        const chunk = chunkRow[j];
        chunk.update(clock);
      }
    }
    this.findPoints(this.CHUNK_DISTANCE_THRESHOLD, this.POINT_DISTANCE_THRESHOLD);

    TWEEN.update();

    activeProfiles.forEach((profile: ProfileItem | null, key) => {
      // Calculate the distance between the profile and the camera
      profile!.update(camera, clock);

      this.disposeOfProfile(profile, renderer);
    });
  }

  disposeOfProfile(profile: ProfileItem | null, renderer: THREE.WebGLRenderer){
    if(this.isProfileValid(profile!) === false){
      this.remove(profile!);
      profile!.dispose();
      activeProfiles.delete(profile!.profileId);
      clickableObjects.delete(profile!.profileId);

      renderer.renderLists.dispose();
      profile = null;
    }
  }

} 
