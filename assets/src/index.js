import '../css/app.scss';

// import Game from './game';
import Game from './socket_game';

const game = new Game();
window.game = game;
