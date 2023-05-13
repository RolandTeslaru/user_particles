import * as THREE from 'three';

let targetFocus: { interrupt: () => void; };
let mouseDownTimeStamp;

const _changeEvent = {
    type: 'change'
};

class FlyControls extends THREE.EventDispatcher{

    object: any;
    domElement: any;
    movementSpeed: number;
    dragLook: boolean;
    position: THREE.Vector3;
    rotation: THREE.Euler;
    onKeyPress: (event: any) => void;
    controlsState: { up: number; down: number; left: number; right: number; forward: number; back: number; pitchUp: number; pitchDown: number; yawLeft: number; yawRight: number; rollLeft: number; rollRight: number; zoomIn: number; zoomOut: number; zoomTime: number; };
    movementSpeedMultiplier: number = 1;
    lastMousePosition: any;
    mouseStatus: any;
    onMouseMove: (event: any) => void;
    onMouseUp: (event: any) => void;
    onMouseWheel: (event: any) => void;
    autoFocus: boolean;
    tmpQuaternion: THREE.Quaternion;
    update: (delta: any) => void;
    rollSpeed: any;
    moveVector: any;
    rotationVector: any;
    updateMovementVector: () => void;
    updateRotationVector: () => void;
    getContainerDimensions: () => { size: any[]; offset: any[]; };
    dispose: () => void;
    onMouseDown: (event: any) => void;
    onKeyRelease: (event: any) => void;

    constructor (object: any, domElement: any){
        super();

        this.object = object;
        this.domElement = domElement;
        this.movementSpeed = 1.0;
        this.dragLook = false;
        this.autoFocus = false;

        const scope = this;
        const EPS = 0.000001;
		    const lastQuaternion = new THREE.Quaternion();
		    const lastPosition = new THREE.Vector3();
        this.lastMousePosition = new THREE.Vector2();
        this.tmpQuaternion = new THREE.Quaternion();
        this.controlsState = {
            up:0,
            down:0,
            left:0,
            right:0,
            forward:0,
            back:0,
            pitchUp:0,
            pitchDown:0,
            yawLeft:0,
            yawRight:0,
            rollLeft:0,
            rollRight:0,
            zoomIn:0,
            zoomOut:0,
            zoomTime: 1000,
        }
        
        this.position = new THREE.Vector3(0,0,0);
        this.rotation = new THREE.Euler(0,0,0);
        
        this.onKeyPress = (event: any) => {
            if(event.altKey){
                return;
            }

            switch (event.code) {
              case "ShiftLeft":
              case "ShiftRight":
                this.movementSpeedMultiplier = 0.1;
                break;

              case "KeyW":
                this.controlsState.forward = 1;
                break;

              case "KeyS":
                this.controlsState.back = 1;
                break;

              case "KeyA":
                this.controlsState.left = 1;
                break;

              case "KeyD":
                this.controlsState.right = 1;
                break;

              case "KeyR":
                this.controlsState.up = 1;
                break;

              case "KeyF":
                this.controlsState.down = 1;
                break;

              case "ArrowUp":
                this.controlsState.pitchUp = 1;
                break;

              case "ArrowDown":
                this.controlsState.pitchDown = 1;
                break;

              case "ArrowLeft":
                this.controlsState.yawLeft = 1;
                break;

              case "ArrowRight":
                this.controlsState.yawRight = 1;
                break;

              case "KeyQ":
                this.controlsState.rollLeft = 1;
                break;

              case "KeyE":
                this.controlsState.rollRight = 1;
                break;
            }

            this.updateMovementVector();
            this.updateRotationVector();
        };

        this.onKeyRelease = (event) => {
            switch ( event.code ) {

                case 'ShiftLeft':
                case 'ShiftRight':
                    this.movementSpeedMultiplier = 1;
                    break;

                case 'KeyW':
                    this.controlsState.forward = 0;
                    break;

                case 'KeyS':
                    this.controlsState.back = 0;
                    break;

                case 'KeyA':
                    this.controlsState.left = 0;
                    break;

                case 'KeyD':
                    this.controlsState.right = 0;
                    break;

                case 'KeyR':
                    this.controlsState.up = 0;
                    break;

                case 'KeyF':
                    this.controlsState.down = 0;
                    break;

                case 'ArrowUp':
                    this.controlsState.pitchUp = 0;
                    break;

                case 'ArrowDown':
                    this.controlsState.pitchDown = 0;
                    break;

                case 'ArrowLeft':
                    this.controlsState.yawLeft = 0;
                    break;

                case 'ArrowRight':
                    this.controlsState.yawRight = 0;
                    break;

                case 'KeyQ':
                    this.controlsState.rollLeft = 0;
                    break;

                case 'KeyE':
                    this.controlsState.rollRight = 0;
                    break;

            }

            this.updateMovementVector();
            this.updateRotationVector();
        }

        this.onMouseDown = (event) => {
            this.lastMousePosition.set(event.pageX, event.pageY);
            mouseDownTimeStamp = performance.now();
            if(targetFocus)
                targetFocus.interrupt();
            
            if(this.dragLook)
                this.mouseStatus++;
            else {
                switch(event.button){
                    case 0:
                        this.controlsState.forward = 1;
                        break;
                    
                    case 2:
                        this.controlsState.back = 1;
                        break;
                }
                this.updateMovementVector();
            }
        };

        this.onMouseMove = (event) => {
            
            if (!this.dragLook || this.mouseStatus > 0) {

              const container = this.getContainerDimensions();
              const halfWidth = container.size[0] / 2;
              const halfHeight = container.size[1] / 2;
              //this.moveState.yawLeft = - ( event.pageX - container.offset[ 0 ] - halfWidth ) / halfWidth;
              //this.moveState.pitchDown = ( event.pageY - container.offset[ 1 ] - halfHeight ) / halfHeight;
              this.controlsState.yawLeft = (event.pageX - this.lastMousePosition.x) / 5;
              this.controlsState.pitchDown = -(event.pageY - this.lastMousePosition.y) / 5;
              this.updateRotationVector();
              this.lastMousePosition.set(event.pageX, event.pageY);
            }
        }

        this.onMouseUp = (event) => {

            if ( this.dragLook ) {
                this.mouseStatus --;
                this.controlsState.yawLeft = this.controlsState.pitchDown = 0;

            } else {
                switch ( event.button ) {
                    case 0:
                        this.controlsState.forward = 0;
                        break;

                    case 2:
                        this.controlsState.back = 0;
                        break;
                }
                this.updateMovementVector();
            }
            this.updateRotationVector();
        }

        this.onMouseWheel = (event) => {

          event.preventDefault();
          event.stopPropagation();
          if (targetFocus) targetFocus.interrupt();
          this.controlsState.zoomTime = 0;
          if (event.wheelDeltaY > 0) {
            this.controlsState.zoomIn = 1;
            this.controlsState.zoomOut = 0;
          } 
          else {
            this.controlsState.zoomOut = 1;
            this.controlsState.zoomIn = 0;
          }
          this.updateMovementVector();
        };

        this.update = (delta) => {
          delta.clamp(0.001, 1 / 30); // Во избежание рывков движения при спадах фпс.
          scope.controlsState.zoomTime += delta;
          const moveMult = delta * scope.movementSpeed;
          const rotMult = delta * scope.rollSpeed;
          scope.object.translateX(scope.moveVector.x * moveMult);
          scope.object.translateY(scope.moveVector.y * moveMult);
          scope.object.translateZ(scope.moveVector.z * moveMult);
          scope.tmpQuaternion
            .set(
              scope.rotationVector.x * rotMult,
              scope.rotationVector.y * rotMult,
              scope.rotationVector.z * rotMult,
              1
            )
            .normalize();
          scope.object.quaternion.multiply(scope.tmpQuaternion);

          if (
            lastPosition.distanceToSquared(scope.object.position) > EPS ||
            8 * (1 - lastQuaternion.dot(scope.object.quaternion)) > EPS
          ) {
            scope.dispatchEvent(_changeEvent);
            lastQuaternion.copy(scope.object.quaternion);
            lastPosition.copy(scope.object.position);
          }

          if (scope.controlsState.forward || scope.controlsState.back)
            scope.movementSpeed += delta * 3;
          else if (scope.controlsState.zoomOut || scope.controlsState.zoomIn) {
            //console.log('moveState.zoom update');
            scope.movementSpeed = Math.max(scope.movementSpeed, 4);
            scope.movementSpeed += delta * 3;
            scope.controlsState.zoomIn *= 0.75;
            scope.controlsState.zoomOut *= 0.75;
            if (scope.controlsState.zoomTime > 1) {
              scope.controlsState.zoomIn = 0;
              scope.controlsState.zoomOut = 0;
              scope.moveVector.set(0, 0, 0);
            }
          } else scope.movementSpeed = 2;
        };
        

        this.updateMovementVector = () => {

            const forward = ((this.controlsState.forward || this.controlsState.zoomIn) && !(this.controlsState.back || this.controlsState.zoomOut)) ? 1 : 0;
            this.moveVector.x = - this.controlsState.left + this.controlsState.right;
            this.moveVector.y = - this.controlsState.down + this.controlsState.up;
            this.moveVector.z = - forward + Math.max(this.controlsState.back, this.controlsState.zoomOut); //console.log( 'move:', [ this.moveVector.x, this.moveVector.y, this.moveVector.z ] );
            //this.moveState.zoomForward = 0;
            //this.moveState.zoomBack = 0;

        }

        this.updateRotationVector = () => {
            this.rotationVector.x = - this.controlsState.pitchDown + this.controlsState.pitchUp;
            this.rotationVector.y = - this.controlsState.yawRight + this.controlsState.yawLeft;
            this.rotationVector.z = - this.controlsState.rollRight + this.controlsState.rollLeft;
        };

        this.getContainerDimensions = () => {
            if ( this.domElement != document ) {

                return {
                    size: [ this.domElement.offsetWidth, this.domElement.offsetHeight ],
                    offset: [ this.domElement.offsetLeft, this.domElement.offsetTop ]
                };

            } else {

                return {
                    size: [ window.innerWidth, window.innerHeight ],
                    offset: [ 0, 0 ]
                };

            }
        };

        const _mousemove = this.onMouseMove.bind(this);

        const _mousedown = this.onMouseDown.bind(this);
        const _mouseup = this.onMouseUp.bind(this);

        const _mousewheel = this.onMouseWheel.bind(this);

        const _keydown = this.onKeyPress.bind(this);
        const _keyup = this.onKeyRelease.bind(this);

        this.dispose = () => {
          this.domElement.removeEventListener("contextmenu", contextMenu);
          this.domElement.removeEventListener("mousedown", _mousedown);
          this.domElement.removeEventListener("mousemove", _mousemove);
          this.domElement.removeEventListener("mouseup", _mouseup);
          this.domElement.removeEventListener("wheel", _mousewheel, false);
          window.removeEventListener("keydown", _keydown);
          window.removeEventListener("keyup", _keyup);
        };
    }

    
}
function contextMenu ( event:any ) {

    event.preventDefault();

}