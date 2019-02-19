import * as THREE from 'three';
import WEBGL from './libs/WebGL';
import Orbit from 'three-orbit-controls';
const OrbitControls = Orbit(THREE);

import {JoyStick, Preloader, SFX} from './libs/toon3d';
import FBXLoader from './libs/FBXLoader';
import Stats from './libs/stats.min';

import LocalPlayer from './local_player';
import SpeechBubble from './speech_bubble';

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

    this.animations = {};
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
				'/images/nx.jpg',
				'/images/px.jpg',
				'/images/ny.jpg',
				'/images/py.jpg',
				'/images/nz.jpg',
				'/images/pz.jpg'
			],
			oncomplete: function(){
				game.init();
			}
		}
    this.anims.forEach(anim => options.assets.push(`${this.assetsPath}anims/${anim}.fbx`));
		options.assets.push(`${this.assetsPath}town.fbx`);
    new Preloader(options);

    this.id;

    // Remote
    this.remoteData = [];
    this.initialisingPlayers = [];
    this.remotePlayers = [];
    this.remoteColliders = [];
  }

  init() {
    this.mode = ModeEnum.INITIALISING;

    this.camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 10, 20000 );
    this.camera.position.set(112, 100, 600);
    
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color( 0xa0a0a0 );
    // this.scene.fog = new THREE.Fog( 0xa0a0a0, 1000, 5000 );

		this.scene.add( this.createHemisphereLight() );

    this.sun = this.createSun();
    this.scene.add( this.sun );

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

    // Speech Bubble
		this.speechBubble = new SpeechBubble(this, "", 150);
		this.speechBubble.mesh.position.set(0, 350, 0);

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

    // Only for DEBUG!
    this.initStats();
    
    // this.initSfx();

    this.render();
  }

  // initSfx(){
	// 	this.sfx = {};
	// 	this.sfx.context = new (window.AudioContext || window.webkitAudioContext)();
	// 	this.sfx.gliss = new SFX({
	// 		context: this.sfx.context,
  //     src:{mp3:'/sfx/gliss.mp3', ogg:'/sfx/gliss.ogg'},
  //     autoplay: true,
	// 		loop: false,
	// 		volume: 0.3
  //   });
  // }
  
  initStats() {
    // https://github.com/mrdoob/stats.js
    this.stats = new Stats();
    this.stats.showPanel(0);  // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild(this.stats.dom);
  }

  handlePlayerLoaded() {
    game.joystick = game.createJoystick();
    game.createCameras();
  }

  loadEnvironment(loader){
		const game = this;
		loader.load(`/fbx/town.fbx`, object => {
			game.environment = object;
			game.colliders = [];
			game.scene.add(object);
			object.traverse(child => {
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
			tloader.setPath( '/images/' );

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
      game.animations[anim] = object.animations[0];

			if (game.anims.length>0){
				game.loadNextAnim(loader);
			}else{
				delete game.anims;
				game.action = 'Idle';
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

  createJoystick() {
    return new JoyStick({
      onMove: this.playerControl,
      game: this
    });
  }

  createCameras(){
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

    console.log("MOUSE DOWN : ", mouse);

    // Toggle camera in chat mode
    if (this.player.activeCamera === this.player.cameras.back) {
      this.player.activeCamera = this.player.cameras.chat;	
      this.player.action='Pointing'

      // Detect remote collision
      if (this.remoteColliders===undefined || this.remoteColliders.length==0) return;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera( mouse, this.camera );
      
      const intersects = raycaster.intersectObjects( this.remoteColliders );
      
      if (intersects.length>0) {
        const object = intersects[0].object;
        const remotePlayer = this.remotePlayers.filter(p => p.collider && p.collider == object).shift();

        console.log("REMOTE COLLISION WITH : ", remotePlayer);
        const message = "Hello!"
        this.speechBubble.player = remotePlayer;
        this.speechBubble.update(message);
        this.scene.add(this.speechBubble.mesh);
        this.chatSocketId = remotePlayer.id;
        
      } else {
        console.log("NO REMOTE COLLISION");
      };
      
    } else {
      delete this.speechBubble.player;
      delete this.chatSocketId;
      if (this.speechBubble.mesh.parent!==null) {
        this.speechBubble.mesh.parent.remove(this.speechBubble.mesh)
      };
      this.player.activeCamera = this.player.cameras.back;
      this.player.action='Idle';
    }
    this.player.updateLocalPlayer();

    // // Detect remote collision
    // if (this.remoteColliders===undefined || this.remoteColliders.length==0) return;

    // const raycaster = new THREE.Raycaster();
		// raycaster.setFromCamera( mouse, this.camera );
		
    // const intersects = raycaster.intersectObjects( this.remoteColliders );
    
    // if (intersects.length>0) {
    //   const object = intersects[0].object;
    //   const remotePlayer = this.remotePlayers.filter(p => p.collider && p.collider == object).shift();

    //   console.log("REMOTE COLLISION WITH : ", remotePlayer);
    //   this.speechBubble.player = remotePlayer;
		// 	this.speechBubble.update('');
		// 	this.scene.add(this.speechBubble.mesh);
    //   this.chatSocketId = remotePlayer.id;
      
    // } else {
    //   console.log("NO REMOTE COLLISION");
    //   if (this.speechBubble.mesh.parent!==null) this.speechBubble.mesh.parent.remove(this.speechBubble.mesh);
		// 	delete this.speechBubble.player;
		// 	delete this.chatSocketId;
    // };
  }

  onWindowResize() {
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize( window.innerWidth, window.innerHeight );
  }

  // REMOTE

  updateRemotePlayers(delta) {
    if (
      this.remoteData===undefined ||
      this.remoteData.length == 0 || 
      this.remotePlayers===undefined ||
      this.remotePlayers.length == 0 ||
      this.player===undefined || 
      this.id===undefined
    ) return;

    const remoteColliders = [];
    this.remotePlayers.forEach(player => {
      const playerData = this.remoteData.filter(data => data.id === player.id);
      playerData.forEach(data => player.update(delta, data));
      remoteColliders.push(player.collider);
    });	
    this.remoteData = [];
    this.remoteColliders = remoteColliders;
  }

  // RENDER

  render() {
    this.stats.begin();

    let delta = this.clock.getDelta();

    this.updateRemotePlayers(delta);
    if (this.player.mixer!=undefined && this.mode === ModeEnum.LOADED) this.player.mixer.update(delta);

    if (this.player.action=='Walking'){
			const elapsedTime = Date.now() - this.player.actionTime;
			if (elapsedTime>2000) {this.player.action = 'Running';}
    }

    if (this.player.action=='Pointing'){
			const elapsedTime = Date.now() - this.player.actionTime;
      if (elapsedTime>2800) {
        this.player.action = 'Pointing Gesture';
      }
    }

    if (this.player.action=='Pointing Gesture'){
			const elapsedTime = Date.now() - this.player.actionTime;
      if (elapsedTime>1800) {
        this.player.action = 'Belly Dance';
      }
    }

    if (this.player.action=='Belly Dance'){
      const elapsedTime = Date.now() - this.player.actionTime;
      const animDurationInMs = 1000 * this.player.animations[this.player.action].duration

      // Detect the end of the animation
      if (elapsedTime>animDurationInMs) {
        // Remove Speech Bubble
        delete this.speechBubble.player;
        delete this.chatSocketId;
        if (this.speechBubble.mesh.parent!==null) {
          this.speechBubble.mesh.parent.remove(this.speechBubble.mesh)
        };
        
        // Exit from chat view
        this.player.activeCamera = this.player.cameras.back;
        this.player.action = 'Idle';
        this.player.updateLocalPlayer();
      }
    }

    if (
      this.player.action == 'Pointing' ||
      this.player.action == 'Pointing Gesture' ||
      this.player.action == 'Belly Dance'
    ) {
      this.player.updateLocalPlayer();
    }

    if (this.player.motion !== undefined) {
      this.player.move(delta);
      this.idleStatus = false;
    } else if (!this.idleStatus && this.player.action == 'Idle') {
      // Detect when the local player stop moving!
      // this should be done only once when stopping
      this.player.updateLocalPlayer();
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

    if (this.speechBubble!==undefined) this.speechBubble.show(this.camera.position);

    this.renderer.render( this.scene, this.camera );

    this.stats.end();

    requestAnimationFrame( () => this.render() );
  }
}