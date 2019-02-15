import * as THREE from 'three';
import WEBGL from './WebGL';
import Orbit from 'three-orbit-controls';
const OrbitControls = Orbit(THREE);

import {JoyStick, Preloader} from './toon3d';
import LocalPlayer from './local_player';
import FBXLoader from './FBXLoader';

const ModeEnum = {
  NONE: 1,
  PRELOAD: 2,
  INITIALISING: 3,
  LOADED: 4,
};

const COLOURS = [
  'Black', 'Brown', 'White'
];

const PEOPLE = [
  'BeachBabe', 'BusinessMan', 'Doctor', 'FireFighter', 'Housewife', 
  'Policeman', 'Prostitute', 'Punk', 'RiotCop', 'Roadworker', 
  'Robber', 'Sheriff', 'Streetman', 'Waitress'
];

export default class Game {
  constructor() {
    if (!WEBGL.isWebGLAvailable()) {
      const warning = WEBGL.getWebGLErrorMessage();
      document.body.appendChild(warning);
      return false;
    };
    this.mode = ModeEnum.NONE;

    // Container
    this.container = document.createElement( 'div' );
		this.container.style.height = '100%';
    document.body.appendChild( this.container );
    
    this.clock = new THREE.Clock();

    this.anims = [
      'Walking', 'Walking Backwards', 'Running', 
      'Left Turn', 'Right Turn', 
      'Pointing', 'Pointing Gesture', 
      // 'Samba Dancing',
      'Belly Dance',
    ];
    this.assetsPath = '/fbx/';

    this.mode = ModeEnum.PRELOAD;

    const game = this;
    const options = {
			assets:[
				`/images/nx.jpg`,
				`/images/px.jpg`,
				`/images/ny.jpg`,
				`/images/py.jpg`,
				`/images/nz.jpg`,
				`/images/pz.jpg`
			],
			oncomplete: function(){
				game.init();
			}
		}
    this.anims.forEach(anim => options.assets.push(`${this.assetsPath}anims/${anim}.fbx`));
		options.assets.push(`${this.assetsPath}town.fbx`);
    const preloader = new Preloader(options);

    this.id;

    // this.init();
  }

  init() {
    this.mode = ModeEnum.INITIALISING;

    this.camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 10, 20000 );
    this.camera.position.set(112, 100, 600);
    
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color( 0xa0a0a0 );
    this.scene.fog = new THREE.Fog( 0xa0a0a0, 1000, 5000 );

		this.scene.add( this.createHemisphereLight() );

    this.sun = this.createSun();
    this.scene.add( this.sun );
    
    // this.scene.add( this.createGround() );
    // this.scene.add( this.createGrid() );

    // Define a clojure for this.handlePlayerLoaded!
    const game = this;
    const model = PEOPLE[Math.floor(Math.random()*PEOPLE.length)];
    const colour = COLOURS[Math.floor(Math.random()*COLOURS.length)];

    this.player = new LocalPlayer(
      this, 
      {
        model, 
        colour, 
        anims: this.anims,
        colliders: this.colliders,
      }, 
      this.handlePlayerLoaded
    );
    this.scene.add(this.player.object);

    // Environment
    const loader = new FBXLoader();
    this.loadEnvironment(loader);

    this.renderer = new THREE.WebGLRenderer( { antialias: true } );
    this.renderer.setPixelRatio( window.devicePixelRatio );
    this.renderer.setSize( window.innerWidth, window.innerHeight );
    this.renderer.shadowMap.enabled = true;
    this.container.appendChild( this.renderer.domElement );

    // // Orbit controls
    // this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    // this.controls.target.set(0, 150, 0);
    // this.controls.update();

    if ('ontouchstart' in window){
			window.addEventListener( 'touchdown', event => this.onMouseDown(event), false );
		}else{
			window.addEventListener( 'mousedown', event => this.onMouseDown(event), false );	
		}
    window.addEventListener( 'resize', () => this.onWindowResize(), false );

    this.render();
  }

  handlePlayerLoaded() {
    game.joystick = game.createJoystick();
    game.createCameras();
    console.log(game.id)
  }

  loadEnvironment(loader){
		const game = this;
		loader.load(`/fbx/town.fbx`, object => {
			game.environment = object;
			game.colliders = [];
			game.scene.add(object);
			object.traverse( function ( child ) {
				if ( child.isMesh ) {
					if (child.name.startsWith("proxy")){
						game.colliders.push(child);
						child.material.visible = false;
					}else{
						child.castShadow = true;
						child.receiveShadow = true;
					}
				}
			} );
			
			const tloader = new THREE.CubeTextureLoader();
			tloader.setPath( `${game.assetsPath}/images/` );

			var textureCube = tloader.load( [
				'px.jpg', 'nx.jpg',
				'py.jpg', 'ny.jpg',
				'pz.jpg', 'nz.jpg'
			] );

			game.scene.background = textureCube;
			
			game.loadNextAnim(loader);
		})
	}

	loadNextAnim(loader){
		let anim = this.anims.pop();
		const game = this;
		loader.load( `/fbx/anims/${anim}.fbx`, function( object ){
			game.player.animations[anim] = object.animations[0];
			if (game.anims.length>0){
				game.loadNextAnim(loader);
			}else{
				delete game.anims;
				game.action = "Idle";
				game.mode = ModeEnum.LOADED;
				game.animate();
			}
		});	
	}

  createHemisphereLight() {
    let light = new THREE.HemisphereLight( 0xffffff, 0x444444 );
    light.position.set( 0, 200, 0 );
    return light;
  }

  createSun() {
    let light = new THREE.DirectionalLight( 0xffffff );
    light.position.set( 30, 100, 40 );
    light.target.position.set( 0, 0, 0 );
    light.castShadow = true;

		const lightSize = 500;
    light.shadow.camera.near = 1;
    light.shadow.camera.far = 500;
		light.shadow.camera.left = light.shadow.camera.bottom = -lightSize;
		light.shadow.camera.right = light.shadow.camera.top = lightSize;

    light.shadow.bias = 0.0039;
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;
    return light;
  }

  // createGround() {
  //   let ground = new THREE.Mesh( 
  //     new THREE.PlaneBufferGeometry( 10000, 10000 ), 
  //     new THREE.MeshPhongMaterial( { color: 0x999999, depthWrite: false } ) 
  //   );
	// 	ground.rotation.x = - Math.PI / 2;
  //   ground.receiveShadow = true;
  //   return ground;
  // }

  // createGrid() {
  //   let grid = new THREE.GridHelper( 5000, 40, 0x000000, 0x000000 );
	// 	grid.material.opacity = 0.2;
  //   grid.material.transparent = true;
  //   return grid;
  // }

  createJoystick() {
    return new JoyStick({
      onMove: this.playerControl,
      game: this
    });
  }

  createCameras(){
		const offset = new THREE.Vector3(0, 80, 0);
		const front = new THREE.Object3D();
		front.position.set(112, 100, 600);
		front.parent = this.player.object;
		const back = new THREE.Object3D();
		back.position.set(0, 300, -600);
    back.parent = this.player.object;
    const chat = new THREE.Object3D();
		chat.position.set(0, 200, -450);
		chat.parent = this.player.object;
		const wide = new THREE.Object3D();
		wide.position.set(178, 139, 1665);
		wide.parent = this.player.object;
		const overhead = new THREE.Object3D();
		overhead.position.set(0, 400, 0);
		overhead.parent = this.player.object;
		const collect = new THREE.Object3D();
		collect.position.set(40, 82, 94);
		collect.parent = this.player.object;
		this.player.cameras = { front, back, wide, overhead, collect, chat };
		this.player.activeCamera = this.player.cameras.back;	
  }

  playerControl(forward, turn){
    turn = -turn;
		if (forward>0.3){
			if (this.player.action != 'Walking' && this.player.action != 'Running') this.player.action = 'Walking';
		} else if (forward<-0.3){
			if (this.player.action != 'Walking Backwards') this.player.action = 'Walking Backwards';
		} else {
      forward = 0;
      if (turn>0.1){
        if (this.player.action != 'Left Turn') this.player.action = 'Left Turn';
      } else if (turn<-0.1) {
        if (this.player.action != 'Right Turn') this.player.action = 'Right Turn';
			} else {
        turn = 0;
				if (this.player.action != 'Idle') this.player.action = 'Idle';
			}
		}
		if (forward==0 && turn==0){
			delete this.player.motion;
		} else{
			this.player.motion = { forward, turn }; 
    }
  }

  onMouseDown(event) {
    // calculate mouse position in normalized device coordinates
		// (-1 to +1) for both components
    const mouse = new THREE.Vector2();
		mouse.x = ( event.clientX / this.renderer.domElement.clientWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / this.renderer.domElement.clientHeight ) * 2 + 1;

    // Toggle camera in chat mode
    if (this.player.activeCamera === this.player.cameras.back) {
      this.player.activeCamera = this.player.cameras.chat;	
      this.player.action='Pointing'
    } else {
      this.player.activeCamera = this.player.cameras.back;
      this.player.action='Idle'
    }

    console.log("MOUSE DOWN : ", mouse);
  }

  onWindowResize() {
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize( window.innerWidth, window.innerHeight );
  }

  // RENDER

  render() {
    requestAnimationFrame( () => this.render() );

    let delta = this.clock.getDelta();

    if (this.player.mixer!=undefined && this.mode === ModeEnum.LOADED) this.player.mixer.update(delta);

    if (this.player.action=='Walking'){
			const elapsedTime = Date.now() - this.player.actionTime;
			if (elapsedTime>2000) {this.player.action = 'Running';}
    }

    if (this.player.action=='Pointing'){
			const elapsedTime = Date.now() - this.player.actionTime;
			if (elapsedTime>2800) {this.player.action = 'Pointing Gesture';}
    }

    if (this.player.action=='Pointing Gesture'){
			const elapsedTime = Date.now() - this.player.actionTime;
			if (elapsedTime>1800) {this.player.action = 'Belly Dance';}
    }

    if (this.player.motion !== undefined) {
      this.player.move(delta);
      this.idleStatus = false;
    } else if (!this.idleStatus) {
      // Detect when the local player stop moving!
      // this should be done only once when stopping
      this.player.idle();
      this.idleStatus = true;
    };

    if (this.player.cameras!=undefined && this.player.activeCamera!=undefined){
			this.camera.position.lerp(this.player.activeCamera.getWorldPosition(new THREE.Vector3()), 0.05);
			const pos = this.player.object.position.clone();
			pos.y += 200;
			this.camera.lookAt(pos);
		}

    if (this.sun != undefined && this.player.object != undefined){
      this.sun.position.x = this.player.object.position.x;
      this.sun.position.y = this.player.object.position.y + 200;
      this.sun.position.z = this.player.object.position.z + 100;
      this.sun.target = this.player.object;
    }

    this.renderer.render( this.scene, this.camera );
  }
}