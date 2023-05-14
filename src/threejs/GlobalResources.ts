import * as THREE from "three";

var maxEnabledAnisotropy = 1; 			// Переменные рендера

interface IProfiles extends Object{
	clone(arg0: boolean): any;

}

interface IGlobalResources {
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
    btnFaceMtl: undefined
}

const loader = new THREE.TextureLoader();

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

let bordmap                         = loader.load( 'img/galaxy/pins.png' );

bordmap.anisotropy = maxEnabledAnisotropy;
bordmap.wrapS = THREE.RepeatWrapping;
bordmap.wrapT = THREE.RepeatWrapping;
globalResources.bordmap = bordmap;
globalResources.bordmap.repeat.set( 8, 8);
