const socket = io('http://localhost:3000');


// Tela inicial
var inputPlayerName;
var buttonEnterGame;


// Dados do jogador
var playerName;
var playerSpeed = 5;
var playerId;
 

// RENDERIZAR ---------------------------------------------------------------------------------------------------------------------------

function setup() { // Start

    createCanvas(800, 800);

    initialUI(); // Renderiza janela de escolher nome
}
  
function draw() { // Update

    background('#333333');
}

// COMUNICAÇÕES COM O SERVIDOR -------------------------------------------------------------------------------------------------------------------------------
socket.on('playerId', getPlayerId);

function getPlayerId(data){

    playerId = data;
}

// JANELA INICIAL ------------------------------------------------------------------------------------------------------------------------------------

// Setar janela inicial
function initialUI(){

    setInputPlayerName();
    setButtonEnterGame();
}


function setInputPlayerName(){ // Input nome do player 

    inputPlayerName = createInput();
    inputPlayerName.size(300, 30);
    inputPlayerName.position(250, 400);
}


function setButtonEnterGame(){ // Botão de entraqr no jogo

    buttonEnterGame = createButton('ENTRAR');
    buttonEnterGame.size(100, 50);
    buttonEnterGame.position(350, 450);

    buttonEnterGame.mousePressed(enterGame);
}


function enterGame(){ // Entrar no jogo

    playerName = inputPlayerName.value();

    var playerData = {

        name: playerName,
        id: playerId
    }

    socket.emit('enterGame', playerData); // Envia o nome do jogador

    deleteInitialUI(); // Reseta a tela
}


function deleteInitialUI(){ // Apagar a UI inicial 

    buttonEnterGame.remove();
    inputPlayerName.remove();
}


// JOGO ----------------------------------------------------------------------------------------------------------------------------------------------