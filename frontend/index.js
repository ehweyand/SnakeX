// Cores
const BG_COLOUR = '#231f20';
const SNAKE_COLOUR = '#c2c2c2';
const FOOD_COLOUR = '#e66916';

//URL onde irá conectar o socket
//const socket = io('https://sleepy-island-33889.herokuapp.com/'); //http://localhost:3000
const socket = io('http://localhost:3000');

//(Listenings) Comunicações via socket (Recebido do Server: init, gameState, gameOver, etc...)
// Cada comando executa uma função diferente
// Oriundos do método emit, no server
socket.on('init', handleInit);
socket.on('gameState', handleGameState);
socket.on('gameOver', handleGameOver);
socket.on('gameCode', handleGameCode);
socket.on('unknownCode', handleUnknownCode);
socket.on('tooManyPlayers', handleTooManyPlayers);

//Elementos
const gameScreen = document.getElementById('gameScreen');
const initialScreen = document.getElementById('initialScreen');
const newGameBtn = document.getElementById('newGameButton');
const joinGameBtn = document.getElementById('joinGameButton');
const gameCodeInput = document.getElementById('gameCodeInput');
const gameCodeDisplay = document.getElementById('gameCodeDisplay');

newGameBtn.addEventListener('click', newGame);
joinGameBtn.addEventListener('click', joinGame);


function newGame() {
  // avisa ao server que é um jogo novo
  socket.emit('newGame');
  init();
}

function joinGame() {
  const code = gameCodeInput.value;
  // envia também o código que vem do input
  socket.emit('joinGame', code);
  init();
}

let canvas, ctx;
let playerNumber; //número do jogador na sala recebido pelo server na resposta
let gameActive = false;

function init() {
  // esconde a tela de input de jogo novo, entrar, código etc...
  initialScreen.style.display = "none";
  //Mostra a tela do jogo (em block)
  gameScreen.style.display = "block";

  //Iniciando as variáveis
  canvas = document.getElementById('canvas');
  ctx = canvas.getContext('2d');

  //Tamanho do canvas em pixels
  canvas.width = canvas.height = 600;

  //Pintar o fundo do canvas
  ctx.fillStyle = BG_COLOUR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  //Adiciona um evento de tecla que chama a função keydown quando ocorrer
  document.addEventListener('keydown', keydown);
  gameActive = true; // game está rodando
}

function keydown(e) {
  // Enviando o evento de clique ao servidor
  socket.emit('keydown', e.keyCode);
}

//Renderiza na tela (pinta) o estado do game
function paintGame(state) {
  // Pinta o background
  ctx.fillStyle = BG_COLOUR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Elementos do jogo (estado do game)
  const food = state.food;
  const gridsize = state.gridsize;
  // Tamanho de cada quadradinho: 600px / gridsize (20). Algo em torno de 30px por quadrado
  const size = canvas.width / gridsize;

  // Pinta a comida
  ctx.fillStyle = FOOD_COLOUR;
  ctx.fillRect(food.x * size, food.y * size, size, size);

  // Gerencia e pinta cada um dos jogadores (cada cobra)
  paintPlayer(state.players[0], size, SNAKE_COLOUR);
  paintPlayer(state.players[1], size, 'green');
}

function paintPlayer(playerState, size, colour) {
  const snake = playerState.snake;

  ctx.fillStyle = colour;

  // Percorre o estado e captura o tamanho da cobra e pinta na tela os quadrados necessários
  // Por isso um for.
  for (let cell of snake) {
    ctx.fillRect(cell.x * size, cell.y * size, size, size);
  }
}

//Trabalhar com as respostas vindas do servidor

function handleInit(number) {
  playerNumber = number;
}

//Recebe o gamestate do server
function handleGameState(gameState) {
  if (!gameActive) {
    return;
  }
  gameState = JSON.parse(gameState);
  //temos o estado do game, podemos executar o frame de animação
  //cada vez que o server envia uma mensagem com o gameState, o front vai repintar o canvas
  requestAnimationFrame(() => paintGame(gameState));
}

function handleGameOver(data) {
  if (!gameActive) {
    return;
  }
  data = JSON.parse(data);

  gameActive = false;

  //verifica se o vencedor é o player atual que está no client
  if (data.winner === playerNumber) {
    alert('Você venceu!');
  } else {
    alert('Você perdeu :(');
  }
}

function handleGameCode(gameCode) {
  gameCodeDisplay.innerText = gameCode;
}

function handleUnknownCode() {
  reset();
  alert('Código de jogo desconhecido.')
}

function handleTooManyPlayers() {
  reset();
  alert('Jogo já em progresso.');
}

function reset() {
  playerNumber = null;
  gameCodeInput.value = '';
  initialScreen.style.display = "block";
  gameScreen.style.display = "none";
}
