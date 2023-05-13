import * as THREE from "three";
import { globalResources } from "./GlobalResources";
import { novaBaseVS, glitchProfilePFS, BtnFaceFS, BtnTextFS, glitchButtonFS, BtnLightFS } from './shaders';

const loader = new THREE.TextureLoader();

export class TextUI extends THREE.Mesh {

    constructor (){

        super();
    }
}

export class ButtonUI extends THREE.Group {

    material: THREE.MeshBasicMaterial | THREE.ShaderMaterial;
    geometry: THREE.BufferGeometry<THREE.NormalBufferAttributes>;
    mesh: THREE.Mesh;

    text:THREE.Mesh

    constructor (){
        super();

        this.geometry = new THREE.PlaneGeometry(0.28, 0.07, 2, 2);
        this.material = new THREE.ShaderMaterial({
            blending: THREE.AdditiveBlending, 
            vertexShader: novaBaseVS,
            fragmentShader: BtnLightFS,
            uniforms: {
                renderTime: {value: 0},
                btnColor: {value: new THREE.Color(0.01, 0.914, 0.957)}
            },
            side: THREE.FrontSide,
            depthTest: true,
            depthWrite: false,
            transparent: true,
            precision: "highp", 
            dithering: true,
        });
        this.material.needsUpdate = true;

        this.mesh = new THREE.Mesh(this.geometry, this.material);

        const textGeom = new THREE.PlaneGeometry(0.30, 0.14, 2, 2);
        const textMaterial = new THREE.ShaderMaterial({
            blending: THREE.AdditiveBlending, 
            vertexShader: novaBaseVS,
            fragmentShader: BtnTextFS,
            uniforms: {
                renderTime: {value: 0},
                alphaMap: {value: null},
                btnColor: {value: new THREE.Color(0.01, 0.914, 0.957)}
            },
            side: THREE.FrontSide,
            depthTest: true, 
            depthWrite: false,
            transparent: true,
            precision: "highp", 
            dithering: true,
            alphaTest: 0.5,
            name: 'btntext dasdas'
        });
        textMaterial.uniformsNeedUpdate = true;
        this.text = new THREE.Mesh(textGeom, textMaterial);
        this.add(this.text);
        // this.add(this.mesh);
    }
}



export class HeaderUI extends THREE.Mesh{
    headerId: number;
    headerName: string;
    constructor(
        headerId: number,
    ){

        let geometry = new THREE.PlaneGeometry(0.25, 0.16, 2, 2);
        let material = new THREE.MeshBasicMaterial({color: 0xffff00, transparent: true, blending: THREE.AdditiveBlending, depthTest: true, depthWrite: false});
        super(geometry, material);
        
        this.headerId = headerId;
        this.headerName = "header#" + this.headerId;
        this.position.set(0.2, 0.115, 0.001);
        
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
            transparent: false,
            blending: THREE.NormalBlending,
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
}



export class ProfileItem extends THREE.Group{ 
    
    window: THREE.Mesh;
    photo: ProfileIconUI;

    imagePath: string;
    isFocused: boolean = false;

    infoBtn: ButtonUI;

    constructor(imagePath: string){
        super();

        this.imagePath = imagePath;
        const pBackground = new THREE.PlaneGeometry(1, 0.55, 2,2);
        const mBackground = new THREE.MeshBasicMaterial({
          transparent: true,
          blending: THREE.NormalBlending,
          depthTest: true,
          depthWrite: false,
          map: globalResources.profMap,
          alphaMap: globalResources.profAlpha,
          alphaTest: 0.5,
          opacity: 0.95,
          side: THREE.FrontSide
        });
        this.window = new THREE.Mesh(pBackground, mBackground);
        this.add(this.window)

        this.photo = new ProfileIconUI(this.imagePath);
        this.photo.position.set(-0.2, 0.01 ,0.01)
        this.add(this.photo);

        this.infoBtn = new ButtonUI();
        this.add(this.infoBtn);
        
    }
    
    update(camera: THREE.Camera){
        this.lookAt(camera.position);       // Make the window always face the Camera
    }
}