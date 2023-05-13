import * as THREE from "three";

export var fractalClouds:any[] = []; 		    // Облака точек и облаков. + Их надо будет проверять на райкаст, причем "не совсем рекурсивно".
export var pointItems:any[] = []; 			// Точки 														/??? Переделать?
export var profileItems:any[] = [];			// Открытые профайлы (А так же профайлы в состоянии ожидания, т.е. невидимые)
export var baseVertices:any[] = [];			// Базовые координаты											/??? Переделать? // Здесь это массив float в размере числа точек * 3, для загрузки в атрибут массива точек.
export var pointIndexes:any[] = []; 			// Индексы точек (Используются для связи шейдера с id точки) 	/??? Переделать?
export var pointPositions:any[] = [];		    // Координаты точек 											/??? Переделать? // Здесь это массив из THREE.Vector3, в размере массива точек.
export var verticeColors:any[] = []; 		    // Цвета точек  												/??? Переделать? // Здесь это массив float в размере числа точек * 3, для загрузки в атрибут массива точек.
export var interactButtons:any[] = [];		// Интерактивные кнопки
export var interactProfiles:any[] = []; 		// Интерактивные профайлы
export var interactClouds:any[] = []; 		// Интерактивные панели облаков
export var selectedCloud = null;
export var discRadius = 100;
export var sphereRadius = discRadius / 5;
export var discDepth = sphereRadius / 5;
export var sphereDepth = discDepth / 500;
export var pointsLoopIndex = 0; 		// Текущий индекс апдейта точек.
export var targetFocus = null;
export var currentFractalLevel = 0;
export var currentFractalID = 0;
export var nearCloudDistance = 0;
export var nearCloudID = -1;
export var nearCloudIDTemp = -1;
export var maximalCloudDistance = 0;

export var updateMaterials: any[] = [];

export var maxEnabledAnisotropy = 1; 			// Переменные рендера
export var renderActive = false;				// Статус активности рендера
export var renderInitialized = false;			// Готов ли рендер к работе
export var contentLoaded = false;				// Загружено ли все необходимое
export var useGlobalAxisRotations = true;
export var visibleRegionHeaders = true;
export var camCurrentSpeed = 0;				// Скорость движения камеры в данный момент
export var renderTime = 0;						// Время рендера в миллисекундах
export var renderTimeSeconds = 0;				// Время рендера в секундах
export var FRAME_ID = 0;						// Номер фрейма
export var FRAME_TIMESTAMP = 0;				// Метка времени, Когда стартовал текущий фрейм
export var lastMouseFrame = 0;					// Фрейм на котором последний раз выполнялась обработка курсора мыши. (Если браузер не отсылает события движения мыши, они генерируются все равно)
export var mouseDownTimestamp:any;					// Метка времени, Когда кнопка мыши была нажата
export var last_delta = 0;						// Время прошлого фрейма
export var time_fps_perform = 0;				// Обработка FPS
export var fps_perform = 0;
export var STOP_RENDER = false;				// Флаг остановки рендера (может использоваться для отладки)
export var statControls = [];					// Статистика
export var camRVLength = 0;


export var usersAlgorithm = 2;

export function getChild3DByName(
  obj3d: { children: string | any[] },
  targetName?: string,
  b_Recursion?: undefined
): any {
  // Search among attached 3D objects for an element with the specified name. bool b_Recursion - whether to perform the search recursively.
  for (let i = 0; i < obj3d.children.length; i++) {
    let child = obj3d.children[i];
    if (child) {
      if (child.name == targetName) return child;
      if (b_Recursion) {
        let R = getChild3DByName(child, targetName, b_Recursion);
        if (R) return R;
      }
    }
  }
  return; // no value
}

export function setSameAttrib(meshGeom:any, attrName:any, attrValue:any, b_toChild:any) { // Установить для геометрии, или модели, атрибут attrName в значение attrValue. b_toChild - распространять ли присвоение на потомков.
	if (!meshGeom) return;
	let geom;
	if (meshGeom.isMesh) {
		geom = meshGeom.geometry;
		if (b_toChild) for (let i = 0; i < meshGeom.children.length; i++) setSameAttrib(meshGeom.children[i], attrName, attrValue, b_toChild);
	} else if (meshGeom.isBufferGeometry) geom = meshGeom;
	else if (meshGeom.isGroup && b_toChild) for (let i = 0; i < meshGeom.children.length; i++) setSameAttrib(meshGeom.children[i], attrName, attrValue, b_toChild); 
	else return;
	if (!geom) return;
	let size = geom.attributes.position.count;
	let tarr = new Float32Array(size).fill(attrValue);
	geom.setAttribute( attrName, new THREE.BufferAttribute( tarr, 1 ) );
}

