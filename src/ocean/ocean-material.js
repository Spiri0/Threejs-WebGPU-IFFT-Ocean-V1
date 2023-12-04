import {THREE} from '../three-defs.js';
import {MeshBasicNodeMaterial, texture, attribute, uniform, vec3, vec4} from "three/nodes";
import {entity} from '../entity.js';
import {ocean_constants} from './ocean-constants.js';
import {vertexStageWGSL} from  '../../resources/shader/ocean/vertexStageWGSL.js';
import {fragmentStageWGSL} from  '../../resources/shader/ocean/fragmentStageWGSL.js';


export const ocean_material = (() => {

	class OceanMaterial extends entity.Component {
		constructor(params) {
			super();    	
			this.Init(params);
		}

		Init(params) {
  
            const loader = new THREE.TextureLoader();
            const noiseTexture = loader.load("./resources/textures/simplex-noise.png");
            const testTexture = loader.load("./resources/textures/uv_grid_opengl.jpg");

            
            
            const wgslShaderParams = {
                time: uniform(0),
                cameraPosition: uniform(new THREE.Vector3()),
                wMatrix: uniform(new THREE.Matrix4()),
                oceanSize: ocean_constants.OCEAN_SIZE,
                minLodRadius: ocean_constants.QT_OCEAN_MIN_LOD_RADIUS,
                numLayers: ocean_constants.QT_OCEAN_MIN_NUM_LAYERS,
                gridResolution: ocean_constants.QT_OCEAN_MIN_CELL_RESOLUTION,
                vMorphedPosition: vertexStageWGSL.vMorphedPosition,
                vDisplacedPosition: vertexStageWGSL.vDisplacedPosition,
                vCascadeScales: vertexStageWGSL.vCascadeScales,
                vTexelCoord0: vertexStageWGSL.vTexelCoord0,
                vTexelCoord1: vertexStageWGSL.vTexelCoord1,
                vTexelCoord2: vertexStageWGSL.vTexelCoord2,
                vTexelCoord3: vertexStageWGSL.vTexelCoord3,
                position: attribute("position"),
                vindex: attribute("vindex"),
                width: attribute("width"),
                lod: attribute("lod"),
                noise: texture(noiseTexture),
                testTexture: texture(testTexture),
                noiseSampler: texture(noiseTexture),
                ifftResolution: uniform(params.ifftResolution),
                displacement0: texture(params.cascades[0].displacement),
                displacement1: texture(params.cascades[1].displacement),
                displacement2: texture(params.cascades[2].displacement),
                displacement3: texture(params.cascades[3].displacement),
                derivatives0: texture(params.cascades[0].derivative),
                derivatives1: texture(params.cascades[1].derivative),
                derivatives2: texture(params.cascades[2].derivative),
                derivatives3: texture(params.cascades[3].derivative),
                jacobian0: texture(params.cascades[0].jacobian),
                jacobian1: texture(params.cascades[1].jacobian),
                jacobian2: texture(params.cascades[2].jacobian),
                jacobian3: texture(params.cascades[3].jacobian),
                foamStrength: params.foamStrength,
                foamThreshold: params.foamThreshold,
                waveLengths: vec4(
                    params.cascades[0].params_.lengthScale,
                    params.cascades[1].params_.lengthScale,
                    params.cascades[2].params_.lengthScale,
                    params.cascades[3].params_.lengthScale,
                ),
                depthTexture: texture(params.depthTexture)
            }
        
            this.oceanMaterial = new MeshBasicNodeMaterial();
            this.oceanMaterial.positionNode = vertexStageWGSL.vertexStageWGSL(wgslShaderParams);
            this.oceanMaterial.colorNode = fragmentStageWGSL(wgslShaderParams);
            this.oceanMaterial.side = THREE.DoubleSide;
            
		}

    }

    return {
        OceanMaterial: OceanMaterial
    }

})();



