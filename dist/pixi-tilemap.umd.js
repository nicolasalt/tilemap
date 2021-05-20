/* eslint-disable */
 
/*!
 * @pixi/tilemap - v3.2.0
 * Compiled Thu, 20 May 2021 22:23:36 UTC
 *
 * @pixi/tilemap is licensed under the MIT License.
 * http://www.opensource.org/licenses/mit-license
 * 
 * Copyright 2019-2020, Ivan Popelyshev, All Rights Reserved
 */
this.PIXI = this.PIXI || {};
this.PIXI.tilemap = this.PIXI.tilemap || {};
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@pixi/display'), require('@pixi/core'), require('@pixi/constants'), require('@pixi/math'), require('@pixi/utils')) :
    typeof define === 'function' && define.amd ? define(['exports', '@pixi/display', '@pixi/core', '@pixi/constants', '@pixi/math', '@pixi/utils'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global._pixi_tilemap = {}, global.PIXI, global.PIXI, global.PIXI, global.PIXI, global.PIXI.utils));
}(this, (function (exports, display, core, constants, math, utils) { 'use strict';

    class CanvasTileRenderer {
        constructor(renderer) {
            this.tileAnim = [0, 0];
            this.dontUseTransform = false;
            this.renderer = renderer;
            this.tileAnim = [0, 0];
        }
    }

    const settings = {
        TEXTURES_PER_TILEMAP: 16,
        TEXTILE_DIMEN: 1024,
        TEXTILE_UNITS: 1,
        TEXTILE_SCALE_MODE: constants.SCALE_MODES.LINEAR,
        use32bitIndex: false,
        DO_CLEAR: true,
        get maxTextures() { return this.MAX_TEXTURES; },
        set maxTextures(value) { this.MAX_TEXTURES = value; },
        get boundSize() { return this.TEXTURE_TILE_DIMEN; },
        set boundSize(value) { this.TILE_TEXTURE_DIMEN = value; },
        get boundCountPerBuffer() { return this.TEXTILE_UNITS; },
        set boundCountPerBuffer(value) { this.TEXTILE_UNITS = value; },
    };
    const Constant = settings;

    var POINT_STRUCT;
    (function (POINT_STRUCT) {
        POINT_STRUCT[POINT_STRUCT["U"] = 0] = "U";
        POINT_STRUCT[POINT_STRUCT["V"] = 1] = "V";
        POINT_STRUCT[POINT_STRUCT["X"] = 2] = "X";
        POINT_STRUCT[POINT_STRUCT["Y"] = 3] = "Y";
        POINT_STRUCT[POINT_STRUCT["TILE_WIDTH"] = 4] = "TILE_WIDTH";
        POINT_STRUCT[POINT_STRUCT["TILE_HEIGHT"] = 5] = "TILE_HEIGHT";
        POINT_STRUCT[POINT_STRUCT["ROTATE"] = 6] = "ROTATE";
        POINT_STRUCT[POINT_STRUCT["ANIM_X"] = 7] = "ANIM_X";
        POINT_STRUCT[POINT_STRUCT["ANIM_Y"] = 8] = "ANIM_Y";
        POINT_STRUCT[POINT_STRUCT["TEXTURE_INDEX"] = 9] = "TEXTURE_INDEX";
        POINT_STRUCT[POINT_STRUCT["ANIM_COUNT_X"] = 10] = "ANIM_COUNT_X";
        POINT_STRUCT[POINT_STRUCT["ANIM_COUNT_Y"] = 11] = "ANIM_COUNT_Y";
        POINT_STRUCT[POINT_STRUCT["ANIM_DIVISOR"] = 12] = "ANIM_DIVISOR";
        POINT_STRUCT[POINT_STRUCT["ALPHA"] = 13] = "ALPHA";
    })(POINT_STRUCT || (POINT_STRUCT = {}));
    const POINT_STRUCT_SIZE = (Object.keys(POINT_STRUCT).length / 2);
    class Tilemap extends display.Container {
        constructor(tileset) {
            super();
            this.shadowColor = new Float32Array([0.0, 0.0, 0.0, 0.5]);
            this._globalMat = null;
            this.tileAnim = null;
            this.modificationMarker = 0;
            this.offsetX = 0;
            this.offsetY = 0;
            this.compositeParent = false;
            this.tilemapBounds = new display.Bounds();
            this.hasAnimatedTile = false;
            this.pointsBuf = [];
            this.renderCanvas = (renderer) => {
                const plugin = renderer.plugins.tilemap;
                if (plugin && !plugin.dontUseTransform) {
                    const wt = this.worldTransform;
                    renderer.context.setTransform(wt.a, wt.b, wt.c, wt.d, wt.tx * renderer.resolution, wt.ty * renderer.resolution);
                }
                this.renderCanvasCore(renderer);
            };
            this.vbId = 0;
            this.vb = null;
            this.vbBuffer = null;
            this.vbArray = null;
            this.vbInts = null;
            this.setTileset(tileset);
        }
        getTileset() {
            return this.tileset;
        }
        setTileset(tileset = []) {
            if (!Array.isArray(tileset)) {
                tileset = [tileset];
            }
            for (let i = 0; i < tileset.length; i++) {
                if (tileset[i].baseTexture) {
                    tileset[i] = tileset[i].baseTexture;
                }
            }
            this.tileset = tileset;
            return this;
        }
        clear() {
            this.pointsBuf.length = 0;
            this.modificationMarker = 0;
            this.tilemapBounds.clear();
            this.hasAnimatedTile = false;
            return this;
        }
        tile(tileTexture, x, y, options = {}) {
            var _a, _b, _c, _d;
            let baseTexture;
            let textureIndex = -1;
            if (typeof tileTexture === 'number') {
                textureIndex = tileTexture;
                baseTexture = this.tileset[textureIndex];
            }
            else {
                let texture;
                if (typeof tileTexture === 'string') {
                    texture = core.Texture.from(tileTexture);
                }
                else {
                    texture = tileTexture;
                }
                const textureList = this.tileset;
                for (let i = 0; i < textureList.length; i++) {
                    if (textureList[i] === texture.castToBaseTexture()) {
                        textureIndex = i;
                        break;
                    }
                }
                if ('baseTexture' in texture) {
                    options.u = (_a = options.u) !== null && _a !== void 0 ? _a : texture.frame.x;
                    options.v = (_b = options.v) !== null && _b !== void 0 ? _b : texture.frame.y;
                    options.tileWidth = (_c = options.tileWidth) !== null && _c !== void 0 ? _c : texture.orig.width;
                    options.tileHeight = (_d = options.tileHeight) !== null && _d !== void 0 ? _d : texture.orig.height;
                }
                baseTexture = texture.castToBaseTexture();
            }
            if (!baseTexture || textureIndex < 0) {
                console.error('The tile texture was not found in the tilemap tileset.');
                return -1;
            }
            const { u = 0, v = 0, tileWidth = baseTexture.realWidth, tileHeight = baseTexture.realHeight, animX = 0, animY = 0, rotate = 0, animCountX = 1024, animCountY = 1024, animDivisor = 1, alpha = 1, } = options;
            const pb = this.pointsBuf;
            this.hasAnimatedTile = this.hasAnimatedTile || animX > 0 || animY > 0;
            pb.push(u);
            pb.push(v);
            pb.push(x);
            pb.push(y);
            pb.push(tileWidth);
            pb.push(tileHeight);
            pb.push(rotate);
            pb.push(animX | 0);
            pb.push(animY | 0);
            pb.push(textureIndex);
            pb.push(animCountX);
            pb.push(animCountY);
            pb.push(animDivisor);
            pb.push(alpha);
            this.tilemapBounds.addFramePad(x, y, x + tileWidth, y + tileHeight, 0, 0);
            return this.pointsBuf.length;
        }
        tileRotate(rotate) {
            const pb = this.pointsBuf;
            pb[pb.length - (POINT_STRUCT_SIZE - POINT_STRUCT.TEXTURE_INDEX)] = rotate;
        }
        tileAnimX(offset, count) {
            const pb = this.pointsBuf;
            pb[pb.length - (POINT_STRUCT_SIZE - POINT_STRUCT.ANIM_X)] = offset;
            pb[pb.length - (POINT_STRUCT_SIZE - POINT_STRUCT.ANIM_COUNT_X)] = count;
        }
        tileAnimY(offset, count) {
            const pb = this.pointsBuf;
            pb[pb.length - (POINT_STRUCT_SIZE - POINT_STRUCT.ANIM_Y)] = offset;
            pb[pb.length - (POINT_STRUCT_SIZE - POINT_STRUCT.ANIM_COUNT_Y)] = count;
        }
        tileAnimDivisor(divisor) {
            const pb = this.pointsBuf;
            pb[pb.length - (POINT_STRUCT_SIZE - POINT_STRUCT.ANIM_DIVISOR)] = divisor;
        }
        tileAlpha(alpha) {
            const pb = this.pointsBuf;
            pb[pb.length - (POINT_STRUCT_SIZE - POINT_STRUCT.ALPHA)] = alpha;
        }
        tileAlphaForIndex(index, alpha) {
            const pb = this.pointsBuf;
            pb[index - (POINT_STRUCT_SIZE - POINT_STRUCT.ALPHA)] = alpha;
        }
        renderCanvasCore(renderer) {
            if (this.tileset.length === 0)
                return;
            const points = this.pointsBuf;
            const tileAnim = this.tileAnim || (renderer.plugins.tilemap && renderer.plugins.tilemap.tileAnim);
            renderer.context.fillStyle = '#000000';
            for (let i = 0, n = points.length; i < n; i += POINT_STRUCT_SIZE) {
                let x1 = points[i + POINT_STRUCT.U] * tileAnim[0];
                let y1 = points[i + POINT_STRUCT.V] * tileAnim[1];
                const x2 = points[i + POINT_STRUCT.X];
                const y2 = points[i + POINT_STRUCT.Y];
                const w = points[i + POINT_STRUCT.TILE_WIDTH];
                const h = points[i + POINT_STRUCT.TILE_HEIGHT];
                x1 += points[i + POINT_STRUCT.ANIM_X] * renderer.plugins.tilemap.tileAnim[0];
                y1 += points[i + POINT_STRUCT.ANIM_Y] * renderer.plugins.tilemap.tileAnim[1];
                const textureIndex = points[i + POINT_STRUCT.TEXTURE_INDEX];
                const alpha = points[i + POINT_STRUCT.ALPHA];
                if (textureIndex >= 0 && this.tileset[textureIndex]) {
                    renderer.context.globalAlpha = alpha;
                    renderer.context.drawImage(this.tileset[textureIndex].getDrawableSource(), x1, y1, w, h, x2, y2, w, h);
                }
                else {
                    renderer.context.globalAlpha = 0.5;
                    renderer.context.fillRect(x2, y2, w, h);
                }
                renderer.context.globalAlpha = 1;
            }
        }
        destroyVb() {
            if (this.vb) {
                this.vb.destroy();
                this.vb = null;
            }
        }
        render(renderer) {
            const plugin = renderer.plugins.tilemap;
            const shader = plugin.getShader();
            renderer.batch.setObjectRenderer(plugin);
            this._globalMat = shader.uniforms.projTransMatrix;
            renderer
                .globalUniforms
                .uniforms
                .projectionMatrix
                .copyTo(this._globalMat)
                .append(this.worldTransform);
            shader.uniforms.shadowColor = this.shadowColor;
            shader.uniforms.animationFrame = this.tileAnim || plugin.tileAnim;
            this.renderWebGLCore(renderer, plugin);
        }
        renderWebGLCore(renderer, plugin) {
            const points = this.pointsBuf;
            if (points.length === 0)
                return;
            const rectsCount = points.length / POINT_STRUCT_SIZE;
            const shader = plugin.getShader();
            const textures = this.tileset;
            if (textures.length === 0)
                return;
            plugin.bindTileTextures(renderer, textures);
            renderer.shader.bind(shader, false);
            let vb = this.vb;
            if (!vb) {
                vb = plugin.createVb();
                this.vb = vb;
                this.vbId = vb.id;
                this.vbBuffer = null;
                this.modificationMarker = 0;
            }
            plugin.checkIndexBuffer(rectsCount, vb);
            const boundCountPerBuffer = settings.TEXTILE_UNITS;
            const vertexBuf = vb.getBuffer('aVertexPosition');
            const vertices = rectsCount * vb.vertPerQuad;
            if (vertices === 0)
                return;
            if (this.modificationMarker !== vertices) {
                this.modificationMarker = vertices;
                const vs = vb.stride * vertices;
                if (!this.vbBuffer || this.vbBuffer.byteLength < vs) {
                    let bk = vb.stride;
                    while (bk < vs) {
                        bk *= 2;
                    }
                    this.vbBuffer = new ArrayBuffer(bk);
                    this.vbArray = new Float32Array(this.vbBuffer);
                    this.vbInts = new Uint32Array(this.vbBuffer);
                    vertexBuf.update(this.vbBuffer);
                }
                const arr = this.vbArray;
                let sz = 0;
                let textureId = 0;
                let shiftU = this.offsetX;
                let shiftV = this.offsetY;
                for (let i = 0; i < points.length; i += POINT_STRUCT_SIZE) {
                    const eps = 0.5;
                    if (this.compositeParent) {
                        const textureIndex = points[i + POINT_STRUCT.TEXTURE_INDEX];
                        if (boundCountPerBuffer > 1) {
                            textureId = (textureIndex >> 2);
                            shiftU = this.offsetX * (textureIndex & 1);
                            shiftV = this.offsetY * ((textureIndex >> 1) & 1);
                        }
                        else {
                            textureId = textureIndex;
                            shiftU = 0;
                            shiftV = 0;
                        }
                    }
                    const x = points[i + POINT_STRUCT.X];
                    const y = points[i + POINT_STRUCT.Y];
                    const w = points[i + POINT_STRUCT.TILE_WIDTH];
                    const h = points[i + POINT_STRUCT.TILE_HEIGHT];
                    const u = points[i + POINT_STRUCT.U] + shiftU;
                    const v = points[i + POINT_STRUCT.V] + shiftV;
                    let rotate = points[i + POINT_STRUCT.ROTATE];
                    const animX = points[i + POINT_STRUCT.ANIM_X];
                    const animY = points[i + POINT_STRUCT.ANIM_Y];
                    const animWidth = points[i + POINT_STRUCT.ANIM_COUNT_X] || 1024;
                    const animHeight = points[i + POINT_STRUCT.ANIM_COUNT_Y] || 1024;
                    const animXEncoded = animX + (animWidth * 2048);
                    const animYEncoded = animY + (animHeight * 2048);
                    const animDivisor = points[i + POINT_STRUCT.ANIM_DIVISOR];
                    const alpha = points[i + POINT_STRUCT.ALPHA];
                    let u0;
                    let v0;
                    let u1;
                    let v1;
                    let u2;
                    let v2;
                    let u3;
                    let v3;
                    if (rotate === 0) {
                        u0 = u;
                        v0 = v;
                        u1 = u + w;
                        v1 = v;
                        u2 = u + w;
                        v2 = v + h;
                        u3 = u;
                        v3 = v + h;
                    }
                    else {
                        let w2 = w / 2;
                        let h2 = h / 2;
                        if (rotate % 4 !== 0) {
                            w2 = h / 2;
                            h2 = w / 2;
                        }
                        const cX = u + w2;
                        const cY = v + h2;
                        rotate = math.groupD8.add(rotate, math.groupD8.NW);
                        u0 = cX + (w2 * math.groupD8.uX(rotate));
                        v0 = cY + (h2 * math.groupD8.uY(rotate));
                        rotate = math.groupD8.add(rotate, 2);
                        u1 = cX + (w2 * math.groupD8.uX(rotate));
                        v1 = cY + (h2 * math.groupD8.uY(rotate));
                        rotate = math.groupD8.add(rotate, 2);
                        u2 = cX + (w2 * math.groupD8.uX(rotate));
                        v2 = cY + (h2 * math.groupD8.uY(rotate));
                        rotate = math.groupD8.add(rotate, 2);
                        u3 = cX + (w2 * math.groupD8.uX(rotate));
                        v3 = cY + (h2 * math.groupD8.uY(rotate));
                    }
                    arr[sz++] = x;
                    arr[sz++] = y;
                    arr[sz++] = u0;
                    arr[sz++] = v0;
                    arr[sz++] = u + eps;
                    arr[sz++] = v + eps;
                    arr[sz++] = u + w - eps;
                    arr[sz++] = v + h - eps;
                    arr[sz++] = animXEncoded;
                    arr[sz++] = animYEncoded;
                    arr[sz++] = textureId;
                    arr[sz++] = animDivisor;
                    arr[sz++] = alpha;
                    arr[sz++] = x + w;
                    arr[sz++] = y;
                    arr[sz++] = u1;
                    arr[sz++] = v1;
                    arr[sz++] = u + eps;
                    arr[sz++] = v + eps;
                    arr[sz++] = u + w - eps;
                    arr[sz++] = v + h - eps;
                    arr[sz++] = animXEncoded;
                    arr[sz++] = animYEncoded;
                    arr[sz++] = textureId;
                    arr[sz++] = animDivisor;
                    arr[sz++] = alpha;
                    arr[sz++] = x + w;
                    arr[sz++] = y + h;
                    arr[sz++] = u2;
                    arr[sz++] = v2;
                    arr[sz++] = u + eps;
                    arr[sz++] = v + eps;
                    arr[sz++] = u + w - eps;
                    arr[sz++] = v + h - eps;
                    arr[sz++] = animXEncoded;
                    arr[sz++] = animYEncoded;
                    arr[sz++] = textureId;
                    arr[sz++] = animDivisor;
                    arr[sz++] = alpha;
                    arr[sz++] = x;
                    arr[sz++] = y + h;
                    arr[sz++] = u3;
                    arr[sz++] = v3;
                    arr[sz++] = u + eps;
                    arr[sz++] = v + eps;
                    arr[sz++] = u + w - eps;
                    arr[sz++] = v + h - eps;
                    arr[sz++] = animXEncoded;
                    arr[sz++] = animYEncoded;
                    arr[sz++] = textureId;
                    arr[sz++] = animDivisor;
                    arr[sz++] = alpha;
                }
                vertexBuf.update(arr);
            }
            renderer.geometry.bind(vb, shader);
            renderer.geometry.draw(constants.DRAW_MODES.TRIANGLES, rectsCount * 6, 0);
        }
        isModified(anim) {
            if (this.modificationMarker !== this.pointsBuf.length
                || (anim && this.hasAnimatedTile)) {
                return true;
            }
            return false;
        }
        clearModify() {
            this.modificationMarker = this.pointsBuf.length;
        }
        _calculateBounds() {
            const { minX, minY, maxX, maxY } = this.tilemapBounds;
            this._bounds.addFrame(this.transform, minX, minY, maxX, maxY);
        }
        getLocalBounds(rect) {
            if (this.children.length === 0) {
                return this.tilemapBounds.getRectangle(rect);
            }
            return super.getLocalBounds.call(this, rect);
        }
        destroy(options) {
            super.destroy(options);
            this.destroyVb();
        }
        addFrame(texture, x, y, animX, animY) {
            this.tile(texture, x, y, {
                animX,
                animY,
            });
            return true;
        }
        addRect(textureIndex, u, v, x, y, tileWidth, tileHeight, animX = 0, animY = 0, rotate = 0, animCountX = 1024, animCountY = 1024, animDivisor = 1, alpha = 1) {
            return this.tile(textureIndex, x, y, {
                u, v, tileWidth, tileHeight, animX, animY, rotate, animCountX, animCountY, animDivisor, alpha
            });
        }
    }

    class CompositeTilemap extends display.Container {
        constructor(tileset) {
            super();
            this.tileAnim = null;
            this.lastModifiedTilemap = null;
            this.modificationMarker = 0;
            this.shadowColor = new Float32Array([0.0, 0.0, 0.0, 0.5]);
            this._globalMat = null;
            this.renderCanvas = (renderer) => {
                if (!this.visible || this.worldAlpha <= 0 || !this.renderable) {
                    return;
                }
                const tilemapPlugin = renderer.plugins.tilemap;
                if (tilemapPlugin && !tilemapPlugin.dontUseTransform) {
                    const wt = this.worldTransform;
                    renderer.context.setTransform(wt.a, wt.b, wt.c, wt.d, wt.tx * renderer.resolution, wt.ty * renderer.resolution);
                }
                const layers = this.children;
                for (let i = 0; i < layers.length; i++) {
                    const layer = layers[i];
                    layer.tileAnim = this.tileAnim;
                    layer.renderCanvasCore(renderer);
                }
            };
            this.setBitmaps = this.tileset;
            this.tileset(tileset);
            this.texturesPerTilemap = settings.TEXTURES_PER_TILEMAP;
        }
        tileset(tileTextures) {
            if (!tileTextures) {
                tileTextures = [];
            }
            const texPerChild = this.texturesPerTilemap;
            const len1 = this.children.length;
            const len2 = Math.ceil(tileTextures.length / texPerChild);
            for (let i = 0; i < Math.min(len1, len2); i++) {
                this.children[i].setTileset(tileTextures.slice(i * texPerChild, (i + 1) * texPerChild));
            }
            for (let i = len1; i < len2; i++) {
                const tilemap = new Tilemap(tileTextures.slice(i * texPerChild, (i + 1) * texPerChild));
                tilemap.compositeParent = true;
                tilemap.offsetX = settings.TEXTILE_DIMEN;
                tilemap.offsetY = settings.TEXTILE_DIMEN;
                this.addChild(tilemap);
            }
            return this;
        }
        clear() {
            for (let i = 0; i < this.children.length; i++) {
                this.children[i].clear();
            }
            this.modificationMarker = 0;
            return this;
        }
        tileRotate(rotate) {
            if (this.lastModifiedTilemap) {
                this.lastModifiedTilemap.tileRotate(rotate);
            }
            return this;
        }
        tileAnimX(offset, count) {
            if (this.lastModifiedTilemap) {
                this.lastModifiedTilemap.tileAnimX(offset, count);
            }
            return this;
        }
        tileAnimY(offset, count) {
            if (this.lastModifiedTilemap) {
                this.lastModifiedTilemap.tileAnimY(offset, count);
            }
            return this;
        }
        tileAnimDivisor(divisor) {
            if (this.lastModifiedTilemap) {
                this.lastModifiedTilemap.tileAnimDivisor(divisor);
            }
            return this;
        }
        tile(tileTexture, x, y, options = {}) {
            let tilemap = null;
            const children = this.children;
            this.lastModifiedTilemap = null;
            let result = -1;
            if (typeof tileTexture === 'number') {
                const childIndex = tileTexture / this.texturesPerTilemap >> 0;
                let tileIndex = 0;
                tilemap = children[childIndex];
                if (!tilemap) {
                    tilemap = children[0];
                    if (!tilemap)
                        return -1;
                    tileIndex = 0;
                }
                else {
                    tileIndex = tileTexture % this.texturesPerTilemap;
                }
                result = tilemap.tile(tileIndex, x, y, options);
            }
            else {
                if (typeof tileTexture === 'string') {
                    tileTexture = core.Texture.from(tileTexture);
                }
                for (let i = 0; i < children.length; i++) {
                    const child = children[i];
                    const tex = child.getTileset();
                    for (let j = 0; j < tex.length; j++) {
                        if (tex[j] === tileTexture.baseTexture) {
                            tilemap = child;
                            break;
                        }
                    }
                    if (tilemap) {
                        break;
                    }
                }
                if (!tilemap) {
                    for (let i = children.length - 1; i >= 0; i--) {
                        const child = children[i];
                        if (child.getTileset().length < this.texturesPerTilemap) {
                            tilemap = child;
                            child.getTileset().push(tileTexture.baseTexture);
                            break;
                        }
                    }
                    if (!tilemap) {
                        tilemap = new Tilemap(tileTexture.baseTexture);
                        tilemap.compositeParent = true;
                        tilemap.offsetX = settings.TEXTILE_DIMEN;
                        tilemap.offsetY = settings.TEXTILE_DIMEN;
                        this.addChild(tilemap);
                    }
                }
                result = tilemap.tile(tileTexture, x, y, options);
            }
            this.lastModifiedTilemap = tilemap;
            return result;
        }
        render(renderer) {
            if (!this.visible || this.worldAlpha <= 0 || !this.renderable) {
                return;
            }
            const plugin = renderer.plugins.tilemap;
            const shader = plugin.getShader();
            renderer.batch.setObjectRenderer(plugin);
            this._globalMat = shader.uniforms.projTransMatrix;
            renderer.globalUniforms.uniforms.projectionMatrix.copyTo(this._globalMat).append(this.worldTransform);
            shader.uniforms.shadowColor = this.shadowColor;
            shader.uniforms.animationFrame = this.tileAnim || plugin.tileAnim;
            renderer.shader.bind(shader, false);
            const layers = this.children;
            for (let i = 0; i < layers.length; i++) {
                layers[i].renderWebGLCore(renderer, plugin);
            }
        }
        isModified(anim) {
            const layers = this.children;
            if (this.modificationMarker !== layers.length) {
                return true;
            }
            for (let i = 0; i < layers.length; i++) {
                if (layers[i].isModified(anim)) {
                    return true;
                }
            }
            return false;
        }
        clearModify() {
            const layers = this.children;
            this.modificationMarker = layers.length;
            for (let i = 0; i < layers.length; i++) {
                layers[i].clearModify();
            }
        }
        addFrame(texture, x, y, animX, animY, animWidth, animHeight, animDivisor, alpha) {
            return this.tile(texture, x, y, {
                animX,
                animY,
                animCountX: animWidth,
                animCountY: animHeight,
                animDivisor,
                alpha
            });
        }
        addRect(textureIndex, u, v, x, y, tileWidth, tileHeight, animX, animY, rotate, animWidth, animHeight) {
            const childIndex = textureIndex / this.texturesPerTilemap >> 0;
            const textureId = textureIndex % this.texturesPerTilemap;
            if (this.children[childIndex] && this.children[childIndex].getTileset()) {
                this.lastModifiedTilemap = this.children[childIndex];
                this.lastModifiedTilemap.addRect(textureId, u, v, x, y, tileWidth, tileHeight, animX, animY, rotate, animWidth, animHeight);
            }
            else {
                this.lastModifiedTilemap = null;
            }
            return this;
        }
        get texPerChild() { return this.texturesPerTilemap; }
    }

    class TextileResource extends core.Resource {
        constructor(options = settings) {
            super(options.TEXTILE_DIMEN * 2, options.TEXTILE_DIMEN * Math.ceil(options.TEXTILE_UNITS / 2));
            this.baseTexture = null;
            this._clearBuffer = null;
            const tiles = this.tiles = new Array(options.TEXTILE_UNITS);
            this.doClear = !!options.DO_CLEAR;
            this.tileDimen = options.TEXTILE_DIMEN;
            for (let j = 0; j < options.TEXTILE_UNITS; j++) {
                tiles[j] = {
                    dirtyId: 0,
                    x: options.TEXTILE_DIMEN * (j & 1),
                    y: options.TEXTILE_DIMEN * (j >> 1),
                    baseTexture: core.Texture.WHITE.baseTexture,
                };
            }
        }
        tile(index, texture) {
            const tile = this.tiles[index];
            if (tile.baseTexture === texture) {
                return;
            }
            tile.baseTexture = texture;
            this.baseTexture.update();
            this.tiles[index].dirtyId = this.baseTexture.dirtyId;
        }
        bind(baseTexture) {
            if (this.baseTexture) {
                throw new Error('Only one baseTexture is allowed for this resource!');
            }
            this.baseTexture = baseTexture;
            super.bind(baseTexture);
        }
        upload(renderer, texture, glTexture) {
            const { gl } = renderer;
            const { width, height } = this;
            gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, texture.alphaMode === undefined || texture.alphaMode === constants.ALPHA_MODES.UNPACK);
            if (glTexture.dirtyId < 0) {
                glTexture.width = width;
                glTexture.height = height;
                gl.texImage2D(texture.target, 0, texture.format, width, height, 0, texture.format, texture.type, null);
            }
            const doClear = this.doClear;
            const tiles = this.tiles;
            if (doClear && !this._clearBuffer) {
                this._clearBuffer = new Uint8Array(settings.TEXTILE_DIMEN * settings.TEXTILE_DIMEN * 4);
            }
            for (let i = 0; i < tiles.length; i++) {
                const spr = tiles[i];
                const tex = spr.baseTexture;
                if (glTexture.dirtyId >= this.tiles[i].dirtyId) {
                    continue;
                }
                const res = tex.resource;
                if (!tex.valid || !res || !res.source) {
                    continue;
                }
                if (doClear && (tex.width < this.tileDimen || tex.height < this.tileDimen)) {
                    gl.texSubImage2D(texture.target, 0, spr.x, spr.y, this.tileDimen, this.tileDimen, texture.format, texture.type, this._clearBuffer);
                }
                gl.texSubImage2D(texture.target, 0, spr.x, spr.y, texture.format, texture.type, res.source);
            }
            return true;
        }
    }

    function generateSampleSrc(maxTextures) {
        let src = '';
        src += '\n';
        src += '\n';
        src += 'if(vTextureId <= -1.0) {';
        src += '\n\tcolor = shadowColor;';
        src += '\n}';
        for (let i = 0; i < maxTextures; i++) {
            src += '\nelse ';
            if (i < maxTextures - 1) {
                src += `if(textureId == ${i}.0)`;
            }
            src += '\n{';
            src += `\n\tcolor = texture2D(uSamplers[${i}], textureCoord * uSamplerSize[${i}]);`;
            src += '\n}';
        }
        src += '\n';
        src += '\n';
        return src;
    }
    function fillSamplers(shader, maxTextures) {
        const sampleValues = [];
        for (let i = 0; i < maxTextures; i++) {
            sampleValues[i] = i;
        }
        shader.uniforms.uSamplers = sampleValues;
        const samplerSize = [];
        for (let i = 0; i < maxTextures; i++) {
            samplerSize.push(1.0 / 2048);
            samplerSize.push(1.0 / 2048);
        }
        shader.uniforms.uSamplerSize = samplerSize;
    }
    function generateFragmentSrc(maxTextures, fragmentSrc) {
        return fragmentSrc.replace(/%count%/gi, `${maxTextures}`)
            .replace(/%forloop%/gi, generateSampleSrc(maxTextures));
    }

    var tilemapVertexTemplateSrc = "attribute vec2 aVertexPosition;\nattribute vec2 aTextureCoord;\nattribute vec4 aFrame;\nattribute vec2 aAnim;\nattribute float aAnimDivisor;\nattribute float aTextureId;\nattribute float aAlpha;\n\nuniform mat3 projTransMatrix;\nuniform vec2 animationFrame;\n\nvarying vec2 vTextureCoord;\nvarying float vTextureId;\nvarying vec4 vFrame;\nvarying float vAlpha;\n\nvoid main(void)\n{\n   gl_Position = vec4((projTransMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);\n   vec2 animCount = floor((aAnim + 0.5) / 2048.0);\n   vec2 animFrameOffset = aAnim - animCount * 2048.0;\n   vec2 currentFrame = floor(animationFrame / aAnimDivisor);\n   vec2 animOffset = animFrameOffset * floor(mod(currentFrame + 0.5, animCount));\n\n   vTextureCoord = aTextureCoord + animOffset;\n   vFrame = aFrame + vec4(animOffset, animOffset);\n   vTextureId = aTextureId;\n   vAlpha = aAlpha;\n}\n";

    var tilemapFragmentTemplateSrc = "varying vec2 vTextureCoord;\nvarying vec4 vFrame;\nvarying float vTextureId;\nvarying float vAlpha;\nuniform vec4 shadowColor;\nuniform sampler2D uSamplers[%count%];\nuniform vec2 uSamplerSize[%count%];\n\nvoid main(void)\n{\n   vec2 textureCoord = clamp(vTextureCoord, vFrame.xy, vFrame.zw);\n   float textureId = floor(vTextureId + 0.5);\n\n   vec4 color;\n   %forloop%\n   gl_FragColor = color * vAlpha;\n}\n";

    class TilemapShader extends core.Shader {
        constructor(maxTextures) {
            super(new core.Program(tilemapVertexTemplateSrc, generateFragmentSrc(maxTextures, tilemapFragmentTemplateSrc)), {
                animationFrame: new Float32Array(2),
                uSamplers: [],
                uSamplerSize: [],
                projTransMatrix: new math.Matrix()
            });
            this.maxTextures = 0;
            this.maxTextures = maxTextures;
            fillSamplers(this, this.maxTextures);
        }
    }
    class TilemapGeometry extends core.Geometry {
        constructor() {
            super();
            this.vertSize = 13;
            this.vertPerQuad = 4;
            this.stride = this.vertSize * 4;
            this.lastTimeAccess = 0;
            const buf = this.buf = new core.Buffer(new Float32Array(2), true, false);
            this.addAttribute('aVertexPosition', buf, 0, false, 0, this.stride, 0)
                .addAttribute('aTextureCoord', buf, 0, false, 0, this.stride, 2 * 4)
                .addAttribute('aFrame', buf, 0, false, 0, this.stride, 4 * 4)
                .addAttribute('aAnim', buf, 0, false, 0, this.stride, 8 * 4)
                .addAttribute('aTextureId', buf, 0, false, 0, this.stride, 10 * 4)
                .addAttribute('aAnimDivisor', buf, 0, false, 0, this.stride, 11 * 4)
                .addAttribute('aAlpha', buf, 0, false, 0, this.stride, 12 * 4);
        }
    }

    class TileRenderer extends core.ObjectRenderer {
        constructor(renderer) {
            super(renderer);
            this.tileAnim = [0, 0];
            this.ibLen = 0;
            this.indexBuffer = null;
            this.textiles = [];
            this.shader = new TilemapShader(settings.TEXTURES_PER_TILEMAP);
            this.indexBuffer = new core.Buffer(undefined, true, true);
            this.checkIndexBuffer(2000);
            this.makeTextiles();
        }
        bindTileTextures(renderer, textures) {
            const len = textures.length;
            const shader = this.shader;
            const maxTextures = settings.TEXTURES_PER_TILEMAP;
            const samplerSize = shader.uniforms.uSamplerSize;
            if (len > settings.TEXTILE_UNITS * maxTextures) {
                return;
            }
            if (settings.TEXTILE_UNITS <= 1) {
                for (let i = 0; i < textures.length; i++) {
                    const texture = textures[i];
                    if (!texture || !texture.valid) {
                        return;
                    }
                    renderer.texture.bind(textures[i], i);
                    samplerSize[i * 2] = 1.0 / textures[i].realWidth;
                    samplerSize[(i * 2) + 1] = 1.0 / textures[i].realHeight;
                }
            }
            else {
                this.makeTextiles();
                const usedTextiles = Math.ceil(len / settings.TEXTILE_UNITS);
                for (let i = 0; i < len; i++) {
                    const texture = textures[i];
                    if (texture && texture.valid) {
                        const resourceIndex = Math.floor(i / settings.TEXTILE_UNITS);
                        const tileIndex = i % settings.TEXTILE_UNITS;
                        this.textiles[resourceIndex].tile(tileIndex, texture);
                    }
                }
                for (let i = 0; i < usedTextiles; i++) {
                    renderer.texture.bind(this.textiles[i].baseTexture, i);
                    samplerSize[i * 2] = 1.0 / this.textiles[i].width;
                    samplerSize[(i * 2) + 1] = 1.0 / this.textiles[i].baseTexture.height;
                }
            }
            shader.uniforms.uSamplerSize = samplerSize;
        }
        start() {
        }
        createVb() {
            const geom = new TilemapGeometry();
            geom.addIndex(this.indexBuffer);
            geom.lastTimeAccess = Date.now();
            return geom;
        }
        getShader() { return this.shader; }
        destroy() {
            super.destroy();
            this.shader = null;
        }
        checkIndexBuffer(size, _vb = null) {
            const totalIndices = size * 6;
            if (totalIndices <= this.ibLen) {
                return;
            }
            let len = totalIndices;
            while (len < totalIndices) {
                len <<= 1;
            }
            this.ibLen = totalIndices;
            this.indexBuffer.update(utils.createIndicesForQuads(size, settings.use32bitIndex ? new Uint32Array(size * 6) : undefined));
        }
        makeTextiles() {
            if (settings.TEXTILE_UNITS <= 1) {
                return;
            }
            for (let i = 0; i < settings.TEXTILE_UNITS; i++) {
                if (this.textiles[i])
                    continue;
                const resource = new TextileResource();
                const baseTex = new core.BaseTexture(resource);
                baseTex.scaleMode = settings.TEXTILE_SCALE_MODE;
                baseTex.wrapMode = constants.WRAP_MODES.CLAMP;
                this.textiles[i] = resource;
            }
        }
    }
    core.Renderer.registerPlugin('tilemap', TileRenderer);

    // eslint-disable-next-line camelcase
    const pixi_tilemap = {
        CanvasTileRenderer,
        CompositeRectTileLayer: CompositeTilemap,
        CompositeTilemap,
        Constant,
        TextileResource,
        MultiTextureResource: TextileResource,
        RectTileLayer: Tilemap,
        Tilemap,
        TilemapShader,
        TilemapGeometry,
        RectTileShader: TilemapShader,
        RectTileGeom: TilemapGeometry,
        TileRenderer,
    };

    exports.CanvasTileRenderer = CanvasTileRenderer;
    exports.CompositeRectTileLayer = CompositeTilemap;
    exports.CompositeTilemap = CompositeTilemap;
    exports.Constant = Constant;
    exports.POINT_STRUCT_SIZE = POINT_STRUCT_SIZE;
    exports.RectTileLayer = Tilemap;
    exports.TextileResource = TextileResource;
    exports.TileRenderer = TileRenderer;
    exports.Tilemap = Tilemap;
    exports.TilemapGeometry = TilemapGeometry;
    exports.TilemapShader = TilemapShader;
    exports.fillSamplers = fillSamplers;
    exports.generateFragmentSrc = generateFragmentSrc;
    exports.pixi_tilemap = pixi_tilemap;
    exports.settings = settings;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
if (typeof _pixi_tilemap !== 'undefined') { Object.assign(this.PIXI.tilemap, _pixi_tilemap); }
//# sourceMappingURL=pixi-tilemap.umd.js.map
