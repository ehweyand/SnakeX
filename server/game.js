// pega a VARIÁVEL GRID_SIZE do arquivo de constantes
const { GRID_SIZE } = require('./constants');

module.exports = {
  initGame,
  gameLoop,
  getUpdatedVelocity,
}

function initGame() {
  const state = createGameState(); // cria o gameState
  randomFood(state); // gera a comida aleatória
  return state; // retorna esse game state
}

// Estado do jogo com todas as posições e coordenadas dos elementos do game.
function createGameState() {
  return {
    players: [{
      pos: {
        x: 3,
        y: 10,
      },
      vel: {
        x: 1,
        y: 0,
      },
      snake: [
        { x: 1, y: 10 },
        { x: 2, y: 10 },
        { x: 3, y: 10 },
      ],
    }, {
      pos: {
        x: 18,
        y: 10,
      },
      vel: {
        x: 0,
        y: 0,
      },
      snake: [
        { x: 20, y: 10 },
        { x: 19, y: 10 },
        { x: 18, y: 10 },
      ],
    }],
    food: {}, //começa vazio por que sempre gera o local da comida de forma aleatória
    gridsize: GRID_SIZE,
  };
}

function gameLoop(state) {
  if (!state) { // verifica se recebeu ou não um state. Se não recebeu, já retorna
    return;
  }

  const playerOne = state.players[0];
  const playerTwo = state.players[1];

  playerOne.pos.x += playerOne.vel.x;
  playerOne.pos.y += playerOne.vel.y;

  playerTwo.pos.x += playerTwo.vel.x;
  playerTwo.pos.y += playerTwo.vel.y;

  //verifica se não encostou no limite do canvas
  //Se encostou, verifica o vencedor (2 ou 1)
  if (playerOne.pos.x < 0 || playerOne.pos.x > GRID_SIZE || playerOne.pos.y < 0 || playerOne.pos.y > GRID_SIZE) {
    return 2; //player 2 venceu, player 1 saiu do canvas
  }

  if (playerTwo.pos.x < 0 || playerTwo.pos.x > GRID_SIZE || playerTwo.pos.y < 0 || playerTwo.pos.y > GRID_SIZE) {
    return 1; //player 1 venceu, player 2 saiu do canvas
  }

  // Cobra do jogador 1
  if (state.food.x === playerOne.pos.x && state.food.y === playerOne.pos.y) {
    // aumentando a cobra
    // mais um objeto extra no array da snake, 
    playerOne.snake.push({ ...playerOne.pos });
    playerOne.pos.x += playerOne.vel.x;
    playerOne.pos.y += playerOne.vel.y;
    randomFood(state);//defini uma posição pra comida aleatória
  }

  // Cobra do jogador 2
  if (state.food.x === playerTwo.pos.x && state.food.y === playerTwo.pos.y) {
    playerTwo.snake.push({ ...playerTwo.pos });
    playerTwo.pos.x += playerTwo.vel.x;
    playerTwo.pos.y += playerTwo.vel.y;
    randomFood(state);
  }
  // Cobra do jogador 1
  //Testar se a cobra realmente está se mechendo
  if (playerOne.vel.x || playerOne.vel.y) {
    // Verifica se a cobra não bateu nela mesmo
    for (let cell of playerOne.snake) {
      if (cell.x === playerOne.pos.x && cell.y === playerOne.pos.y) {
        return 2;
      }
    }
    // aumentar o tamanho
    playerOne.snake.push({ ...playerOne.pos });

    //remover o primeiro elemento do array
    playerOne.snake.shift();

    // isso nos dá o movimento da cobra na tela
  }


  // Cobra do jogador 2
  if (playerTwo.vel.x || playerTwo.vel.y) {
    for (let cell of playerTwo.snake) {
      if (cell.x === playerTwo.pos.x && cell.y === playerTwo.pos.y) {
        return 1;
      }
    }

    playerTwo.snake.push({ ...playerTwo.pos });
    playerTwo.snake.shift();
  }

  return false;
}

function randomFood(state) {
  // Gerando uma posição aleatória para a comida no jogo
  
  food = {
    x: Math.floor(Math.random() * GRID_SIZE),
    y: Math.floor(Math.random() * GRID_SIZE),
  }

  // cuidados e verificações para não colocar a comida em cima de uma das cobras

  for (let cell of state.players[0].snake) {
    if (cell.x === food.x && cell.y === food.y) {
      // Comida esta dentro da cobra
      //recursivamente chama novamente o método de randomFood até não ocorrer esse problema
      return randomFood(state);
    }
  }

  for (let cell of state.players[1].snake) {
    if (cell.x === food.x && cell.y === food.y) {
      return randomFood(state);
    }
  }

  state.food = food;
}

function getUpdatedVelocity(keyCode) {
  switch (keyCode) {
    // Alterar o movimento da cobra
    case 37: { // left
      return { x: -1, y: 0 };
    }
    case 38: { // down
      return { x: 0, y: -1 };
    }
    case 39: { // right
      return { x: 1, y: 0 };
    }
    case 40: { // up
      return { x: 0, y: 1 };
    }
  }
}
