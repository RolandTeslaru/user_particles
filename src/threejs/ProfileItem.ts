import * as THREE from "three";
import { globalResources } from "./GlobalResources";
import { novaBaseVS, glitchProfilePFS, BtnFaceFS, BtnTextFS, glitchButtonFS, BtnLightFS } from './shaders';
import * as TWEEN from '@tweenjs/tween.js';
import { PROFILE_ANIMATE_TIME } from "./GlobalResources";
import TextSprite from '@seregpie/three.text-sprite';
import { Font, FontLoader } from "three/examples/jsm/loaders/FontLoader";

import opentype from 'opentype.js';

const loader = new THREE.TextureLoader();

const textMaterial = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    side: THREE.DoubleSide,
    blending: THREE.NormalBlending,
});




let fontPromise: Promise<Font> | null = null;
const fontLoader = new FontLoader();

function loadFont() {
  return new Promise((resolve, reject) => {
    fontLoader.load('fonts/Arial_Regular.json', font => {
      resolve(font);
    }, undefined, reject);
  });
}


export class TextUI extends THREE.Mesh {
  constructor(text = 'Text', size = 1, color = 0xffffff) {
    super();

    if (!fontPromise) {
      fontPromise = loadFont().then((font) => {
        if (font instanceof Font) {
          return font;
        } else {
          throw new Error('Failed to load font');
        }
      });
    }

    fontPromise.then((font) => {
      const shapes = font.generateShapes(text, size / 10);
      const textGeo = new THREE.ShapeGeometry(shapes);
      textGeo.computeBoundingBox();

      this.geometry = textGeo;
      this.material = new THREE.MeshBasicMaterial({ color });

    });
  }

  dispose(){
    this.geometry.dispose();
    //@ts-expect-error
    this.material.dispose();
  }
}


export class ButtonUI extends THREE.Group {

    mesh: THREE.Mesh;
    text: THREE.Mesh

    constructor (){
        super();

        this.mesh = globalResources.buttonMesh.clone();
        this.mesh.position.set(0, 0, 0.01);
        this.mesh.scale.setScalar(0.04);
        this.mesh.scale.setX(0.08);
        this.add(this.mesh);

        this.text = new TextUI("Show More", 0.05, 0xffffff);
        this.text.position.set(-0.02, -0.001, 0.02);
        this.add(this.text);
    }

    dispose(){
  
    }
}





export class ProfileIconUI extends THREE.Mesh {
    imagePath: string;
    textList: {
        text: string,
        h: number,
        x: number,
        y: number,
        align: string
    }[] = [];

    constructor (imagePath: string){
        
        let geometry = new THREE.PlaneGeometry(0.21, 0.21, 2, 2)
        let material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            depthTest: true,
            depthWrite: true,
            alphaMap: globalResources.photoAlpha,
        });
        
        material.map = loader.load(imagePath);
        material.needsUpdate = true;

        super(geometry, material);
        this.imagePath = imagePath;
        this.scale.setScalar(0.8);
    }

    dispose(){
        this.geometry.dispose();
        //@ts-expect-error
        this.material.dispose();
    }
}



export class ProfileItem extends THREE.Group{ 
    
    window: THREE.Mesh | null;
    photo: ProfileIconUI | null;

    imagePath: string;
    isFocused: boolean = false;

    infoBtn: ButtonUI | null;

    age?: number = 0;
    height?: number = 0;
    gender?: string = "male";
    userName?: string = "user";
    userID?: number = 0;

    headerUI: TextUI | null;
    nameUI: TextUI | null;
    ageUI: TextUI | null;
    heightUI: TextUI | null;
    genderUI: TextUI | null;
    profileId: number | null;

    textList: any[] = [];

    tween!: TWEEN.Tween<THREE.Vector3>;

    boundingBox: THREE.BoxHelper | null;


    constructor(
        imagePath: string, 
        profileId: number, 
        userName: string, 
        age: number, 
        gender: string, 
        height: number 
    ){
        super();

        this.imagePath = imagePath;
  
        this.window = globalResources.profileWindowMesh.clone();
        this.window.scale.setX(0.25);
        this.window.scale.setY(0.3);
        this.window.scale.setY(0.3);
        this.add(this.window)

        this.profileId = profileId;
        this.userName = userName;
        this.age = age;
        this.gender = gender;
        this.height = height;

        this.photo = new ProfileIconUI(this.imagePath);
        this.photo.position.set(-0.05, 0.005 ,0.03)
        this.photo.scale.setScalar(0.2);
        this.add(this.photo);

        this.infoBtn = new ButtonUI();
        this.infoBtn.position.set(0.05, -0.02, 0.01);
        this.add(this.infoBtn);

        
     
        this.headerUI = new TextUI(`Profile# ${this.profileId}` , 0.05, 0xffffff );
        this.headerUI.position.set(0.02, 0.03, 0.01);
        this.headerUI.position.setZ(0.01);
        this.add(this.headerUI);


        this.nameUI = new TextUI(`Name: ${this.userName}` , 0.04, 0xffffff );
        this.nameUI.position.set(-0.02, 0.015, 0.01);
        this.nameUI.position.setZ(0.01);
        this.add(this.nameUI);

        this.ageUI = new TextUI(`Age: ${this.age}` , 0.04, 0xffffff );
        this.ageUI.position.set(-0.02, 0.005, 0.01);
        this.ageUI.position.setZ(0.01);
        this.add(this.ageUI);

        this.genderUI = new TextUI("Gender: Female", 0.04, 0xffffff );
        this.genderUI.position.set(-0.02, -0.005, 0.01);
        this.genderUI.position.setZ(0.01);
        this.add(this.genderUI);

        this.heightUI = new TextUI(`Height: ${this.height}` , 0.04, 0xffffff );
        this.heightUI.position.set(-0.02, -0.015, 0.01);
        this.heightUI.position.setZ(0.01);
        this.add(this.heightUI);

        this.boundingBox = new THREE.BoxHelper(this, 0x00ff00);
    }
    
    update(camera: THREE.Camera, clock: THREE.Clock){
        this.lookAt(camera.position);       // Make the window always face the Camera
   
    }

    animateAppear() {
        const startScale = new THREE.Vector3(0, 0, 0); // Initial scale
        const endScale = new THREE.Vector3(1, 1, 1); // Target scale
      
        // Create a tween animation
        this.tween = new TWEEN.Tween(startScale)
          .to(endScale, PROFILE_ANIMATE_TIME)
          .easing(TWEEN.Easing.Elastic.Out)
          .onUpdate(() => {
            this.scale.copy(startScale);
          })
          .onComplete(() => {
            this.scale.copy(endScale); // Set the final scale explicitly
          });
      
        this.tween.start();
      }

    updateAnimation(tween: any){
        if (tween)
            TWEEN.update();
    }

 

    // Dispose after the window is no longer within the threshold
    dispose(){
        this.window!.geometry.dispose();
        //@ts-expect-error
        this.window.material.dispose();
        this.photo!.dispose();
        this.infoBtn!.dispose();
        this.headerUI!.dispose();
        this.nameUI!.dispose();
        this.ageUI!.dispose();
        this.heightUI!.dispose();
        this.genderUI!.dispose();
            

        this.remove(
            //@ts-expect-error
            this.window, 
            this.photo, 
            this.infoBtn, 
            this.headerUI, 
            this.nameUI, 
            this.ageUI,
            this.heightUI, 
            this.genderUI,
            this.boundingBox
        );
   

        this.window = null;
        this.photo = null;
        this.infoBtn = null;
        this.headerUI = null;
        this.nameUI = null;
        this.ageUI = null;
        this.heightUI = null;
        this.genderUI = null;
        this.boundingBox = null;
    
        TWEEN.remove(this.tween);
        // this.remove(this.headerUI);
    }
}