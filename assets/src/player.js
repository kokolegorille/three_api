import * as THREE from 'three';
// import FBXLoader from 'three-fbxloader-offical';
import FBXLoader from './FBXLoader';

export default class Player {
  constructor(options = {}, callback) {
    this.callback = callback; // Triggered after the loading...
    
    this.model = options['model'] || "FireFighter";
    this.colour = options['colour'] || "White";

    this.anims = options['anims'] || [];

    this.assetsPath = `/fbx/`;
    this.object = new THREE.Object3D();
    this.motion;
    this.action;
    this.cameras;
    this.animations = {};

    this.x = options['x'] || 0;
    this.y = options['y'] || 0;
    this.z = options['z'] || 0;

    this.h = options['h'] || 0;
    this.pb = options['pb'] || 0;
    this.euler = new THREE.Euler(this.pb, this.h, this.pb);
    this.initialAction = options['action'] || 'Idle';
    this.id;

    this.init();
  }

  init() {
    console.log(`Loading model ${this.model}`);

    const loader = new FBXLoader();

    loader.load(`${this.assetsPath}people/${this.model}.fbx`, object => {
      object.mixer = new THREE.AnimationMixer( object );
      this.mixer = object.mixer;
      this.root = object.mixer.getRoot();
      object.name = this.model;
      
      object.traverse(child => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = false;
        }
      });

			const textureLoader = new THREE.TextureLoader();
			
			textureLoader.load(`/images/SimplePeople_${this.model}_${this.colour}.png`, function(texture){
				object.traverse( function ( child ) {
					if ( child.isMesh ){
						child.material.map = texture;
					}
				} );
			});

      // this.object.position.set(0, 0, 0);
      this.object.position.set(this.x, this.y, this.z);

      // this.object.rotation.set(0, 0, 0);
      this.object.quaternion.setFromEuler( this.euler );

      this.object.add(object);
      this.animations.Idle = object.animations[0];
      
      this.loadNextAnim(loader);
    }, undefined, e =>console.log(e));
  }

  loadNextAnim(loader){
		let anim = this.anims.pop();
    loader.load( `${this.assetsPath}anims/${anim}.fbx`, object => {
			this.animations[anim] = object.animations[0];
			if (this.anims.length>0){
        this.loadNextAnim(loader);
			} else {
        console.log(`Model ${this.model} loaded`);
        this.callback();
        delete this.anims;
        this.action = this.initialAction;
			}
		}, undefined, e => console.log(e));
  }

  set action(name){
		const action = this.mixer.clipAction(this.animations[name]);
    action.time = 0;
		this.mixer.stopAllAction();
		this.actionTime = Date.now();
    this.actionName = name;
		
		action.fadeIn(0.5);	
		action.play();
	}
    
  get action(){
    if (this===undefined || this.actionName===undefined) return "";
    return this.actionName;
  }

  move(dt){	
    if (this.motion.forward>0) {
      const speed = (this.action=='Running') ? 400 : 150;
      this.object.translateZ(dt*speed);
    }else{
      this.object.translateZ(-dt*30);
    }
    this.object.rotateY(this.motion.turn*dt);
  }
}