import * as THREE from 'three';
// import FBXLoader from 'three-fbxloader-offical';
import FBXLoader from './FBXLoader';

export default class Player {
  constructor(game, options = {}, callback) {
    this.callback = callback; // Triggered after the loading...
    this.game = game;

    this.model = options['model'] || "FireFighter";
    this.colour = options['colour'] || "White";
    this.anims = options['anims'] || [];
    this.colliders = options['colliders'] || [];

    this.animations = {};

    this.assetsPath = '/fbx/';
    this.object = new THREE.Object3D();
    this.motion;
    this.action;
    this.cameras;

    this.x = options['x'] || 3122;
    this.y = options['y'] || 0;
    this.z = options['z'] || -173;
    this.h = options['h'] || 2.6;
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

      this.object.position.set(this.x, this.y, this.z);
      this.object.quaternion.setFromEuler( this.euler );

      this.object.add(object);
      this.animations.Idle = object.animations[0];
      
      // this.loadNextAnim(loader);

      console.log(`Model ${this.model} loaded`);
      this.callback();
      delete this.anims;
      this.action = this.initialAction;

    }, undefined, e =>console.log(e));
  }

  // loadNextAnim(loader){
	// 	let anim = this.anims.pop();
  //   loader.load( `${this.assetsPath}anims/${anim}.fbx`, object => {
	// 		this.animations[anim] = object.animations[0];
	// 		if (this.anims.length>0){
  //       this.loadNextAnim(loader);
	// 		} else {
  //       console.log(`Model ${this.model} loaded`);
  //       this.callback();
  //       delete this.anims;
  //       this.action = this.initialAction;
	// 		}
	// 	}, undefined, e => console.log(e));
  // }

  // set action(name){
	// 	const action = this.mixer.clipAction(this.animations[name]);
  //   action.time = 0;
	// 	this.mixer.stopAllAction();
	// 	this.actionTime = Date.now();
  //   this.actionName = name;
		
	// 	action.fadeIn(0.5);	
	// 	action.play();
	// }
    
  set action(name){
    if (this.actionName == name) return;

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

  // move(dt){	
  //   if (this.motion.forward>0) {
  //     const speed = (this.action=='Running') ? 400 : 150;
  //     this.object.translateZ(dt*speed);
  //   }else{
  //     this.object.translateZ(-dt*30);
  //   }
  //   this.object.rotateY(this.motion.turn*dt);
  // }

  move(dt){	
    const pos = this.object.position.clone();
		pos.y += 60;
		let dir = new THREE.Vector3();
		this.object.getWorldDirection(dir);
		if (this.motion.forward<0) dir.negate();
		let raycaster = new THREE.Raycaster(pos, dir);
		let blocked = false;
		const colliders = this.game.colliders;
	
		if (colliders!==undefined){ 
			const intersect = raycaster.intersectObjects(colliders);
			if (intersect.length>0){
				if (intersect[0].distance<50) blocked = true;
			}
		}
		
		if (!blocked){
			if (this.motion.forward>0){
				const speed = (this.action=='Running') ? 500 : 150;
				this.object.translateZ(dt*speed);
			}else{
				this.object.translateZ(-dt*30);
			}
		}
		
		if (colliders!==undefined){
			//cast left
			dir.set(-1,0,0);
			dir.applyMatrix4(this.object.matrix);
			dir.normalize();
			raycaster = new THREE.Raycaster(pos, dir);

			let intersect = raycaster.intersectObjects(colliders);
			if (intersect.length>0){
				if (intersect[0].distance<50) this.object.translateX(100-intersect[0].distance);
			}
			
			//cast right
			dir.set(1,0,0);
			dir.applyMatrix4(this.object.matrix);
			dir.normalize();
			raycaster = new THREE.Raycaster(pos, dir);

			intersect = raycaster.intersectObjects(colliders);
			if (intersect.length>0){
				if (intersect[0].distance<50) this.object.translateX(intersect[0].distance-100);
			}
			
			//cast down
			dir.set(0,-1,0);
			pos.y += 200;
			raycaster = new THREE.Raycaster(pos, dir);
			const gravity = 30;

			intersect = raycaster.intersectObjects(colliders);
			if (intersect.length>0){
				const targetY = pos.y - intersect[0].distance;
				if (targetY > this.object.position.y){
					//Going up
					this.object.position.y = 0.8 * this.object.position.y + 0.2 * targetY;
					this.velocityY = 0;
				}else if (targetY < this.object.position.y){
					//Falling
					if (this.velocityY==undefined) this.velocityY = 0;
					this.velocityY += dt * gravity;
					this.object.position.y -= this.velocityY;
					if (this.object.position.y < targetY){
						this.velocityY = 0;
						this.object.position.y = targetY;
					}
				}
			}
		}
		
		this.object.rotateY(this.motion.turn*dt);
  }
}