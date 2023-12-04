import {wgslFn} from "three/nodes";


export const fragmentStageWGSL = wgslFn(`

    fn WGSLColor(
        cameraPosition: vec3<f32>,
        position: vec3<f32>,
        oceanSize: f32,
        minLodRadius: f32,
        numLayers: f32,
        gridResolution: f32,
        vindex: i32,
        width: f32,
        lod: f32,
        time: f32,
        derivatives0: texture_2d<f32>,
        derivatives1: texture_2d<f32>,
        derivatives2: texture_2d<f32>,
        derivatives3: texture_2d<f32>,
        jacobian0: texture_2d<f32>,
        jacobian1: texture_2d<f32>, 
        jacobian2: texture_2d<f32>,
        jacobian3: texture_2d<f32>,
        noise: texture_2d<f32>,
        testTexture: texture_2d<f32>,
        waveLengths: vec4<f32>,
        ifftResolution: f32,
        foamStrength: f32,
        foamThreshold: f32,
        vMorphedPosition: vec3<f32>,
        vDisplacedPosition: vec3<f32>,
        vCascadeScales: vec4<f32>,
        vTexelCoord0: vec2<f32>,
        vTexelCoord1: vec2<f32>,
        vTexelCoord2: vec2<f32>,
        vTexelCoord3: vec2<f32>,
        depthTexture: texture_2d<f32>
    ) -> vec4<f32> {

        var r = 0.;
        var g = 0.;
        var b = 0.;

        if(lod == 0 || lod == 3 || lod == 6 || lod == 9 || lod == 12 ){
            r = 1.;
            g = 0.05;
            b = 0.05;
        }
        if(lod == 1 || lod == 4 || lod == 7 || lod == 10 || lod == 13 ){
            g = 1.;
        }				
        if(lod == 2 || lod == 5 || lod == 8 || lod == 11 || lod == 14 ){
            r = 0.05;
            g = 0.05;
            b = 1.;
        }
    


        var vViewVector = vDisplacedPosition - cameraPosition;
        var vViewDist = length(vViewVector);
        var viewDir = normalize(vViewVector);

        var jacobi0: f32 = findNearestTexelsAndInterpolate(jacobian0, vTexelCoord0, ifftResolution).x;
        var jacobi1: f32 = findNearestTexelsAndInterpolate(jacobian1, vTexelCoord1, ifftResolution).x;
        var jacobi2: f32 = findNearestTexelsAndInterpolate(jacobian2, vTexelCoord2, ifftResolution).x;
        var jacobi3: f32 = findNearestTexelsAndInterpolate(jacobian3, vTexelCoord3, ifftResolution).x;

        var Normal_0: vec4<f32> = findNearestTexelsAndInterpolate(derivatives0, vTexelCoord0, ifftResolution) * vCascadeScales.x;
        var Normal_1: vec4<f32> = findNearestTexelsAndInterpolate(derivatives1, vTexelCoord1, ifftResolution) * vCascadeScales.y;
        var Normal_2: vec4<f32> = findNearestTexelsAndInterpolate(derivatives2, vTexelCoord2, ifftResolution) * vCascadeScales.z;
        var Normal_3: vec4<f32> = findNearestTexelsAndInterpolate(derivatives3, vTexelCoord3, ifftResolution) * vCascadeScales.w;
 
        var derivatives: vec4<f32> = normalize(Normal_0 + Normal_1 + Normal_2 + Normal_3);
        var slope: vec2<f32> = vec2<f32>(derivatives.x / (1.0 + derivatives.z), derivatives.y / (1.0 + derivatives.w));
        var normalOcean: vec3<f32> = normalize(vec3(-slope.x, 1.0, -slope.y));

        if(dot(normalOcean, -viewDir) < 0.0){
            normalOcean *= -1.0;
        }

        //----------------------------------------------------------------------------------------------------------------

        var testTex = findNearestTexelsAndInterpolate(testTexture, vTexelCoord1, 1024).rgb;

        //var foam_mix_strength: f32 = 2.0;
        //var foam_jacobian_limit: f32 = 3.6;

        var jakobian: f32 = jacobi0 + jacobi1 + jacobi2 + jacobi3;
        var foam_mix_factor: f32 = min(1, max(0, (-jakobian + foamThreshold) * foamStrength));


        var sunDir: vec3<f32> = normalize(vec3<f32>(0, 0.5, -1));

        var diffuse = diffuseLight(normalOcean, sunDir, 1, 1);
        var fresnel = fresnelSchlick(0.02, normalOcean, -viewDir, 5);
        var specular = specularLight(normalOcean, sunDir, viewDir, 60);

        var skyColor = getSkyColor(reflect(normalOcean, viewDir)) * SKYCOLOR * 1.25;

        var reflectionColor = skyColor;
        var refractionColor = SEACOLOR;
        var waterColor = mix(refractionColor, reflectionColor, fresnel);

        var atten: f32 = max(1.0 - vViewDist * vViewDist * 0.001, 0.0);
        waterColor += WAVECOLOR * saturate(vDisplacedPosition.y - 0.0) * 0.1 * atten;
        var oceanColor = waterColor;


        //oceanColor += vec3<f32>(1, 0.859, 0.78) * specular;

        
        oceanColor = mix(oceanColor, vec3<f32>(1), foam_mix_factor);


        //var gamma: f32 = 1;
        //oceanColor = pow(oceanColor, vec3<f32>(1/gamma));


        //return vec4<f32>(r, g, b, 1.0);


        return vec4<f32>(oceanColor, 1);
        //return vec4<f32>(vViewVector, 1);
        //return vec4<f32>(normalOcean, 1);
        //return vec4<f32>(vec3(1) * (-0.9-jakobian)*0.2, 1);
        //return vec4<f32>(vPosition/100, 1);
        
    }


 
    const SKYCOLOR: vec3<f32> = vec3<f32>(0.196, 0.588, 0.785);
    const SEACOLOR: vec3<f32> = vec3<f32>(0.004, 0.016, 0.047)*3;
    const WAVECOLOR: vec3<f32> = vec3<f32>(0.14, 0.25, 0.18);

    //var shallowColor = vec3<f32>(0.0, 0.729, 0.988);
    //var deepColor = vec3<f32>(0.004, 0.016, 0.047);
    //var diffuseColor = vec3<f32>(0.014, 0.026, 0.047);


    fn reflect(N: vec3<f32>, L: vec3<f32>) -> vec3<f32> {
        return L - 2 * dot(L, N) * N;
    }

    
    fn getSkyColor(rayDir: vec3<f32>) -> vec3<f32> {
        return mix(vec3(1), mix(SKYCOLOR, 0.2 * SKYCOLOR, rayDir.y), smoothstep(-0.5, 0.25, rayDir.y));
    }


    fn saturate(value: f32) -> f32 {
       return max(0, min(value, 1)); 
    }


    fn diffuseLight(N: vec3<f32>, L: vec3<f32>, strength: f32, e: f32) -> f32 {
        return pow(dot(N, L) * strength + (1 - strength), e);
    }


    fn specularLight(N: vec3<f32>, L: vec3<f32>, V: vec3<f32>, e: f32) -> f32 {
        var specularTerm: f32 = 0;

        //+ vec3<f32>(0,10,0)

        var R = reflect(N , L);
        var nrm: f32 = (e + 8.0) / (3.1415 * 8.0);
        specularTerm = pow(max(dot(R, V), 0), e) * nrm;

        return specularTerm;
    }

    
    fn fresnelSchlick(F: f32, N: vec3<f32>, V: vec3<f32>, exp: f32) -> f32 {
        return F + (1 - F) * pow(saturate(1 - dot(N, V)), exp);
    }


    fn HDR(color: vec3<f32>, e: f32) -> vec3<f32> {
        return (vec3<f32>(1) - exp(-color * e));
    }


    fn findNearestTexelsAndInterpolate(texture: texture_2d<f32>, position: vec2<f32>, size: f32) -> vec4<f32> {

        var weights: vec2<f32> = abs(fract(position));

        var texCoord0 = floor(position) % size;
        var texCoord1 = vec2<f32>(ceil(position.x), floor(position.y)) % size;
        var texCoord2 = vec2<f32>(floor(position.x), ceil(position.y)) % size;
        var texCoord3 = ceil(position) % size;

        var offset = size - 1;

        if(texCoord0.x < 0){texCoord0.x = offset + texCoord0.x;}
        if(texCoord0.y < 0){texCoord0.y = offset + texCoord0.y;}
        if(texCoord1.x < 0){texCoord1.x = offset + texCoord1.x;}
        if(texCoord1.y < 0){texCoord1.y = offset + texCoord1.y;}
        if(texCoord2.x < 0){texCoord2.x = offset + texCoord2.x;}
        if(texCoord2.y < 0){texCoord2.y = offset + texCoord2.y;}
        if(texCoord3.x < 0){texCoord3.x = offset + texCoord3.x;}
        if(texCoord3.y < 0){texCoord3.y = offset + texCoord3.y;}


        var texel0 = textureLoad(texture, vec2<i32>(texCoord0), 0);
        var texel1 = textureLoad(texture, vec2<i32>(texCoord1), 0);
        var texel2 = textureLoad(texture, vec2<i32>(texCoord2), 0);
        var texel3 = textureLoad(texture, vec2<i32>(texCoord3), 0);


        var interp1 = mix(texel0, texel1, weights.x);
        var interp2 = mix(texel2, texel3, weights.x);
        var interpolatedValue = mix(interp1, interp2, weights.y);

        return interpolatedValue;
    }   




    fn sumV(v: vec3<f32>) -> f32 {
        return v.x + v.y + v.z;
    }


    fn random(par: vec2<f32>) -> f32 {
        return fract(sin(dot(par, vec2<f32>(12.9898, 78.233))) * 43758.5453);
    }


    fn tileBreaker(noise: texture_2d<f32>, texture: texture_2d<f32>, position: vec2<f32>, size:f32, scale: f32, waveLength: f32) -> vec4<f32> {
 
        var k: f32 = findNearestTexelsAndInterpolate(noise, 0.005 * position, size).x;

        var l: f32 = k * 8;
        var f: f32 = fract(l);

        var ia: f32 = floor(l + 0.5);
        var ib: f32 = floor(l);
        f = min(f, 1 - f) * 2;

        var offa: vec2<f32> = sin(vec2<f32>(3, 7) * ia);
        var offb: vec2<f32> = sin(vec2<f32>(3, 7) * ib);

        var texCoordA = (position + offa * size);
        var texCoordB = (position + offb * size);

        var cola = findNearestTexelsAndInterpolate(texture, scale/waveLength*texCoordA, size);
        var colb = findNearestTexelsAndInterpolate(texture, scale/waveLength*texCoordB, size);

        return mix(cola, colb, smoothstep(0.2, 0.8, f - 0.1 * sumV(cola.xyz - colb.xyz)));

        //return vec4<f32>(k, k, k, k);
    }


`);


