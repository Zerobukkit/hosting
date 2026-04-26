import { initGame } from './game.js';

const playButton = document.getElementById('play-button');
const welcomeScreen = document.getElementById('welcome-screen');
const gameScreen = document.getElementById('game-screen');

playButton.addEventListener('click', () => {
  welcomeScreen.style.display = 'none';
  gameScreen.style.display = 'block';
  initGame();
});
