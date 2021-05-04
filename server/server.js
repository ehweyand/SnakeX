// Acesso ao objeto socket.io para manipular a conexão
const io = require('socket.io')();

// Importar para poder utilizar os métodos do arquivo game.js e outros.
const { initGame, gameLoop, getUpdatedVelocity } = require('./game');
const { FRAME_RATE } = require('./constants');
const { makeid } = require('./utils');

const state = {}; // state do jogo, global para toda aplicação
const clientRooms = {}; // lookup table, para verificar o nome da sala de um jogador específico

//Permite a comunicação com o cliente (objeto client)
io.on('connection', client => {

  // Recebendo eventos do cliente para trabalhar no servidor
  client.on('keydown', handleKeydown);
  client.on('newGame', handleNewGame);
  client.on('joinGame', handleJoinGame);

  //Funções definidas dentro da função anônima que recebe o client
  // isso foi feito para ter acesso ao objeto do evento: client dentro
  // das funções de maneira mais simplficada.

  function handleJoinGame(roomName) {
    // pegando a sala (socket.io)
    // é um objeto, pegamos a room
    const room = io.sockets.adapter.rooms[roomName];

    let allUsers;
    if (room) {
      allUsers = room.sockets;
      //nos retorna um objeto com todos os users na room
    }

    let numClients = 0;
    if (allUsers) { // se existe
      numClients = Object.keys(allUsers).length; //numero de clients na room
    }

    if (numClients === 0) {
      client.emit('unknownCode'); // não tem ninguém, jogo desconhecido
      return;
    } else if (numClients > 1) {
      client.emit('tooManyPlayers'); //sala cheia, é permitido apenas 2 jogadores
      return;
    }

    clientRooms[client.id] = roomName; // room para o cliente atual, que está entrando no game

    client.join(roomName);
    client.number = 2;
    client.emit('init', 2);

    startGameInterval(roomName);//inicia o game somente quando há 2 jogadores
  }

  function handleNewGame() {
    // Cria uma sala do socket.io para conectar e ciar um novo jogo
    let roomName = makeid(5);
    clientRooms[client.id] = roomName;
    // envia devolta o codigo do game criado
    client.emit('gameCode', roomName);

    state[roomName] = initGame(); // adiciona o estado do jogo que acabou de ser criado (initGame)
    // como um child do roomName no objeto global state
    
    // socket.io conectar o cliente à essa sala
    client.join(roomName);
    client.number = 1;
    client.emit('init', 1);
  }

  function handleKeydown(keyCode) {
    //mapeia um client id para um room name
    const roomName = clientRooms[client.id];
    if (!roomName) {
      return;
    }
    //pega o código da tecla
    try {
      keyCode = parseInt(keyCode);
    } catch (e) {
      console.error(e);
      return;
    }
    // atualiza a velocidade
    const vel = getUpdatedVelocity(keyCode);

    if (vel) {
      // para indexar o array corretamente, usa - 1 no índice
      state[roomName].players[client.number - 1].vel = vel;
    }
  }
});

function startGameInterval(roomName) {
  // caso queiramos parar de enviar dados
  // Queremos chamar esse intervalo a cada frame
  const intervalId = setInterval(() => {

    //Mecânicas do jogo para cada loop (iteração do jogo)
    const winner = gameLoop(state[roomName]); // recebe o estado do jogo global da room atual

    if (!winner) {
      emitGameState(roomName, state[roomName])
    } else {
      emitGameOver(roomName, winner);
      state[roomName] = null;// reseta o estado da room
      clearInterval(intervalId);
    }
  }, 1000 / FRAME_RATE); // calculo de tempo que irá esperar a cada frame
}

function emitGameState(room, gameState) {
  // envia esse evento para todos na room
  // literalmente, passando as informações do servidor desejadas para todos os clients na room
  io.sockets.in(room)
    .emit('gameState', JSON.stringify(gameState));
}

function emitGameOver(room, winner) {
  io.sockets.in(room)
    .emit('gameOver', JSON.stringify({ winner }));
}

// Ouvindo a porta
// Para o Heroku, usar a variável de ambiente da porta, que é injetada pelo heroku
// a Porta 3000 é apenas fallback
io.listen(process.env.PORT || 3000);
