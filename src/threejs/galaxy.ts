
import * as THREE from "three"
import { ProfileIconUI, ProfileItem } from "./ProfileItem";

let index = 0;

interface profileData {
  profileId: number;
  profileItem : ProfileItem | null; 
  hasProfile: boolean;
}

let profilesArray: profileData[] = [];
for(let i = 0; i < 100000; i++){
  profilesArray.push({profileId: i, profileItem: null, hasProfile: false});
}
console.log("FADFASFAD", profilesArray)

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

  
  constructor(geometry: THREE.BufferGeometry, material: THREE.Material){
    super(geometry, material);
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
      this.time.value = clock.getElapsedTime() * Math.PI;
   
  }

  isCameraNear(camera: THREE.Camera, distanceThreshold: number): boolean{
    const cameraPos = camera.position;
    camera.getWorldPosition(cameraPos);

    if(this.boundingBox.distanceToPoint(cameraPos) < distanceThreshold)
    {
      this.freezeChunk = true;
    }
    else
      this.freezeChunk = false;

    return this.boundingBox.distanceToPoint(cameraPos) < distanceThreshold;
  }



  activateProfile(point: THREE.Vector3, index: number) {
    console.log("Creating Profile");
    
    // Check if a ProfileItem already exists for the given index
    if (profilesArray[index] && profilesArray[index].hasProfile === true) {
      console.log("Profile has already been created");
      this.add(profilesArray[index].profileItem);
    } else {
      console.log("Profile doesn't exist on the index");
      console.log("Creating ProfileItem");
      profilesArray[index] = {
        profileId: index,
        profileItem: new ProfileItem("/profileSm.jpg", index),
        hasProfile: true,
      };
      this.add(profilesArray[index].profileItem);
    }
  }




  arePointsNearCamera(camera: THREE.Camera, distanceThreshold: number) {
    const cameraPosition = new THREE.Vector3();
    camera.getWorldPosition(cameraPosition);

    for (let i = 0; i < this.points.length; i++) {
      const point = this.points[i];
      if (cameraPosition.distanceTo(point) < distanceThreshold) {
        if (!profilesArray[i]) {
          this.activateProfile(point, i);
        }
      } else {
        if (profilesArray[i]) {
          // Remove profileItem from the scene or the container object
          // Example: scene.remove(profilesArray[i]);
          profilesArray[i] = undefined;
        }
      }
    }
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

  finalRadius!: number;
  CHUNKS_NUM: number = 100;
  CHUNK_LEN: number;
  ChunksArray: Chunk[][] = [];

  OUTER_RIM_RADIUS: number = 40;

  time: { value: number } = { value: 0 };

  constructor(
    SPHERE_SIZE: number,
    OUTER_RIM_SIZE: number,
  ) {
    super();
    this.TOTAL_SIZE = SPHERE_SIZE + OUTER_RIM_SIZE;
    this.SPHERE_SIZE = SPHERE_SIZE;
    this.OUTER_RIM_SIZE = OUTER_RIM_SIZE;

    this.CHUNK_LEN = 6;

    this.finalRadius = 42;

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

  findPoints(camera: THREE.Camera, chunkDistanceThreshold: number, pointDistanceThreshold: number): number[] {
    const nearPointsIndices: number[] = [];
  
    // Check if chunks are near the camera
    for (let i = 0; i < Math.sqrt(this.CHUNKS_NUM); i++) {
      for (let j = 0; j < Math.sqrt(this.CHUNKS_NUM); j++) {
        const chunk = this.ChunksArray[i][j];
        const chunkCenter = new THREE.Vector3();
        chunk.getWorldPosition(chunkCenter);
  
        if (this.ChunksArray[i][j].isCameraNear(camera, chunkDistanceThreshold)) {
          // Check for near points inside the chunk

          this.ChunksArray[i][j].arePointsNearCamera(camera, pointDistanceThreshold);
        }
      }
    }
  
    return nearPointsIndices;
  }

  getOuterRimAraray() {
    const outerRimPoints = this.galaxyPoints;
    outerRimPoints.slice(0, this.SPHERE_SIZE);
    outerRimPoints.push(...outerRimPoints.splice(this.SPHERE_SIZE));

    return outerRimPoints;
  }

  generateChunks() {
    const geom = new THREE.BoxGeometry(
      (2 * this.finalRadius) / Math.sqrt(this.CHUNKS_NUM),
      (2 * this.finalRadius) / Math.sqrt(this.CHUNKS_NUM),
      (2 * this.finalRadius) / Math.sqrt(this.CHUNKS_NUM)
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
  
        const posX = ((2 * this.finalRadius) / Math.sqrt(this.CHUNKS_NUM)) * (j - 4.5) ;
        const posZ = ((2 * this.finalRadius) / Math.sqrt(this.CHUNKS_NUM)) * (i - 4.5);
        chunk.position.set(posX, 0, posZ);
  
        this.ChunksArray[i][j] = chunk;

        const boundingBox = new THREE.Box3().setFromObject(chunk);
        this.ChunksArray[i][j].boundingBox = boundingBox;
        this.add(this.ChunksArray[i][j]);
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

  generateGalaxy() {

    // Generate the inner sphere points
    this.galaxyPoints = new Array(this.SPHERE_SIZE).fill(null).map((p) => {
      this.sizes.push(Math.random() * 1.5 + 0.5);
      this.pushShift(this.shift);
      return new THREE.Vector3()
      .randomDirection()
      .multiplyScalar(Math.random() * 0.5 + 9.5);
    });
    

    // Generate Chunks
    this.generateChunks();

    // Generate the outer rim points
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

    this.galaxyPositionsAttribute = new THREE.Float32BufferAttribute(this.galaxyGeometry.attributes.position.array,3);

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

  updateAnimation(clock: THREE.Clock, cmaera : THREE.Camera) {
    const currentTime = Date.now();
    const elapsed = currentTime - this.startTime;

    let t = clock.getElapsedTime();
    this.time.value = t * Math.PI;

    for(let i=0; i< Math.sqrt(this.CHUNKS_NUM); i++) {
      for(let j=0; j< Math.sqrt(this.CHUNKS_NUM); j++) {
        this.ChunksArray[i][j].update(clock)
      }
    }
    this.findPoints(cmaera, 5,5);
  }

}
  
  
  
  