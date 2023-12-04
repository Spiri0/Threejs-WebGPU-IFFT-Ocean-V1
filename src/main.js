import {THREE, GUI, ShaderPass, FXAAShader} from './three-defs.js';
import {ShaderNode, MeshBasicNodeMaterial, SpriteNodeMaterial, texture, attribute} from "three/nodes";
import {entity} from './entity.js';
import {entity_manager} from './entity-manager.js';
import {threejs_component} from './threejs-component.js';
import { BasicController } from './basic-controller.js';
import {ocean} from './ocean/ocean.js';
import {wave_generator} from './waves/wave-generator.js';

import { testFS } from "../resources/shader/boxMaterial.js";



class Main {
    constructor(){
    }

	async Initialize() {   
		this.entityManager_ = new entity_manager.EntityManager();
		this.OnGameStarted();
	}

	OnGameStarted() {
        this.CreateGUI();
		this.clock_ = new THREE.Clock();
		this.LoadControllers();
		this.previousRAF = null;
		this.RAF();
	}

    CreateGUI() {
        this.guiParams = {
        };
        this.gui_ = new GUI();
        this.gui_.close();
    }

    LoadControllers() {
  
		const threejs = new entity.Entity();
    	threejs.AddComponent(new threejs_component.ThreeJSController());
    	this.entityManager_.Add(threejs, 'threejs');

        
    	this.scene_ = threejs.GetComponent('ThreeJSController').scene_;
    	this.camera_ = threejs.GetComponent('ThreeJSController').camera_;
        this.renderer_ = threejs.GetComponent('ThreeJSController').threejs_;
		//this.composer_ = threejs.GetComponent('ThreeJSController').composer_;  //depracted (webgl)
        this.threejs_ = threejs.GetComponent('ThreeJSController');

		const basicParams = {
			scene: this.scene_,
			camera: this.camera_,
		};

        this.camera_.position.set(0, 10, 0);
        this.camera_.rotation.x = -0.1 * Math.PI;
        this.scene_.position.set(0, 0, 0);
        this.player = new BasicController(basicParams);


		//------------------------------IFFT-Wave-Generator----------------------------------
		const WaveGenerator_ = new entity.Entity();
		WaveGenerator_.AddComponent(
			new wave_generator.WaveGenerator({
                container: this.threejs_.container,
                renderer: this.renderer_,
                camera: this.camera_,
				scene: this.scene_,
				clock: this.clock_,
                gui: this.gui_,
     	    })
        );
		this.entityManager_.Add(WaveGenerator_, 'waveGenerator');

		//----------------------------Multithreading-CDLOD-Ocean----------------------------
        
		this.ocean_ = new entity.Entity();
		this.ocean_.AddComponent(
			new ocean.OceanChunkManager({
				camera: this.camera_,
				scene: this.scene_,
				threejs: this.threejs_,
				sunpos: new THREE.Vector3(100000, 0, 100000), // not in use at moment, hardcoded in the shader
				clock: this.clock_,
                waveGenerator: WaveGenerator_.components_.WaveGenerator, 
                layer: 1,
                depthTexture: this.threejs_.depthTexture,
                gui: this.gui_,
                guiParams: this.guiParams
     	    })
        );
		this.entityManager_.Add(this.ocean_, 'ocean');


        /*
		//------Just a reference object so that I can compare the size of the waves-------
        const geometry = new THREE.BoxGeometry( 10, 4, 5 ); 
        const material = new MeshBasicNodeMaterial();
        material.colorNode = testFS({
            position: attribute("position"),
            normal: attribute("normal"),
        }); 
        const cube = new THREE.Mesh( geometry, material ); 
        cube.layers.set(0);
        cube.position.set(0, 0, -100);
        this.scene_.add( cube );
        
	    //----------------------------------------------------------------------------------
        */


        //-------------------------Texture-Viewers-----------------------------
        this.butterflyMaterial = new SpriteNodeMaterial();
        this.spectrumMaterial = new SpriteNodeMaterial();
        this.h0kMaterial = new SpriteNodeMaterial();
        this.pingMaterial = new SpriteNodeMaterial();
        this.pongMaterial = new SpriteNodeMaterial();
        this.displacement = new MeshBasicNodeMaterial();
        this.derivative = new SpriteNodeMaterial();
        this.DxDz = new SpriteNodeMaterial();
        this.DyDxz = new SpriteNodeMaterial();
        this.DyxDyz = new SpriteNodeMaterial();
        this.DxxDzz = new SpriteNodeMaterial();
        this.jacobian = new SpriteNodeMaterial();
        this.depthTexture = new SpriteNodeMaterial();

        this.butterflyMaterial.colorNode = texture(WaveGenerator_.components_.WaveGenerator.butterflyTexture);
        this.spectrumMaterial.colorNode = texture(WaveGenerator_.components_.WaveGenerator.cascades[2].spectrumTexture);
        this.h0kMaterial.colorNode = texture(WaveGenerator_.components_.WaveGenerator.cascades[1].h0k_Texture);
        this.pingMaterial.colorNode = texture(WaveGenerator_.components_.WaveGenerator.cascades[0].pingTexture);
        this.pongMaterial.colorNode = texture(WaveGenerator_.components_.WaveGenerator.cascades[0].pongTexture);
        this.displacement.colorNode = texture(WaveGenerator_.components_.WaveGenerator.cascades[3].displacement);
        this.derivative.colorNode = texture(WaveGenerator_.components_.WaveGenerator.cascades[3].derivative);
        this.DxDz.colorNode = texture(WaveGenerator_.components_.WaveGenerator.cascades[0].DxDz);
        this.DyDxz.colorNode = texture(WaveGenerator_.components_.WaveGenerator.cascades[0].DyDxz);
        this.DyxDyz.colorNode = texture(WaveGenerator_.components_.WaveGenerator.cascades[0].DyxDyz);
        this.DxxDzz.colorNode = texture(WaveGenerator_.components_.WaveGenerator.cascades[0].DxxDzz);
        this.jacobian.colorNode = texture(WaveGenerator_.components_.WaveGenerator.cascades[2].jacobian);


        //-----------------not working with r159--There will be a postprocessing node--------------
        //------------------------simply include the texture you want to view----------------------
        //-----------Be aware that not every texture is visible as they are data textures----------

        //this.composer_.addPass(new ShaderPass(this.butterflyMaterial));
        //this.composer_.addPass(new ShaderPass(this.spectrumMaterial));
        //this.composer_.addPass(new ShaderPass(this.h0kMaterial));
        //this.composer_.addPass(new ShaderPass(this.pingMaterial));
        //this.composer_.addPass(new ShaderPass(this.pongMaterial));
        //this.composer_.addPass(new ShaderPass(this.displacement));
        //this.composer_.addPass(new ShaderPass(this.derivative));
        //this.composer_.addPass(new ShaderPass(this.DxDz));
        //this.composer_.addPass(new ShaderPass(this.DyDxz));
        //this.composer_.addPass(new ShaderPass(this.DyxDyz));
        //this.composer_.addPass(new ShaderPass(this.DxxDzz));
        //this.composer_.addPass(new ShaderPass(this.jacobian));


        //--------------------------------------------------------------------------------------
    }


    MoveCameraToOrigin(){
        const currentCameraPosition = this.camera_.position.clone();
        this.scene_.position.sub(currentCameraPosition);
        this.camera_.position.set(0, 0, 0);
        
    }



	RAF() {
	
        requestAnimationFrame((t) => {
            if (this.previousRAF === null) {
                this.previousRAF = t;
            } 
            else {
                this.Step(t - this.previousRAF);

                /*
                const cameraPosition = new THREE.Vector3();
                const scenePosition = new THREE.Vector3();
                this.camera_.getWorldPosition(cameraPosition);
                this.scene_.getWorldPosition(scenePosition);
                document.getElementById("testfield7").value = cameraPosition.x;
                document.getElementById("testfield8").value = cameraPosition.y;
                document.getElementById("testfield9").value = cameraPosition.z;
                */

                /*
                const cameraDistance = this.camera_.position.length();
                if(cameraDistance >= 2000){
                    this.MoveCameraToOrigin();
                }
                */

                this.threejs_.Render();
                this.previousRAF = t;
            }
    
            setTimeout(() => {
                this.RAF();
            }, 1);
        });
    }
      
      
    Step(timeElapsed) { 
        const timeElapsedS = Math.min(1.0 / 60.0, timeElapsed * 0.001);
        this.player.Update(timeElapsedS);//hack, just a fast implementation
        this.entityManager_.Update(timeElapsedS, 0);
    }


}


export {Main};


