import { Font } from "next/dist/compiled/@vercel/og/satori";
import * as THREE from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader";
import { BtnFaceFS, BtnGlitchTextFS, BtnLightFS, glitchButtonFS, novaBaseVS } from "./shaders";

var maxEnabledAnisotropy = 1; 			// Переменные рендера

interface IProfiles extends Object{
	clone(arg0: boolean): any;

}

interface IGlobalResources {
    buttonMesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
    buttonGeometry: THREE.PlaneGeometry;
    profileWindowMesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
    profileWindowGeometry: THREE.PlaneGeometry;
    buttonMaterial: THREE.ShaderMaterial;
    profileWindowMaterial: THREE.MeshBasicMaterial;
    textFont: any;
    Gfont: any;
    cityProfileMtl: any;
    hexMap: any;
    hexProfileMtl: any;
    bordmap: THREE.Texture;
    btnLightMtl: any;
    btnFaceMtl2: any;
    btnFaceMtl: any;
    profiles: IProfiles[];
    pointPic?: THREE.Texture;
    profMap?: THREE.Texture;
    profMap2?: THREE.Texture;
    profAlpha?: THREE.Texture;
    profBeta?: THREE.Texture;
    bordMask?: THREE.Texture;
    profMask?: THREE.Texture;
    btnMap?: THREE.Texture;
    btnMap2?: THREE.Texture;
    photoAlpha?: THREE.Texture;
    bpMap?: THREE.Texture;
    btFaceAlpha?: THREE.Texture;
    btFace2?: THREE.Texture;
    cityMap?: THREE.Texture;
}

export var globalResources:IGlobalResources = {
    profiles: [],
    Gfont: undefined,
    cityProfileMtl: undefined,
    hexMap: undefined,
    hexProfileMtl: undefined,
    bordmap: new THREE.Texture,
    btnLightMtl: undefined,
    btnFaceMtl2: undefined,
    btnFaceMtl: undefined,
    textFont: undefined,
    buttonMesh: new THREE.Mesh,
    buttonGeometry: new THREE.PlaneGeometry,
    profileWindowMesh: new THREE.Mesh,
    profileWindowGeometry: new THREE.PlaneGeometry,
    buttonMaterial: new THREE.ShaderMaterial,
    profileWindowMaterial: new THREE.MeshBasicMaterial
}

const loader = new THREE.TextureLoader();
const fontLoader = new FontLoader();

globalResources.pointPic 		    = loader.load( 'img/galaxy/point.png' ); 		// Текстура для точек
globalResources.pointPic 		    = loader.load( 'img/galaxy/point.png' ); 		// Текстура для точек
globalResources.profMap 			= loader.load( 'img/galaxy/canstockphoto94045006.jpg' ); 			// Текстуры для профайла
globalResources.profMap2 		    = loader.load( 'img/galaxy/green.png' );
globalResources.profAlpha 		    = loader.load( 'img/galaxy/cmask.jpg' );  // ( 'img/galaxy/cmask.jpg', 'img/galaxy/cmaskX.jpg' );
globalResources.profBeta 		    = loader.load( 'img/galaxy/testB.png' );
globalResources.bordMask 		    = loader.load( 'img/galaxy/mask.png' );
globalResources.profMask 		    = loader.load( 'img/galaxy/pmaskX.jpg' ); // ( 'img/galaxy/pmask.png' );
globalResources.btnMap 			    = loader.load( 'img/galaxy/btn1.png' );
globalResources.btnMap2 			= loader.load( 'img/galaxy/btn2.png' );
globalResources.photoAlpha 		    = loader.load( 'img/galaxy/disc.jpg' );
globalResources.bpMap 			    = loader.load( 'img/galaxy/borderplus.png' );
globalResources.btFaceAlpha 		= loader.load( 'img/galaxy/btfacealpha.png' );
globalResources.btFace2 			= loader.load( 'img/galaxy/btface2.png' );
globalResources.cityMap 			= loader.load( 'img/galaxy/city.jpg' );

globalResources.Gfont               = fontLoader.parse( 'fonts/Arial_Regular.json');
globalResources.profileWindowMaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    blending: THREE.NormalBlending,
    depthTest: true,
    depthWrite: false,
    map: globalResources.profMap,
    alphaMap: globalResources.profAlpha,
    alphaTest: 0,
    opacity: 1,
    side: THREE.FrontSide,
  });
globalResources.profileWindowGeometry = new THREE.PlaneGeometry(1, 0.55, 2, 2);
globalResources.profileWindowMesh = new THREE.Mesh(globalResources.profileWindowGeometry, globalResources.profileWindowMaterial);
globalResources.buttonMaterial = new THREE.ShaderMaterial({
    //blending: THREE.AdditiveBlending, 
    vertexShader: novaBaseVS,
    fragmentShader: BtnFaceFS,
    uniforms: {
        renderTime: {value: 0},
        mainMap: {value: globalResources.btFaceAlpha}
    },
    side: THREE.FrontSide,
    depthTest: true, 	// Для корректной работы depthTest в ShaderMaterial, требуется выключать logarithmicDepthBuffer в рендере. 
                        // Если понадобится его все же включить, то перенести шейдерный код из моего рендера планеты Земля. 
    depthWrite: true,
    blending: THREE.NormalBlending, // Для фейса кнопки наверное так.
    transparent: true,
    precision: "highp", 
    dithering: true,
    alphaTest: 0.5,
});
globalResources.buttonGeometry = new THREE.PlaneGeometry(0.9, 0.4, 2, 2);
globalResources.buttonMesh = new THREE.Mesh(globalResources.buttonGeometry, globalResources.buttonMaterial);

export let bordmap                  = loader.load( 'img/galaxy/pins.png' );
export let MOBILE_MODE = false;    
export const PROFILE_ANIMATE_TIME = 1000; 	

bordmap.anisotropy = maxEnabledAnisotropy;
bordmap.wrapS = THREE.RepeatWrapping;
bordmap.wrapT = THREE.RepeatWrapping;
globalResources.bordmap = bordmap;
globalResources.bordmap.repeat.set( 8, 8);
