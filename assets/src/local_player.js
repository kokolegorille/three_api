import Player from './player';

export default class LocalPlayer extends Player {
  init() {
    super.init();
    this.local = true;
    this.initLocalPlayer();
  }

  move(dt) {
    super.move(dt);
    this.updateLocalPlayer();
  }

  initLocalPlayer() {
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
    // console.log("INIT : ", state);
    this.game.send_command('init', state);
  }

  updateLocalPlayer() {
    let state = {
      x: this.object.position.x,
      y: this.object.position.y,
      z: this.object.position.z,
      h: this.object.rotation.y,
      pb: this.object.rotation.x,
      action: this.action
    }
    // console.log("UPDATE : ", state);
    this.game.send_command('update', state);
  }
}