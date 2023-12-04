import {THREE} from '../three-defs.js';
import {entity} from '../entity.js';
import {ocean_constants} from './ocean-constants.js';
import {ocean_builder_threaded} from './ocean-builder-threaded.js';
import {quadtree} from './quadtree.js';
import {utils} from './utils.js';
import {ocean_material} from './ocean-material.js';

	

export const ocean = (() => {


	class OceanChunkManager extends entity.Component {
		constructor(params) {
			super();    	
			this.Init(params);
		}


		Init(params) {
			this.params_ = params;
			this.builder_ = new ocean_builder_threaded.OceanChunkRebuilder_Threaded();


			const oceanDatas = {
				cascades: this.params_.waveGenerator.cascades,
				waveLengths: this.params_.waveGenerator.waveLengths,
				foamStrength: this.params_.waveGenerator.foamStrength,
				foamThreshold: this.params_.waveGenerator.foamThreshold,
				ifftResolution: this.params_.waveGenerator.size,
				depthTexture: this.params_.depthTexture
			}

			this.material_ = new ocean_material.OceanMaterial(oceanDatas).oceanMaterial;

			this.InitOcean(params);
		}
     

		InitOcean(params) {
			this.group = new THREE.Group();
			params.scene.add(this.group);
			this.chunks_ = {};

			params.guiParams.ocean = {
				wireframe: false,
			}
			const oceanRollup = params.gui.addFolder("Ocean");
			oceanRollup.add(params.guiParams.ocean, "wireframe").onChange(() => {
				this.material_.wireframe = params.guiParams.ocean.wireframe;
			});
		}


		CreateOceanChunk(group, groupTransform, offset, width, resolution, lod) {
			const params = {
				group: group,
				transform: groupTransform,
				width: width,
				offset: offset,
				resolution: resolution,
				lod: lod,
				layer: this.params_.layer,
				material: this.material_
			};

			return this.builder_.AllocateChunk(params);
		}


		Update(_) {
			const cameraPosition = new THREE.Vector3();
			const scenePosition = new THREE.Vector3();
			this.params_.camera.getWorldPosition(cameraPosition);
			this.params_.scene.getWorldPosition(scenePosition);
			const tempCameraPosition = cameraPosition.clone();
			const relativeCameraPosition = tempCameraPosition.sub(scenePosition);

			/*
			const cameraDistance = cameraPosition.length();
			document.getElementById("testfield1").value = cameraPosition.x;
			document.getElementById("testfield2").value = cameraPosition.y;
			document.getElementById("testfield3").value = cameraPosition.z;
			document.getElementById("testfield4").value = cameraDistance;
			document.getElementById("testfield5").value = cameraPosition.y - scenePosition.y;
			*/


			this.builder_.Update();
      		if (!this.builder_.Busy) {
				for (let k in this.chunks_) {
          			this.chunks_[k].chunk.Show();
        		}
        		this.UpdateVisibleChunks_Quadtree_(cameraPosition, scenePosition, relativeCameraPosition);       
      		}

      		for (let k in this.chunks_) {
				this.chunks_[k].chunk.Update(relativeCameraPosition);
      		}
      		for (let c of this.builder_.old_) {
				c.chunk.Update(relativeCameraPosition);
      		}

			this.material_.positionNode.parameters.cameraPosition.value = relativeCameraPosition;
			this.material_.colorNode.parameters.cameraPosition.value = relativeCameraPosition;
			this.material_.colorNode.parameters.time.value = 0.01;
  
		}//end Update


		UpdateVisibleChunks_Quadtree_(cameraPosition, scenePosition, relativeCameraPosition) {


			function _Key(c) {
				return c.position[0] + '/' + c.position[1] + ' [' + c.size + ']';
			}

			const q = new quadtree.Root({
				size: ocean_constants.OCEAN_SIZE,
				min_lod_radius: ocean_constants.QT_OCEAN_MIN_LOD_RADIUS,
				lod_layers: ocean_constants.QT_OCEAN_MIN_NUM_LAYERS,
				min_node_size: ocean_constants.QT_OCEAN_MIN_CELL_SIZE,
			});

			q.Insert(relativeCameraPosition);
			//q.Insert(cameraPosition);

			const sides = q.GetChildren();

			let newOceanChunks = {};
			const center = new THREE.Vector3();
			const dimensions = new THREE.Vector3();

			const _Child = (c) => {
				c.bounds.getCenter(center);
				c.bounds.getSize(dimensions);

				const child = {
					group: this.group,
					transform: sides.transform,
					position: [center.x, center.y, center.z],
					bounds: c.bounds,
					size: dimensions.x,
					lod: c.lod,
				};
				return child;
			};


				for (let c of sides.children) {
					const child = _Child(c);
					const k = _Key(child);
					
					newOceanChunks[k] = child;
				}


			const allChunks = newOceanChunks;
			const intersection = utils.DictIntersection(this.chunks_, newOceanChunks);
			const difference = utils.DictDifference(newOceanChunks, this.chunks_);
			const recycle = Object.values(utils.DictDifference(this.chunks_, newOceanChunks));

			const allChunksLeft = utils.DictIntersection(newOceanChunks, recycle);

			if (0) {
				const partialRebuilds = {};
				
				for (let k in partialRebuilds) {
					if (k in intersection) {
						recycle.push(this.chunks_[k]);
						delete intersection[k];
						difference[k] = allChunks[k];
					}
				}
			}

			this.builder_.RetireChunks(recycle);

			newOceanChunks = intersection;
			

			for (let k in difference) {
				const [xp, yp, zp] = difference[k].position;

				const offset = new THREE.Vector3(xp, yp, zp);
				
				newOceanChunks[k] = {
					position: [xp, zp],
					chunk: this.CreateOceanChunk(
						difference[k].group, 
						difference[k].transform,
						offset, 
						difference[k].size,
						ocean_constants.QT_OCEAN_MIN_CELL_RESOLUTION,
						difference[k].lod,
					),
				};					
			}

			this.chunks_ = newOceanChunks;
		}
 
	}//end class



return {
	OceanChunkManager: OceanChunkManager,
}

})();