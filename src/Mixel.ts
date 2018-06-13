
import SeedRandom from 'seedrandom';
import merge from 'lodash.merge';

export enum SpriteStructure {
  
  // shorter, same-length for drawing arrays
  AB = -1,
  EP = 0,
  EB = 1,
  BB = 2,

  AlwaysBorder = -1,
  Empty = 0,
  RandomlyEmptyBody = 1,
  RandomlyBorderBody = 2
};

export interface Mask {
  data: SpriteStructure[];
  width: number;
  height: number;
  mirrorX?: boolean;
  mirrorY?: boolean;
}

export interface SpriteOptions {
  colored?: boolean;            // default: false
  edgeBrightness?: number;      // default: 0.3, values: (0, 1), makes the edges brighter or darker
  colorVariations?: number;     // default: 0.2, values: (0, 1), higher numbers make the color variations within a sprite more frequent
  brightnessNoise?: number;     // default: 0.3, values: (0, 1), higher numbers make the brighness more "fuzzy" near the edges
  saturation?: number;          // default: 0.5, values: (0, 1), higher numbers make the general saturation of the image more colorful
  seed?: string;                // default: none,                seed the rng generating this image to make it more deterministic
  tint?: { r: number, b: number, g: number };
  randomSampleCallback?: (x: number, y: number) => SpriteStructure
}

export class Sprite {

  private static hslToRgb(h: number, s: number, l: number): { r: number, g: number, b: number } {
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = l * (1 - s);
    const q = l * (1 - f * s);
    const t = l * (1 - (1 - f) * s);

    switch(i % 6) {
      case 0: return { r: l, g: t, b: p };
      case 1: return { r: q, g: l, b: p };
      case 2: return { r: p, g: l, b: t };
      case 3: return { r: p, g: q, b: l };
      case 4: return { r: t, g: p, b: l };
      case 5: return { r: l, g: p, b: q };
    }
  }

  private spriteOpts: SpriteOptions;
  private data: number[];
  private imageData: number[];
  private rng: SeedRandom;

  public get width(): number {
    return this.mask.width * (this.mask.mirrorX ? 2 : 1);
  }

  public get height(): number {
    return this.mask.height * (this.mask.mirrorY ? 2 : 1);
  }

  public get spriteImageData(): number[] {
    return this.imageData;
  }

  constructor(private mask: Mask, opts?: SpriteOptions) {

    const defaults: SpriteOptions = {
      colored: false,
      edgeBrightness: 0.3,
      colorVariations: 0.2,
      brightnessNoise: 0.3,
      saturation: 0.5,
      randomSampleCallback: (x: number, y: number) => {
        const val = this.getData(x, y);

        if(val === SpriteStructure.RandomlyEmptyBody) {
          return val * Math.round(this.rng());
        }

        if(val === SpriteStructure.RandomlyBorderBody) {
          return this.rng() > 0.5 ? SpriteStructure.RandomlyEmptyBody : SpriteStructure.AlwaysBorder;
        }

        return val;
      }
    };

    this.data = Array(this.width * this.height).fill(SpriteStructure.AlwaysBorder);
    this.imageData = [];

    if(this.width % 2 && this.mask.mirrorX) console.warn(`Sprite Warning: Width is not evenly divisible by 2, mirroring X will look odd.`);
    if(this.height % 2 && this.mask.mirrorY) console.warn(`Sprite Warning: Height is not evenly divisible by 2, mirroring Y will look odd.`);

    this.spriteOpts = merge({}, defaults, opts);

    this.rng = SeedRandom(this.spriteOpts.seed);

    this.init();
  }

  private init(): void {
    this.applyMask();
    this.generateRandomSample();

    if(this.mask.mirrorX) this.mirrorX();
    if(this.mask.mirrorY) this.mirrorY();

    this.generateEdges();
    this.calculateColors();
  }

  private applyMask(): void {
    const height = this.mask.height;
    const width = this.mask.width;

    for(let y = 0; y < height; y++) {
      for(let x = 0; x < width; x++) {
        this.setData(x, y, this.mask.data[y * width + x]);
      }
    }
  }

  private generateRandomSample(): void {
    const height = this.height;
    const width = this.width;

    for(let y = 0; y < height; y++) {
      for(let x = 0; x < width; x++) {
        this.setData(x, y, this.spriteOpts.randomSampleCallback(x, y));
      }
    }
  }

  private mirrorX(): void {
    const height = this.height;
    const width = Math.floor(this.width / 2);

    for(let y = 0; y < height; y++) {
      for(let x = 0; x < width; x++) {
        this.setData(this.width - x - 1, y, this.getData(x, y));
      }
    }
  }

  private mirrorY(): void {
    const height = Math.floor(this.height / 2);
    const width = this.width;

    for(let y = 0; y < height; y++) {
      for(let x = 0; x < width; x++) {
        this.setData(x, this.height - y - 1, this.getData(x, y));
      }
    }
  }

  private generateEdges(): void {
    const height = this.height;
    const width = this.width;

    for(let y = 0; y < height; y++) {
      for(let x = 0; x < width; x++) {
        const val = this.getData(x, y);
        if(val === SpriteStructure.AlwaysBorder || val === SpriteStructure.Empty) continue;

        if(y - 1 >= 0 && this.getData(x, y - 1) === SpriteStructure.Empty)     this.setData(x, y - 1, SpriteStructure.AlwaysBorder);
        if(y + 1 < height && this.getData(x, y + 1) === SpriteStructure.Empty) this.setData(x, y + 1, SpriteStructure.AlwaysBorder);
        if(x - 1 >= 0 && this.getData(x - 1, y) === SpriteStructure.Empty)     this.setData(x - 1, y, SpriteStructure.AlwaysBorder);
        if(x + 1 < width && this.getData(x + 1, y) === SpriteStructure.Empty)  this.setData(x + 1, y, SpriteStructure.AlwaysBorder);
      }
    }
  }

  private calculateColors(): void {
    const isVerticalGradient = this.rng() > 0.5;
    const saturation = Math.max(Math.min(this.rng() * this.spriteOpts.saturation, 1), 0);
    let hue = this.rng();

    let ulen = 0;
    let vlen = 0;

    if(isVerticalGradient) {
      ulen = this.height;
      vlen = this.width;
    } else {
      ulen = this.width;
      vlen = this.height;
    }

    for(let u = 0; u < ulen; u++) {
      const isNewColor = Math.abs(
        (
          this.rng() * 2 - 1,
          this.rng() * 2 - 1,
          this.rng() * 2 - 1
        ) / 3
      );

      if(isNewColor > (1 - this.spriteOpts.colorVariations)) {
        hue = this.rng();
      }

      for(let v = 0; v < vlen; v++) {
        let val = 0;
        let index = 0;

        if(isVerticalGradient) {
          val = this.getData(v, u);
          index = (u * vlen + v) * 4;
        } else {
          val = this.getData(u, v);
          index = (v * ulen + u) * 4;
        }

        const rgb = { r: 1, g: 1, b: 1 };

        let tintMask = { r: 1, g: 1, b: 1 };
        if(this.spriteOpts.tint) tintMask = this.spriteOpts.tint;

        if(val !== SpriteStructure.Empty) {

          if(this.spriteOpts.colored) {
            const brightness = Math.sin((u / ulen) * Math.PI) 
                             * (1 - this.spriteOpts.brightnessNoise) 
                             + this.rng() 
                             + this.spriteOpts.brightnessNoise;

            const { r, g, b } = Sprite.hslToRgb(hue, saturation, brightness);

            rgb.r = r;
            rgb.g = g;
            rgb.b = b;

            if(val === SpriteStructure.AlwaysBorder) {
              rgb.r *= this.spriteOpts.edgeBrightness;
              rgb.g *= this.spriteOpts.edgeBrightness;
              rgb.b *= this.spriteOpts.edgeBrightness;
            }

          } else {
            if(val === SpriteStructure.AlwaysBorder) {
              rgb.r = 0;
              rgb.g = 0;
              rgb.b = 0;
            }
          }

        }

        this.imageData[index + 0] = rgb.r * 255;
        this.imageData[index + 1] = rgb.g * 255;
        this.imageData[index + 2] = rgb.b * 255;
        this.imageData[index + 3] = 255;

        if(val !== SpriteStructure.Empty) {
          this.imageData[index + 0] *= tintMask.r;
          this.imageData[index + 1] *= tintMask.g;
          this.imageData[index + 2] *= tintMask.b;
        }
      }
    }
  }

  private setData(x: number, y: number, value: number): void {
    this.data[y * this.width + x] = value;
  }

  private getData(x: number, y: number): number {
    return this.data[y * this.width + x];
  }

  public toString(): string {
    const height = this.height;
    const width = this.width;
    let output = '';

    for(let y = 0; y < height; y++) {
        for(let x = 0; x < width; x++) {
          const val = this.getData(x, y);
          output += val >= 0 ? '  ' + val : ' ' + val;
        }
        output += '\n';
    }

    return output;
  }
}

export class SpriteCanvasHelper {

  static createCanvas(sprite: Sprite): HTMLCanvasElement {

    // create a canvas and copy the sprites image data
    const canvas = document.createElement('canvas');
    canvas.setAttribute('height', '' + sprite.height);
    canvas.setAttribute('width', '' + sprite.width);
    const context = canvas.getContext('2d');
    const pixels = context.createImageData(sprite.width, sprite.height);

    const imageData = sprite.spriteImageData;
    for(let i = 0; i < imageData.length; i++) {
      pixels.data[i] = imageData[i];
    }

    context.putImageData(pixels, 0, 0);
    return canvas;
  }

  static resizeCanvas(canvas: HTMLCanvasElement, scaleFactor: number): HTMLCanvasElement {

    // get the data from the first canvas
    const firstCtx = canvas.getContext('2d');
    const firstPixels = firstCtx.getImageData(0, 0, canvas.width, canvas.height);

    // create a scaled canvas
    const scaleWidth = canvas.width * scaleFactor;
    const scaleHeight = canvas.height * scaleFactor;

    const scaledCanvas = document.createElement('canvas');
    scaledCanvas.width = scaleWidth;
    scaledCanvas.height = scaleHeight;
    
    const scaledCtx = scaledCanvas.getContext('2d');
    const scaledPixels = scaledCtx.getImageData(0, 0, scaleWidth, scaleHeight);

    for(let y = 0; y < scaleHeight; y++) {
      for(let x = 0; x < scaleWidth; x++) {
        const idx = (Math.floor(y / scaleFactor) * canvas.width + Math.floor(x / scaleFactor)) * 4;
        const scaledIdx = (y * scaleWidth + x) * 4;

        scaledPixels.data[scaledIdx + 0] = firstPixels.data[idx + 0];
        scaledPixels.data[scaledIdx + 1] = firstPixels.data[idx + 1];
        scaledPixels.data[scaledIdx + 2] = firstPixels.data[idx + 2];
        scaledPixels.data[scaledIdx + 3] = firstPixels.data[idx + 3];
      }
    }

    scaledCtx.putImageData(scaledPixels, 0, 0);

    return scaledCanvas;
  }
}