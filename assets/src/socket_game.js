import Game from './game';
import { Socket } from 'phoenix';
import Player from './player';

const ENDPOINT = "/socket";
const gameId = 123;

const socketOptions = {
  logger: (kind, msg, data) => (
    console.log(`${kind}: ${msg}`, data)
  ),
};

export default class SocketGame extends Game {
  constructor() {
    super();
    this.initSocket();
  }

  send_command(command, payload) {
    this.channel.push(command, payload)
  }

  // Use game instead of this!!!
  handlePlayerLoaded(player) {
    super.handlePlayerLoaded();
    game.send_command('player_ready', {});

    // This will make the new local player visible
    // to others connected people
    player.updateLocalPlayer();
  }

  // Use game instead of this!!!
  handleRemotePlayerLoaded(player) {
    console.log(`REMOTE DATA LOADED : ${player.id}`);

    // Remove player from initialisingPlayers ...
    game.initialisingPlayers = game.initialisingPlayers.filter(p => p.id !== player.id);
    // ... and add it to remotePlayers
    game.remotePlayers.push(player);

    player.action = player.initialAction;
    game.scene.add(player.object);
  }

  initSocket() {
    const game = this;

    this.socket = new Socket(ENDPOINT, socketOptions);
    this.socket.connect();
    this.socket.onError(() => console.log("there was an error with the connection!"));
    this.socket.onClose(() => console.log("the connection dropped"));

    this.channel = this.socket.channel(`game:${gameId}`, {});

    this.channel.on('world_init', payload => {
      // console.log(`WORLD INIT : ${payload}`);
      this.initialisingPlayers = payload
        .world
        .filter(player => player.id !== this.id) 
        .map(playerData => new Player(game, playerData, this.handleRemotePlayerLoaded))
    });

    this.channel.on('world_update', payload => {
      // console.log(`WORLD UPDATE : ${payload}`);
      this.remoteData = this.remoteData.concat(
        // Filter payload.world from self data!
        payload.world.filter(p => p.id !== this.id)
      );
    });

    this.channel.on('game_joined', payload => {
      // console.log(`GAME JOINED : ${payload}`);
      this.initialisingPlayers.push(new Player(game, payload.player, this.handleRemotePlayerLoaded));
    });

    this.channel.on('game_left', payload => {
      // console.log(`GAME LEFT : ${payload}`);
      this.initialisingPlayers = this.initialisingPlayers.filter(p => p.id !== payload.uuid);

      const player = this.remotePlayers.filter(p => p.id === payload.uuid).shift();
      if (player) this.scene.remove(player.object);

      this.remotePlayers = this.remotePlayers.filter(p => p.id !== payload.uuid);
    });

    this.channel.join()
      .receive("ok", ({id}) => game.id = id)  // Set gameId when channel has joined
      .receive("error", ({reason}) => console.log("failed join", reason))
      .receive("timeout", () => console.log("Networking issue. Still waiting..."));

    this.channel.onError(() => console.log("there was an error!"));
    this.channel.onClose(() => console.log("the channel has gone away gracefully"));
  }
}
