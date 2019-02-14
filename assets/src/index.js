import '../css/app.scss';

import Game from './game';

const game = new Game();
window.game = game;

// SOCKET

import { Socket } from 'phoenix';

const socketOptions = {
  logger: (kind, msg, data) => (
    // eslint-disable-next-line no-console
    console.log(`${kind}: ${msg}`, data)
  ),
};

const socket = new Socket("/socket", socketOptions);
socket.connect();

socket.onError(() => console.log("there was an error with the connection!"));
socket.onClose(() => console.log("the connection dropped"));

const gameId = 123;
const channel = socket.channel(`game:${gameId}`, {});
channel.join()
  .receive("ok", ({id}) => game.id = id)  // Set gameId when channel has joined
  .receive("error", ({reason}) => console.log("failed join", reason))
  .receive("timeout", () => console.log("Networking issue. Still waiting..."));

channel.onError(() => console.log("there was an error!"));
channel.onClose(() => console.log("the channel has gone away gracefully"));

// END SOCKET
