import * as THREE from "three"
import { globalResources } from "./GlobalResources";
import { getChild3DByName, interactButtons, interactProfiles, pointPositions, renderTime, setSameAttrib, updateMaterials, usersAlgorithm } from "./Utils";
import { BtnFaceFS, BtnGlitchTextFS, BtnLightFS, BtnTextFS, glitchButtonFS, glitchProfileFS, glitchProfilePFS, hexProfileFS, novaBase2VS, novaBaseVS } from "./shaders";
import { clear3DChilds, makeRenderTarget, renderTimeSeconds } from "./scene";


const loader = new THREE.TextureLoader();

export class ProfileWindow {
    id: any;
    profileID: any;
    itemID: number = -1;
    openTime: number;
    heavyUpdateNeed: boolean;
    isProfile: boolean;
    heavyFlags: any[];
    disposeList: any[];
    rig: any;
    rtText: any;
    rtHead: any;
    rtButton: any;
    panel: any;
    photo: any;
    button: any;
    text: any;
    head: any; 
    btnTextMtl!:  THREE.ShaderMaterial;
    photoMaterial!:  THREE.ShaderMaterial | THREE.MeshBasicMaterial | null; 
    item: any;
    constructor(id: any, profileID: any){
        this.id = id;
        this.profileID = profileID;
        this.itemID -1;
        this.openTime = 0;
        this.heavyUpdateNeed = false;
        this.isProfile = true;
        this.heavyFlags = [];
        this.disposeList = [];
        this.rig = new THREE.Object3D();
        this.rtText = null;
        this.rtHead = null;
        this.rtButton = null;
        
    }

    visual(vid:any){
        if (globalResources.profiles[vid]) {
			this.panel = globalResources.profiles[vid].clone(true);
			this.rig.add(this.panel);
			this.photo = getChild3DByName(this.panel, 'photo'); 
			this.photo.material = new THREE.MeshBasicMaterial({color: 0xffffff, transparent: false, blending: THREE.NormalBlending, depthTest: true, depthWrite: true});
			this.button = getChild3DByName(this.panel, 'button'); 

			interactButtons.push(this.button);

			this.button.name = 'button#' + this.id;
			this.text = getChild3DByName(this.panel, 'text');
			this.text.material = new THREE.MeshBasicMaterial({color: 0xffff00, transparent: true, blending: THREE.AdditiveBlending, depthTest: true, depthWrite: false});
			this.head = getChild3DByName(this.panel, 'header');
			this.head.material = new THREE.MeshBasicMaterial({color: 0xffff00, transparent: true, blending: THREE.AdditiveBlending, depthTest: true, depthWrite: false});
			this.rig.visible = true
            
			setSameAttrib(this.panel, 'openTime', renderTimeSeconds, true);
			setSameAttrib(this.panel, 'hoverTime', 0, true);
			setSameAttrib(this.panel, 'clickTime', 0, true);
		} else {
			console.log('incorrect profile id! :' + vid);
			this.visual(0);
		}
    }
    buttonLight(version:any, bx?:any, by?:any) { // Collects a button of one of two (currently two) types. bx, by - what coordinates to place this button.
		switch(version) {
			case 0: {
				{ // base button geometry
					let btngeom = new THREE.PlaneGeometry(0.28, 0.07, 2, 2);
					this.disposeList.push(btngeom);
					if (!globalResources.btnFaceMtl) {
						globalResources.btnFaceMtl = new THREE.ShaderMaterial({
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
						updateMaterials.push(globalResources.btnFaceMtl);
						globalResources.btnFaceMtl.uniformsNeedUpdate = true;
					}
					this.button = new THREE.Mesh(btngeom, globalResources.btnFaceMtl);
					this.button.position.set(bx, by, 0.001);
					this.panel.add(this.button);	
				}
			
				{ // button text
					let btngeom = new THREE.PlaneGeometry(0.30, 0.14, 2, 2);
					let _this = this;
					this.disposeList.push(btngeom);
					this.btnTextMtl = new THREE.ShaderMaterial({
						blending: THREE.AdditiveBlending, 
						vertexShader: novaBaseVS,
						fragmentShader: BtnTextFS,
						uniforms: {
							renderTime: {value: 0},
							alphaMap: {value: null},
							btnColor: {value: new THREE.Color(0.01, 0.914, 0.957)}
						},
						side: THREE.FrontSide,
						depthTest: true, 	// Для корректной работы depthTest в ShaderMaterial, требуется выключать logarithmicDepthBuffer в рендере. 
											// Если понадобится его все же включить, то перенести шейдерный код из моего рендера планеты Земля. 
						depthWrite: false,
						transparent: true,
						precision: "highp", 
						dithering: true,
						alphaTest: 0.5,
						name: 'btntext' + _this.id
					});
					updateMaterials.push(this.btnTextMtl);
					this.disposeList.push(this.btnTextMtl);
					this.btnTextMtl.uniformsNeedUpdate = true;
					this.rtText = new THREE.Mesh(btngeom, this.btnTextMtl);
					this.rtText.name = 'ignore';
					this.rtText.position.set(0, -0.01, 0.001);
					this.button.add(this.rtText);	
				}
				/**
			
				*/
			} break;
			case 1: {
				{ // base button geometry
					let btngeom = new THREE.PlaneGeometry(0.30, 0.09, 2, 2);
					this.disposeList.push(btngeom);
					if (!globalResources.btnFaceMtl) {
						globalResources.btnFaceMtl = new THREE.ShaderMaterial({
							//blending: THREE.AdditiveBlending, 
							vertexShader: novaBaseVS,
							fragmentShader: glitchButtonFS,
							uniforms: {
								renderTime: {value: 0},
								mainMap: {value: globalResources.btFace2}
							},
							side: THREE.FrontSide,
							depthTest: true, /** Для корректной работы depthTest в ShaderMaterial, требуется выключать logarithmicDepthBuffer в рендере. 
								Если понадобится его все же включить, то перенести шейдерный код из моего рендера планеты Земля. */
							depthWrite: false,
							blending: THREE.AdditiveBlending, 
							transparent: true,
							precision: "highp", 
							dithering: true
						});
						updateMaterials.push(globalResources.btnFaceMtl2);
						globalResources.btnFaceMtl2.uniformsNeedUpdate = true;
					}
					this.button = new THREE.Mesh(btngeom, globalResources.btnFaceMtl2);
					this.button.position.set(bx, by, 0.001);
					this.panel.add(this.button);	
				}
				{ // button text
					let btngeom = new THREE.PlaneGeometry(0.30, 0.14, 2, 2);
					let _this = this;
					this.disposeList.push(btngeom);
					this.btnTextMtl = new THREE.ShaderMaterial({
						blending: THREE.NormalBlending, 
						vertexShader: novaBaseVS,
						fragmentShader: BtnGlitchTextFS,
						uniforms: {
							renderTime: {value: 0},
							alphaMap: {value: null},
							btnColor: {value: new THREE.Color(0.01, 0.914, 0.957)}
						},
						side: THREE.FrontSide,
						depthTest: true, /** Для корректной работы depthTest в ShaderMaterial, требуется выключать logarithmicDepthBuffer в рендере. 
							Если понадобится его все же включить, то перенести шейдерный код из моего рендера планеты Земля. */
						depthWrite: true,
						transparent: true,
						precision: "highp", 
						dithering: true,
						alphaTest: 0.5,
						name: 'btntext' + _this.id
					});
					updateMaterials.push(this.btnTextMtl);
					this.disposeList.push(this.btnTextMtl);
					this.btnTextMtl.uniformsNeedUpdate = true;
					this.rtText = new THREE.Mesh(btngeom, this.btnTextMtl);
					this.rtText.name = 'ignore';
					this.rtText.position.set(0, -0.01, 0.003);
					this.button.add(this.rtText);	
				}
				{ // button light
					let btngeom = new THREE.PlaneGeometry(0.9, 0.4, 2, 2);
					this.disposeList.push(btngeom);
                    let btLight = new THREE.Mesh(btngeom, globalResources.btnLightMtl);
                    btLight.name = 'ignore';
                    btLight.position.set(0.0, 0.0, 0.001);
                    this.button.add(btLight);				
					if (!globalResources.btnLightMtl) {
						globalResources.btnLightMtl = new THREE.ShaderMaterial({
							blending: THREE.AdditiveBlending, 
							vertexShader: novaBaseVS,
							fragmentShader: BtnLightFS,
							uniforms: {
								renderTime: {value: 0},
								btnColor: {value: new THREE.Color(0.01, 0.914, 0.957)}
							},
							side: THREE.FrontSide,
							depthTest: true, /** Для корректной работы depthTest в ShaderMaterial, требуется выключать logarithmicDepthBuffer в рендере. 
								Если понадобится его все же включить, то перенести шейдерный код из моего рендера планеты Земля. */
							depthWrite: false,
							transparent: true,
							precision: "highp", 
							dithering: true,
						});
						updateMaterials.push(globalResources.btnLightMtl);
						globalResources.btnLightMtl.uniformsNeedUpdate = true;
					}
				}				
			} break;
			default: {
				console.log('incorrect button type: ' + version);
				this.buttonLight(0);
			}
		}
		interactButtons.push(this.button);
		this.button.name = 'button#' + this.id;
	}
    newVisual(vid:any) {
		let _this = this;
		switch(vid) {
			case 0: {// #0
				// main plane
				let geom = new THREE.PlaneGeometry(1, 0.55, 2, 2);
				this.disposeList.push(geom);
				let mtl = new THREE.MeshBasicMaterial({
					transparent: true, 
					blending: THREE.NormalBlending, 
					depthTest: true, 
					depthWrite: false, 
					map: globalResources.profMap, 
					alphaMap: globalResources.profAlpha, 
					alphaTest: 0.5,
					opacity: 0.95
				});
				this.disposeList.push(mtl);
				this.panel = new THREE.Mesh(geom, mtl);
				// button
				this.buttonLight(0, 0.21, -0.09);
				// alls
				this.addStandartElements();
				//PHOTO!!!
				if (this.photoMaterial) {
					this.photoMaterial.dispose();
					this.photoMaterial = null;
				}
				this.photoMaterial = new THREE.ShaderMaterial({
					blending: ((_this.id % 0) ? THREE.NormalBlending : THREE.AdditiveBlending),  
					vertexShader: novaBaseVS,
					fragmentShader: glitchProfilePFS,
					uniforms: {
						renderTime: {value: 0},
						mainMap: {value: null}
					},
					side: THREE.FrontSide,
					depthTest: true, /** Для корректной работы depthTest в ShaderMaterial, требуется выключать logarithmicDepthBuffer в рендере. 
						Если понадобится его все же включить, то перенести шейдерный код из моего рендера планеты Земля. */
					depthWrite: true,
					transparent: false,
					precision: "highp", 
					dithering: true,
				});
				updateMaterials.push(this.photoMaterial);
				this.disposeList.push(this.photoMaterial);
				this.photoMaterial.uniformsNeedUpdate = true;
				this.photo.material = this.photoMaterial;
			} break;
			case 1: {// #1
				// main plane
				let geom = new THREE.PlaneGeometry(1, 0.55, 2, 2);
				this.disposeList.push(geom);
				if (!globalResources.hexProfileMtl) {
					globalResources.hexProfileMtl = new THREE.ShaderMaterial({
						vertexShader: novaBaseVS,
						fragmentShader: hexProfileFS,
						uniforms: {
							renderTime: {value: 0},
							maskMap: {value: globalResources.profMask},
							hexMap: {value: globalResources.hexMap},
						},
						side: THREE.FrontSide,
						depthTest: true, 
						depthWrite: false,
						blending: THREE.NormalBlending, 
						transparent: true,
						precision: "highp", 
						dithering: true
					});
					updateMaterials.push(globalResources.hexProfileMtl);
				}
				globalResources.hexProfileMtl.uniformsNeedUpdate = true;
				this.panel = new THREE.Mesh(geom, globalResources.hexProfileMtl);
				// button
				this.buttonLight(0, 0.21, -0.06);
				// alls
				this.addStandartElements();
				//globalResources.profiles.push(this.panel);
			} break;
			case 2: {// #2
				// main plane
				let geom = new THREE.PlaneGeometry(1, 0.55, 2, 2);
				this.disposeList.push(geom);
				if (!globalResources.hexProfileMtl) {
					globalResources.hexProfileMtl = new THREE.ShaderMaterial({
						vertexShader: novaBase2VS,
						fragmentShader: hexProfileFS,
						uniforms: {
							renderTime: {value: 0},
							maskMap: {value: globalResources.profMask},
							hexMap: {value: globalResources.hexMap},
						},
						side: THREE.FrontSide,
						depthTest: true, 
						depthWrite: false,
						blending: THREE.NormalBlending, 
						transparent: true,
						precision: "highp", 
						dithering: true
					});
					updateMaterials.push(globalResources.hexProfileMtl);
				}
				globalResources.hexProfileMtl.uniformsNeedUpdate = true;
				this.panel = new THREE.Mesh(geom, globalResources.hexProfileMtl);
				// button
				this.buttonLight(1, 0.21, -0.06);
				// alls
				this.addStandartElements();
			} break;
			case 3: {// #3
				// main plane
				let geom = new THREE.PlaneGeometry(0.8, 0.36, 2, 2);
				this.disposeList.push(geom);
				if (!globalResources.cityProfileMtl) {
					globalResources.cityProfileMtl = new THREE.ShaderMaterial({
						vertexShader: novaBase2VS,
						fragmentShader: glitchProfileFS,
						uniforms: {
							renderTime: {value: 0},
							mainMap: {value: globalResources.cityMap}
						},
						side: THREE.FrontSide,
						depthTest: true, 
						depthWrite: false,
						blending: THREE.NormalBlending, 
						transparent: true,
						precision: "highp", 
						dithering: true
					});
					updateMaterials.push(globalResources.cityProfileMtl);
				}
				globalResources.cityProfileMtl.uniformsNeedUpdate = true;
				this.panel = new THREE.Mesh(geom, globalResources.cityProfileMtl);
				// button
				this.buttonLight(1, 0.21, -0.06);
				// alls
				this.addStandartElements();

			} break;
			default: {
				console.log('incorrect profile id! :' + vid);
				this.newVisual(0);
			}
		}
			this.rig.add(this.panel);
			interactProfiles.push(this.panel);
			this.panel.name = 'panel#' + this.id;
		//	interactButtons.push(this.button);
		//	this.button.name = 'button#' + this.id;
			this.rig.visible = true;
			setSameAttrib(this.panel, 'openTime', renderTimeSeconds, true);
			setSameAttrib(this.button, 'hoverTime', 0, true);
			setSameAttrib(this.button, 'clickTime', 0, true);
			setSameAttrib(this.panel, 'profClickTime', 0, true);
			setSameAttrib(this.panel, 'profHoverTime', 0, true);
	}
    addStandartElements() { // Генерирует стандартные элементы профайлов.
		// photo
		let pgeom = new THREE.PlaneGeometry(0.21, 0.21, 2, 2);
		this.photoMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: false,
      blending: THREE.NormalBlending,
      depthTest: true,
      depthWrite: true,
      alphaMap: globalResources.photoAlpha,
    });
		this.disposeList.push(pgeom);
		this.disposeList.push(this.photoMaterial);
		this.photo = new THREE.Mesh(pgeom, this.photoMaterial);
		this.photo.name = 'photo#' + this.id;
		this.photo.position.set(-0.24, 0.02, 0.001);
		this.panel.add(this.photo);
		// header
		let hgeom = new THREE.PlaneGeometry(0.25, 0.16, 2, 2);
		let hmtl = new THREE.MeshBasicMaterial({color: 0xffff00, transparent: true, blending: THREE.AdditiveBlending, depthTest: true, depthWrite: false});
		this.disposeList.push(hgeom);
		this.disposeList.push(hmtl);
		this.head = new THREE.Mesh(hgeom, hmtl);
		this.head.name = 'header#' + this.id;
		this.head.position.set(0.2, 0.115, 0.001);
		this.panel.add(this.head);
		// text
		let tgeom = new THREE.PlaneGeometry(0.25, 0.25, 2, 2);
		let tmtl = new THREE.MeshBasicMaterial({color: 0xffff00, transparent: true, blending: THREE.AdditiveBlending, depthTest: true, depthWrite: false});
		this.disposeList.push(tgeom);
		this.disposeList.push(tmtl);
		this.text = new THREE.Mesh(tgeom, tmtl);
		this.text.name = 'text#' + this.id;
		this.text.position.set(0.01, 0.01, 0.001);
		this.panel.add(this.text);
	}
    sync(item:any) { // синхронизация с точкой (item)
		//console.log('Profile['+this.id+']:sync');
		this.heavyFlags[0] = true;
		this.itemID = item.id;
		item.onSync(true);
		item.profileObjectID = this.id;
		this.item = item;
		this.rig.position.copy(pointPositions[item.id]);
		this.newVisual(0); // item.profile_type
		this.openTime = renderTime;
		this.photo.visible = false; // Выключаем фотку до ее обновления
		this.text.visible = false; 
		this.head.visible = false; 
		for (let i = 0; i < 4; i++) this.heavyFlags[i] = true;
		this.heavyUpdateNeed = true;
	}
	heavySync() { // Тяжелые действия, выполняемые после синхронизации. Для их запуска система проверяет, допустимо ли запускать их сейчас (позволяет ли время фрейма)
		let item = this.item;
		//console.log('Profile['+this.id+']:heavySync');
		if (!item) {
			this.heavyUpdateNeed = false;
			return;
		}
		if (this.heavyFlags[0]) { // Обновить текстуру фото
			let photoLink;
			if (usersAlgorithm == 2) photoLink = item.image;
			else photoLink = item.photo;
			if (this.photoMaterial instanceof THREE.ShaderMaterial) {
                (this.photoMaterial as THREE.ShaderMaterial).uniforms.mainMap.value = loader.load(photoLink);
                (this.photoMaterial as THREE.ShaderMaterial).uniformsNeedUpdate = true;
              } else if(this.photoMaterial){
                // Handle the case when this.photoMaterial is not a ShaderMaterial
                // For example, if it's a MeshBasicMaterial
                this.photoMaterial.map = loader.load(photoLink);
                this.photoMaterial.needsUpdate = true;
                this.disposeList.push(this.photoMaterial.map);
              }
              
			this.photo.visible = true;
			this.heavyFlags[0] = false;
			return;
		}
		if (this.heavyFlags[1] && globalResources.Gfont) { // Обновить текст заголовка
				let textList = [];
				let textColorAlpha = new THREE.Color(1,1,1);
				textList.push({text: item.name, h: 150, x: 0, y: -60, align: 'c'});
				this.rtHead = makeRenderTarget(new THREE.Color(0,0,0), textColorAlpha, textList, 2048, 2048);
				this.head.material.alphaMap = this.rtHead.texture;
				this.head.material.needsUpdate = true;
				this.head.visible = true;
				this.heavyFlags[1] = false;
				this.disposeList.push(this.rtHead);
			return;
		}
		if (this.heavyFlags[2] && globalResources.Gfont) { // Обновить тексты
				let textList = [];
				let textColorAlpha = new THREE.Color(1,1,1);
				textList.push({text: item.title, h: 75, x: -500, y: 150, align: 'l'});
				//
				if (usersAlgorithm == 2) textList.push({text: 'Gender : ' + (item.gender == 1 ? 'Male' : item.gender == 2 ? 'Female' : item.gender == 3 ? 'Non binary' : '-'), h: 75, x: -500, y: 0, align: 'l'});
				else textList.push({text: item.gender, h: 75, x: -500, y: 0, align: 'l'});
				//
				if (usersAlgorithm == 2) textList.push({text: 'Age : ' + item.year, h: 75, x: -500, y: -150, align: 'l'});
				else textList.push({text: item.age, h: 75, x: -500, y: -150, align: 'l'});
				//
				if (usersAlgorithm == 2) textList.push({text: 'Height : ' + item.height, h: 75, x: -500, y: -300, align: 'l'});
				else textList.push({text: item.height, h: 75, x: -500, y: -300, align: 'l'});
				//
				this.rtText = makeRenderTarget(new THREE.Color(0,0,0), textColorAlpha, textList, 2048, 1024);
				this.text.material.alphaMap = this.rtText.texture;
				this.text.material.needsUpdate = true;
				this.text.visible = true;
				this.heavyFlags[2] = false;
				this.disposeList.push(this.rtText);
			return;
		}
		if (this.heavyFlags[3] && globalResources.Gfont) { // Обновить текст на кнопку
				let textList = [];
				let textColorAlpha = new THREE.Color(1,1,1);
				if (usersAlgorithm == 2) textList.push({text: 'info', h: 200, x: 0, y: 0.02, align: 'c'});
				else textList.push({text: item.buttonText, h: 200, x: 0, y: 0.02, align: 'c'});
				this.rtButton = makeRenderTarget(new THREE.Color(0,0,0), textColorAlpha, textList, 2048, 1024);
				if (this.btnTextMtl.uniforms instanceof THREE.MeshBasicMaterial) {
					this.btnTextMtl.uniforms.alphaMap.value = this.rtButton.texture;
					this.btnTextMtl.uniformsNeedUpdate = true;
				} else {
					this.btnTextMtl.alphaMap = this.rtButton.texture;
					this.btnTextMtl.needsUpdate = true;
				}
				this.rtText.visible = true;
				this.heavyFlags[3] = false;
				this.disposeList.push(this.rtButton);
		}
		this.heavyUpdateNeed = false;
	}
	desync() { // де-синхронизация - прекращение связи профайла с его точкой. После этого профайл переходит в неактивное состояние ожидания, неактивные профайлы невидимы.
		// Здесь также происходит очистка памяти от всех ненужных ресурсов.
		if (this.itemID > -1) {
			console.log('Close profile ' + this.itemID);
			let item = this.item;
			if (item) item.onSync(false);
			this.itemID = -1;
			this.item = null;
			this.rig.visible = false;
			this.heavyUpdateNeed = false;
			clear3DChilds(this.rig);
			let btnIndex = -1;
			for (let i = 0; i < updateMaterials.length; i++) if (updateMaterials[i] && updateMaterials[i].name == ('btntext' + this.id)) { btnIndex = i; break; }
			if (btnIndex > -1) updateMaterials.splice(btnIndex, 1);
			for (let i = 0; i < this.disposeList.length; i++) if (this.disposeList[i] && this.disposeList[i].dispose) this.disposeList[i].dispose();
			this.head = null;
			this.text = null;
			this.button = null;
			this.photo = null;
			this.panel = null;
			this.rtHead = null;
			this.rtText = null;
			this.rtButton = null;
			btnIndex = -1;
			for (let i = 0; i < interactButtons.length; i++) if (interactButtons[i] && interactButtons[i].name == ('button#' + this.id)) { btnIndex = i; break; }
			if (btnIndex > -1) interactButtons.splice(btnIndex, 1);
			btnIndex = -1;
			for (let i = 0; i < interactProfiles.length; i++) if (interactProfiles[i] && interactProfiles[i].name == ('panel#' + this.id)) { btnIndex = i; break; }
			if (btnIndex > -1) interactProfiles.splice(btnIndex, 1);
		}
	}
}


