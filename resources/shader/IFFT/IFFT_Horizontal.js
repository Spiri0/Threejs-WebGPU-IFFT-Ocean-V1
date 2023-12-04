import {wgslFn} from "three/nodes";


export const IFFT_HorizontalWGSL = wgslFn(`

    fn computeWGSL( 
        writeTex: texture_storage_2d<rgba32float, write>,
        readTex: texture_2d<f32>,
        butterfly: texture_2d<f32>,
        index: u32,
        size: f32,
        step: f32,
    ) -> void {

        var posX = f32(index) % size;
        var posY = floor(f32(index) / size);
        var idx = vec2i(i32(posX), i32(posY));

        var data = textureLoad(butterfly, vec2<i32>(i32(step), idx.x), 0);
        var even = textureLoad(readTex, vec2<i32>(i32(data.z), idx.y), 0).rg;
        var odd = textureLoad(readTex, vec2<i32>(i32(data.w), idx.y), 0).rg;

        var H: vec2<f32> = even + multiplyComplex(data.rg, odd.xy);

        textureStore(writeTex, idx, vec4<f32>(H, 0, 1));
    }

    const PI: f32 = 3.141592653589793;

    fn multiplyComplex(a: vec2<f32>, b: vec2<f32>) -> vec2<f32> {
        return vec2<f32>(a.x * b.x - a.y * b.y, a.y * b.x + a.x * b.y);
    }            
`);

