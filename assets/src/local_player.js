import Player from './player';

export default class LocalPlayer extends Player {
  init() {
    super.init();
    this.initPlayer();
  }

  move(dt) {
    super.move(dt);
    this.updatePlayer();
  }

  idle() {
    // Send an update message 
    // when object transit to Idle
    this.updatePlayer();
  }

  initPlayer() {
    let state = {
      model: this.model,
      colour: this.colour,
      x: this.object.position.x,
      y: this.object.position.y,
      z: this.object.position.z,
      h: this.object.rotation.y,
      pb: this.object.rotation.x,
      action: this.action
    }
    console.log("INIT : ", state);
  }

  updatePlayer() {
    let state = {
      x: this.object.position.x,
      y: this.object.position.y,
      z: this.object.position.z,
      h: this.object.rotation.y,
      pb: this.object.rotation.x,
      action: this.action
    }
    console.log("UPDATE : ", state);
  }
}