import * as THREE from 'three';
// import FBXLoader from 'three-fbxloader-offical';
import FBXLoader from './libs/FBXLoader';

export default class Player {
  constructor(game, options = {}, callback) {
    this.callback = callback; // Triggered after the loading...
    this.game = game;

    this.id = options['id'];
    this.model = options['model'] || "FireFighter";
    this.colour = options['colour'] || "White";
    this.anims = options['anims'] || [];
    this.colliders = options['colliders'] || [];
    this.collider = [];

    this.animations = this.game.animations;

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
    this.local = false;
    this.init();
  }

  init() {
    console.log(`Loading model ${this.model}`);

    const loader = new FBXLoader();

    loader.load(`${this.assetsPath}people/${this.model}.fbx`, object => {
      object.mixer = new THREE.AnimationMixer( object );
      this.mixer = object.mixer;
      // this.root = object.mixer.getRoot();
      this.root = object;
      object.name = this.model;
      
      object.traverse(child => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = false;
        }
      });

			const textureLoader = new THREE.TextureLoader();
			
			textureLoader.load(`/images/SimplePeople_${this.model}_${this.colour}.png`, texture => {
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

      console.log(`Model ${this.model} loaded`);
      delete this.anims;
      this.action = this.initialAction;

      // Add a box mesh to remote player only, for raycaster detection!
      if (!this.local) {
        const geometry = new THREE.BoxGeometry(100,300,100);
        const material = new THREE.MeshBasicMaterial({visible:false});
        const box = new THREE.Mesh(geometry, material);
        box.name = "Collider";
        box.position.set(0, 150, 0);
        this.object.add(box);
        this.collider = box;
      }
      
      this.callback(this);

    }, undefined, e =>console.log(e));
  }
    
  set action(name){
    if (this.actionName == name) return;
    const clip = (this.local) ? 
      this.animations[name] : 
      THREE.AnimationClip.parse(THREE.AnimationClip.toJSON(this.animations[name])); 

		const action = this.mixer.clipAction(clip);
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

  // ONLY FOR LOCAL PLAYER
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

  // ONLY FOR REMOTE PLAYER
  update(delta, data) {
    this.mixer.update(delta);
    this.object.position.set( data.x, data.y, data.z );
		const euler = new THREE.Euler(data.pb, data.h, data.pb);
		this.object.quaternion.setFromEuler( euler );
    
    const newAction = data.action || 'Idle'; 
    if (this.action !== newAction) this.action = newAction;
  }
}