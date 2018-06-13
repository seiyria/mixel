# mixel

A rewrite of [pixel-sprite-generator](https://github.com/zfedoran/pixel-sprite-generator) in Typescript.

Other changes:

* Added ability to tint sprites
* Added seedable RNG

## Install

`npm i mixel`

## Examples

See [here](https://mixel.stackblitz.io) for a list of visual examples.

## Usage

### Sample Usage
```typescript
const SPACESHIP_MASK: Mask = {
  width: 6,
  height: 12,
  mirrorX: true,
  data: [
    0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 1, 1,
    0, 0, 0, 0, 1,-1,
    0, 0, 0, 1, 1,-1,
    0, 0, 0, 1, 1,-1,
    0, 0, 1, 1, 1,-1,
    0, 1, 1, 1, 2, 2,
    0, 1, 1, 1, 2, 2,
    0, 1, 1, 1, 2, 2,
    0, 1, 1, 1, 1,-1,
    0, 0, 0, 1, 1, 1,
    0, 0, 0, 0, 0, 0  
  ]
};

for(let i = 0; i < SPRITE_COUNT; i++) {
  const sprite = new Sprite(SPACESHIP_MASK, {
    colored: true
  });

  const canvas = createCanvas(sprite);
  document.getElementById('spaceship-default-settings').appendChild(canvas);
}
```

### API

#### `Mask`

A `Mask` is the general shape of the generated object. It supports these parameters:

Name | Type | Default | Description
---- | ---- | ------- | -----------
`width` | number | 0 | The number of pixels wide the mask should be (if `mirrorX` is set, will be doubled).
`height` | number | 0 | The number of pixels tall the mask should be (if `mirrorY` is set, will be doubled).
`mirrorX` | boolean | false | Whether the mask should mirror across the Y axis (from left to right).
`mirrorY` | boolean | false | Whether the mask should mirror across the X axis (from top to bottom).
`data` | SpriteStructure[] | [] | An array of values (-1..2) representing a `SpriteStructure` value.

#### `SpriteOptions`

`SpriteOptions` are specifically used in the manipulation of the sprite.

Name | Type | Default | Description
---- | ---- | ------- | -----------
`colored` | boolean | false | Whether or not the sprite should have color.
`edgeBrightness` | number (0, 1) | 0.3 | How bright the edges of the sprite should be.
`colorVariations` | number (0, 1) | 0.2 | Higher numbers make the color variations within a sprite more frequent.
`brightnessNoise` | number (0, 1) | 0.3 | Higher numbers make the brightness more "fuzzy" near the edge.
`saturation` | number (0, 1) | 0.5 | Higher numbers make the general saturation of the image appear more colorful.
`seed` | string | none | The seed to use for random generation. Using the same seed/mask will result in the same image every time.
`tint` | `{ r: number, g: number, b: number }` | none | The tint to apply to the image when it's been generated.
`randomSampleCallback` | `(x: number, y: number) => SpriteStructure` | Randomly change 1/2 to -1/0 | The callback to be applied to each individual cell of the sprite.

### More Usage

Check the editor [here](https://stackblitz.com/edit/mixel?file=index.ts) to see more examples.