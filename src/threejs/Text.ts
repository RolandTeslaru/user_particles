import { Loader, LoadingManager } from "three";

class Font {
    public isFont: boolean;
    public type: string;
    public data: any;

    constructor(data: any) {
        this.isFont = true;
        this.type = 'Font';
        this.data = data;
    }

    public generateShapes(text: string, size: number = 100) {
        const shapes: any[] = [];
        const paths = createPaths(text, size, this.data);

        for (let p = 0, pl = paths.length; p < pl; p++) {
            shapes.push(...paths[p].toShapes());
        }

        return shapes;
    }
}

function createPaths(text: string, size: number, data: any) {
    const chars = Array.from(text);
    const scale = size / data.resolution;
    const line_height = (data.boundingBox.yMax - data.boundingBox.yMin + data.underlineThickness) * scale;
    const paths: any[] = [];
    let offsetX = 0, offsetY = 0;

    for (let i = 0; i < chars.length; i++) {
        const char = chars[i];

        if (char === '\n') {
            offsetX = 0;
            offsetY -= line_height;
        } else {
            const ret = createPath(char, scale, offsetX, offsetY, data);
            offsetX += ret!.offsetX;
            paths.push(ret!.path);
        }
    }

    return paths;
}

function createPath(char: string, scale: number, offsetX: number, offsetY: number, data: any) {
    const glyph = data.glyphs[char] || data.glyphs['?'];

    if (!glyph) {
        console.error(`THREE.Font: character "${char}" does not exist in font family ${data.familyName}.`);
        return;
    }

    const path = new THREE.ShapePath();
    let x: number, y: number, cpx: number, cpy: number, cpx1: number, cpy1: number, cpx2: number, cpy2: number;

    if (glyph.o) {
        const outline = glyph._cachedOutline || (glyph._cachedOutline = glyph.o.split(' '));

        for (let i = 0, l = outline.length; i < l;) {
            const action = outline[i++];

            switch (action) {
                case 'm':
                    // moveTo
                    x = Number(outline[i++]) * scale + offsetX;
                    y = Number(outline[i++]) * scale + offsetY;
                    path.moveTo(x, y);
                    break;

                case 'l':
                    // lineTo
                    x = Number(outline[i++]) * scale + offsetX;
                    y = Number(outline[i++]) * scale + offsetY;
                    path.lineTo(x, y);
                    break;

                case 'q':
                    // quadraticCurveTo
                    cpx = Number(outline[i++]) * scale + offsetX;
                    cpy = Number(outline[i++]) * scale + offsetY;
                    cpx1 = Number(outline[i++]) * scale + offsetX;
                    cpy1 = Number(outline[i++]) * scale + offsetY;
                    path.quadraticCurveTo(cpx1, cpy1, cpx, cpy);
                    break;

                case 'b':
                    // bezierCurveTo
                    cpx = Number(outline[i++]) * scale + offsetX;
                    cpy = Number(outline[i++]) * scale + offsetY;
                    cpx1 = Number(outline[i++]) * scale + offsetX;
                    cpy1 = Number(outline[i++]) * scale + offsetY;
                    cpx2 = Number(outline[i++]) * scale + offsetX;
                    cpy2 = Number(outline[i++]) * scale + offsetY;
                    path.bezierCurveTo(cpx1, cpy1, cpx2, cpy2, cpx, cpy);
                    break;
            }
        }
    }

    return {
        offsetX: glyph.ha * scale,
        path: path,
    };
}

declare namespace THREE {
    export class ShapePath {
      constructor();
      moveTo(x: number, y: number): void;
      lineTo(x: number, y: number): void;
      quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void;
      bezierCurveTo(
        cpx1: number,
        cpy1: number,
        cpx2: number,
        cpy2: number,
        x: number,
        y: number
      ): void;
      toShapes(): any[]; // Adjust the return type if necessary
    }
  
    export class Font {
      constructor(data: any);
      generateShapes(text: string, size?: number): any[];
    }
  
    export class FontLoader extends Loader {
      constructor(manager?: LoadingManager);
      load(
        url: string,
        onLoad?: (font: THREE.Font) => void,
        onProgress?: (event: ProgressEvent) => void,
        onError?: (event: ErrorEvent) => void
      ): void;
      parse(json: any): THREE.Font;
    }
  }
  