import Game from './game';
import { Socket } from 'phoenix';

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

  initSocket() {
    const game = this;

    this.socket = new Socket(ENDPOINT, socketOptions);
    this.socket.connect();
    this.socket.onError(() => console.log("there was an error with the connection!"));
    this.socket.onClose(() => console.log("the connection dropped"));

    this.channel = this.socket.channel(`game:${gameId}`, {});
    this.channel.join()
      .receive("ok", ({id}) => game.id = id)  // Set gameId when channel has joined
      .receive("error", ({reason}) => console.log("failed join", reason))
      .receive("timeout", () => console.log("Networking issue. Still waiting..."));

    this.channel.onError(() => console.log("there was an error!"));
    this.channel.onClose(() => console.log("the channel has gone away gracefully"));
  }
}
