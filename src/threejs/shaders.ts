import * as THREE from "three";

export const centerDefine = `
#define CENTER vec2(0.5, 0.5)
`;
export const piDefine = `
#define M_PI 3.1415926535897932384626433832795
`;
export const sphereGradient = `
float spAlpha(vec2 pos, float grMin, float grMax, float grScale) {
	float raDist = distance(CENTER, pos);
	float raStrong = (raDist - grMin) / (grMax - grMin);
	return 1.0 - clamp(raStrong, 0.0, 1.0);
}
`;
// Шейдер точек
export const pointItemVS = `
${centerDefine}
attribute vec3 pcolor;
attribute float pindex;
uniform float renderTime;
uniform float driftDist;
uniform float psize;
uniform float rayScale;
uniform float openDist;
varying vec3 ppcolor;
varying float distToCamera; 
varying float markerval;
varying float baseSize;
varying float starSize;
varying float starScale;
varying float ppindex;
void main() {
	ppcolor = pcolor;
	ppindex = pindex;
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
	distToCamera = gl_Position.w;
	float driftSize = clamp((distToCamera - (driftDist * 1.6)) / distToCamera, 0.0, 0.3);
	float driftwave = pindex + renderTime;
	markerval = 1.0 - clamp(fract(pindex / 100.0) * 100.0, 0.0, 1.0); 
	float distMarker = clamp(((openDist * 2.0) - distToCamera) / openDist, 0.0, 1.0); // Включение лучей у всех звезд при приближении
	markerval = clamp(markerval + distMarker, 0.0, 1.0);
	vec3 drift = vec3( sin(driftwave), cos(driftwave), sin(driftwave / 2.0)) * driftSize * 4.0;
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position + drift, 1.0);
	float logdo = log(distToCamera);
	baseSize = max((psize * 10.0) - (logdo * logdo * 1.6), psize);
	starSize = baseSize * markerval * rayScale;
	starScale = max(starSize, baseSize) / baseSize;
	gl_PointSize = max(baseSize, starSize);
}
`;
export const pointItemFS = `
${centerDefine}
${piDefine}
${sphereGradient}
varying float distToCamera;
varying vec3 ppcolor;
uniform float renderTime;
uniform sampler2D spot;
uniform float openDist;
uniform float rayCount;
varying float markerval;
varying float starScale;
varying float ppindex;
void main() {
	vec2 sub0_pos = vec2( 0.5 + (( gl_PointCoord.x - 0.5 ) * starScale) , 0.5 + (( gl_PointCoord.y - 0.5 ) * starScale) );
	//float alpha0 = clamp(texture2D( spot, sub0_pos ).r - 0.1, 0.0, 1.0);
	float alpha0 = spAlpha(sub0_pos, 0.3, 0.52, 1.0);
	vec3 color0 = ppcolor * alpha0;
	float alpha = 1.0 - clamp((openDist - distToCamera) * 10.0, 0.0, 1.0);
	float radist = clamp(distance(CENTER, gl_PointCoord), 0.0, 0.5);
	float radial = (0.5 - radist) * 2.0;
	float angle = atan(gl_PointCoord.y - 0.5, gl_PointCoord.x - 0.5) / (M_PI * 2.0);
	float rayPhase = sin((ppindex / 3.4) + (renderTime / (rayCount + 2.5)));
	float aphase = fract(rayCount * (angle + rayPhase)); // Фаза лучей
	float rays = abs(aphase - 0.5) * markerval * 2.0; 										
	float pStron = markerval * abs(sin(((renderTime  + (ppindex / 3.4))) / 1.6)); 			// Сила лучей
	vec4 color1 = vec4(ppcolor, pow(rays, 12.0 * radial / rayCount) * pow(radial, 4.0));
	//vec4 color1 = vec4(ppcolor, pow(rays * pow(radial, 4.0), radial * 10.0));
	gl_FragColor = vec4(color0, alpha * alpha0) + color1 * 2.0 * alpha * pStron;
}
`;
// Шейдеры полигональных поверхностей
// Вершинный базовый (для кнопки)
export const novaBaseVS = `
varying vec2 vUv;	
attribute float hoverTime;
attribute float clickTime;
attribute float openTime;
varying float hTime;
varying float cTime;
varying float oTime;
void main() {
	vUv = uv;
	hTime = hoverTime;
	cTime = clickTime;
	oTime = openTime;
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
// Вершинный для профиля
export const novaBase2VS = `
varying vec2 vUv;	
attribute float profHoverTime;
attribute float profClickTime;
attribute float openTime;
varying float hTime;
varying float cTime;
varying float oTime;
void main() {
	vUv = uv;
	hTime = profHoverTime;
	cTime = profClickTime;
	oTime = openTime;
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
//Фрагментные шейдеры
export const BorderFS = `
uniform sampler2D mainMap;
varying vec2 vUv;
void main( void ) {
	gl_FragColor = texture2D( mainMap, vUv ).rgba;
}
`;
export const xBorderFS = `
uniform float renderTime;
uniform float speed;
uniform sampler2D mainMap;
varying vec2 vUv;
void main( void ) {
	vec2 uv2 = vec2( fract(vUv.x + (renderTime * speed)), vUv.y );
	gl_FragColor = texture2D( mainMap, uv2 ).rgba;
}
`;
export const xBorderAFS = `
uniform float renderTime;
uniform float speed;
uniform sampler2D mainMap;
varying vec2 vUv;
void main( void ) {
	vec2 uv2 = vec2( fract(vUv.x + (renderTime * speed)), vUv.y );
	gl_FragColor = vec4(0.0, 1.0, 0.85, texture2D( mainMap, uv2 ).r);
}
`;
export const xBtBorderFS = `
uniform float renderTime;
uniform float speed;
uniform vec3 btnColor;
varying vec2 vUv;
varying float hTime;
varying float cTime;
varying float oTime;
void main( void ) {
	float phase = clamp((hTime + 0.5 - renderTime) * 100.0, 0.0, 1.0);
	float intenc = clamp(fract(vUv.x + (renderTime * speed)) - phase, 0.0, 1.0);
	gl_FragColor = vec4(btnColor, intenc);
}
`;
export const yBorderFS = `
uniform float renderTime;
uniform float speed;
uniform sampler2D mainMap;
varying vec2 vUv;
void main( void ) {
	vec2 uv2 = vec2( vUv.x, fract(vUv.y + (renderTime * speed)) );
	gl_FragColor = texture2D( mainMap, uv2 ).rgba;
}
`;
export const BtnFaceFS = `
varying vec2 vUv;	
uniform sampler2D mainMap;
uniform float renderTime;
varying float hTime;
void main( void ) {
	float phase = clamp((hTime + 0.5 - renderTime) * 100.0, 0.0, 1.0);
	float alpha = texture2D( mainMap, vUv ).r;
	gl_FragColor = mix(vec4(0.0, 0.0, 0.0, 1.0), vec4(0.01, 0.914, 0.957, alpha), phase);
}
`;
export const BtnTextFS = `
varying vec2 vUv;	
uniform sampler2D alphaMap;
uniform float renderTime;
uniform vec3 btnColor;
varying float hTime;
void main( void ) {
	float phase = clamp((hTime + 0.5 - renderTime) * 100.0, 0.0, 1.0);
	float alpha = texture2D( alphaMap, vUv ).r;
	gl_FragColor = vec4(mix(btnColor, vec3(1.0, 1.0, 1.0), phase), alpha);
}
`;
export const BtnLightFS = `
${centerDefine}
varying vec2 vUv;	
uniform float renderTime;
uniform vec3 btnColor;
varying float hTime;
void main( void ) {
	float phase = clamp((hTime + 0.5 - renderTime) * 100.0, 0.0, 1.0);
	float alpha = clamp(0.45 - distance(vUv, CENTER), 0.0, 1.0);
	gl_FragColor = vec4(mix(vec3(0.0, 0.0, 0.0), btnColor, phase), alpha);
}
`;
// Фрагментный шейдер профайла
export const hexProfileFS = `
${piDefine}
${centerDefine}
uniform float renderTime;
//uniform vec3 btnColor;
uniform sampler2D maskMap;
uniform sampler2D hexMap;
varying vec2 vUv;
varying float hTime;
varying float cTime;
varying float oTime;
void main( void ) {
	float hoverPhase = clamp((hTime + 0.5 - renderTime) * 100.0, 0.0, 1.0); // 1 if hovered (0.5sec)
	float openPhase = clamp((hTime + 1.0 - renderTime), 0.0, 1.0); // 1 if opened (1.0 sec of animation)
	vec3 maskColor = texture2D( maskMap, vUv ).rgb;
	vec3 mainGreen = vec3(0.0, 0.92, 0.15); // Основной зеленый цвет
	vec3 mainBlue = vec3(0.01, 0.914, 0.957); // Цвет границы
	//mainBlue = mix(mainGreen, mainBlue, hoverPhase);
	vec3 darkBlue = vec3(0.12, 0.0, 0.75); // Цвет границы под курсором.
	float hexWeight = texture2D( hexMap, fract(vUv * vec2(16.0, 8.0)) ).r * maskColor.g * 0.75;
	float angle = atan(vUv.y - 0.5, vUv.x - 0.5) / (M_PI * 2.0);
	float borderWeight = maskColor.r * (1.0 - fract(abs(angle - renderTime / 2.2)));
	vec3 hoverColor = mix(mainBlue, darkBlue, hoverPhase);
	float hoverWeight = maskColor.b;
	float diffuseAlpha = maskColor.g * clamp(0.65 - distance(vUv, CENTER), 0.0, 1.0) + 0.15 * hoverPhase;

	gl_FragColor = vec4((mainGreen * hexWeight) + (mainGreen * diffuseAlpha) + (mainBlue * borderWeight) + (hoverColor * hoverWeight) , max(max(hexWeight * maskColor.g, diffuseAlpha * maskColor.g), max(borderWeight * maskColor.r, hoverWeight * maskColor.b)));
}
`;
// Фрагментные шейдеры глич-эффектов
export const glitchProfileFS = `
uniform float renderTime;
uniform sampler2D mainMap;
varying vec2 vUv;
varying float hTime;
varying float cTime;
varying float oTime;
float rand(vec2 co) {
  return fract(sin(dot(co.xy ,vec2(10.0,78.233))) * 4.5453);
}
vec2 drift(vec2 v2, float rndf, float maxV) {
	return fract(v2 + v2 * clamp(0.02 * rndf, 0.0, maxV));
}
void main( void ) {
	float clickPhase = clamp((cTime + 8.0 - renderTime), 0.0, 1.0); // 1.0 if clicked (8.0 sec of animation)
	float rnd = clamp( rand(vec2(floor(vUv.x * 12.0) * renderTime / 50.0, floor(vUv.y * 8.0))) - sin(vUv.x + renderTime), 0.0, 1.0);
	float fcR = texture2D( mainMap, drift(vUv, rnd + clamp(sin(renderTime * 10.0), 0.0, 0.35), clickPhase)).r;
	float fcG = texture2D( mainMap, drift(vUv, rnd + clamp(cos(renderTime * 7.0), 0.0, 0.35), clickPhase)).g;
	float fcB = texture2D( mainMap, drift(vUv, rnd, clickPhase)).b;
	float fcA = texture2D( mainMap, drift(vUv, rnd, clickPhase)).a;
	gl_FragColor = vec4(fcR, fcG, fcB, fcA);
}
`;
export const glitchProfilePFS = `
uniform float renderTime;
uniform sampler2D mainMap;
varying vec2 vUv;
varying float hTime;
varying float cTime;
varying float oTime;
float rand(vec2 co) {
  return fract(sin(dot(co.xy ,vec2(10.0,78.233))) * 4.5453);
}
vec2 drift(vec2 v2, float rndf, float maxV) {
	return clamp(v2 + v2 * clamp(0.05 * rndf, 0.0, maxV), vec2(0.0, 0.0), vec2(1.0, 1.0));
}
void main( void ) {
	float hoverPhase = clamp((hTime + 2.0 - renderTime), 0.0, 1.0); // 1.0 if hovered (2.0 sec of animation)
	float rnd = clamp( rand(vec2(floor(vUv.x * 5.0) * renderTime / 50.0, floor(vUv.y * 7.0))) - sin(vUv.x + renderTime), 0.0, 1.0);
	float fcR = texture2D( mainMap, drift(vUv, rnd + clamp(cos(renderTime * 2.0), 0.0, 1.0), hoverPhase)).r;
	float fcG = texture2D( mainMap, drift(vUv, rnd + clamp(sin(renderTime * 3.0), 0.0, 1.0), hoverPhase)).g;
	float fcB = texture2D( mainMap, drift(vUv, rnd + clamp(cos(renderTime * 1.6), 0.0, 1.0), hoverPhase)).b;
	float fcA = texture2D( mainMap, drift(vUv, rnd, hoverPhase)).a;
	gl_FragColor = vec4(fcR, fcG, fcB, fcA);
}
`;
export const glitchButtonFS = `
uniform float renderTime;
uniform sampler2D mainMap;
varying vec2 vUv;
varying float hTime;
varying float cTime;
varying float oTime;
float rand(vec2 co) {
  return fract(sin(dot(co.xy ,vec2(10.0,78.233))) * 4.5453);
}
void main( void ) {
	vec3 mainBlue = vec3(0.01, 0.914, 0.957);
	float hoverPhase = clamp((hTime + 0.5 - renderTime), 0.0, 1.0); // 1.0 if hovered (0.5 sec of animation)
	float baseFactor = clamp(rand(vec2(renderTime / 10.0, 60.32)) - sin(renderTime / 25.0), 0.0, 1.0);
	float baseAlpha = texture2D( mainMap, vUv ).r;
	float extremalRand = clamp(baseFactor * 500.0, 0.0, 1.0);
	float baseRndAlpha = clamp(baseAlpha * 0.75 + baseAlpha * baseFactor - extremalRand, 0.0, 1.0);
	float hoverAlpha = texture2D( mainMap, vUv ).g * hoverPhase;
	gl_FragColor = vec4( mainBlue, clamp(baseRndAlpha + hoverAlpha, 0.0, 1.0) );
}
`;
export const BtnGlitchTextFS = `
varying vec2 vUv;	
uniform sampler2D alphaMap;
uniform float renderTime;
uniform vec3 btnColor;
varying float hTime;
float rand(vec2 co) {
  return fract(sin(dot(co.xy ,vec2(10.0,78.233))) * 4.5453);
}
void main( void ) {
	float hoverPhase = clamp((hTime + 0.5 - renderTime), 0.0, 1.0); // 1.0 if hovered (0.5 sec of animation)
	float rnd = clamp( rand(vec2(floor(vUv.x * 5.0) * renderTime / 20.0, 12.5)) - sin(vUv.x + renderTime), 0.0, 1.0);
	float alpha = texture2D( alphaMap, vUv ).r * clamp(0.4 + 0.6 * rnd + hoverPhase, 0.0, 1.0);
	gl_FragColor = vec4(mix(btnColor, vec3(0.0, 0.0, 0.0), hoverPhase), alpha);
}
`;
 

