import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";


export class CustomControls extends OrbitControls {

    isLocked: boolean = false;

    constructor(camera: THREE.Camera, domElement: HTMLElement){
        super(camera, domElement);

        window.addEventListener("scroll", this.onScroll)
    }

    onScroll(event: any){
        console.log("Scrolling")
        if(this.isLocked)
        {
            this.isLocked = false; 
            this.enabled = true;
        }
    }

    lock(){
        this.isLocked = true;
        this.enabled = false;
    }
}