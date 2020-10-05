const socket = io('http://localhost:3000');


// Tela inicial
var inputPlayerName;
var buttonEnterGame;


// Dados do jogador
var playerName;
var playerSpeed = 5;
var playerId;
var playerPositionX = 0;
var playerPositionY = 0;
var oldPlayerPositionX = 0;
var oldPlayerPositionY = 0;


// Dados do mundo
var arialFont;
var enteredGame = false;
var players = [];


// RENDERIZAR ---------------------------------------------------------------------------------------------------------------------------

function setup() { // Start

    createCanvas(800, 800, WEBGL);
    frameRate(120);

    setTextConfigs(); // Seta as configurações de texto (fonte, tamanho...)
    initialUI(); // Renderiza janela de escolher nome
}
  
function draw() { // Update

    background('#333333');

    renderWorld();
    movePlayer();
}


// COMUNICAÇÕES COM O SERVIDOR -------------------------------------------------------------------------------------------------------------------------------

socket.on('playerId', getPlayerId);
socket.on('refreshWorld', refreshWorld);


function getPlayerId(data){

    playerId = data;
}

function refreshWorld(data){ // Atualiza o mundo

    players = data;

    /* Atualiza a posição antiga como sendo a nova
     Para quando passar a posição novamente para o servidor,
     possa fazer o lerp nos outros clients */
    oldPlayerPositionX = playerPositionX;
    oldPlayerPositionY = playerPositionY;

    // Atualiza pois caso o player não ande, a posição antiga
    // ainda fica salva e nos outros clients o player não
    // fica indo e voltando
    sendPosition();
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


function setButtonEnterGame(){ // Botão de entrar no jogo

    buttonEnterGame = createButton('ENTRAR');
    buttonEnterGame.size(100, 50);
    buttonEnterGame.position(350, 450);

    buttonEnterGame.mousePressed(enterGame);
}


function enterGame(){ // Entrar no jogo

    playerName = inputPlayerName.value();

    var playerData = { // Envia os dados do jogador

        positionX: playerPositionX,
        positionY: playerPositionY,
        oldPositionX: oldPlayerPositionX,
        oldPositionY: oldPlayerPositionY, 
        name: playerName,
        id: playerId
    }

    socket.emit('enterGame', playerData); // Envia o nome do jogador

    deleteInitialUI(); // Reseta a tela
    
    enteredGame = true;
}


function deleteInitialUI(){ // Apagar a UI inicial 

    buttonEnterGame.remove();
    inputPlayerName.remove();
}


// JOGO ----------------------------------------------------------------------------------------------------------------------------------------------

function setTextConfigs(){

    arialFont = loadFont('p5/arial.ttf');
    textFont(arialFont);
    textSize(32);
    textAlign(CENTER, CENTER);
}

function movePlayer(){

    var moved = false;
    
    if (keyIsDown(LEFT_ARROW)) {

        playerPositionX -= playerSpeed;
        moved = true;
      }
      else if (keyIsDown(RIGHT_ARROW)){
  
        playerPositionX += playerSpeed;
        moved = true;
      }
  
      if (keyIsDown(DOWN_ARROW)) {
  
        playerPositionY += playerSpeed;
        moved = true;
      }
      else if (keyIsDown(UP_ARROW)){
  
        playerPositionY -= playerSpeed;
        moved = true;
      }

      // Se tiver se movido atualiza posição no servidor
      if(moved == true){

        sendPosition();
      }
}


function renderWorld(){ // Se o jogador tiver entrado no jogo, renderiza o mundo

     if(enteredGame == true){ 

        for(var i = 0; i < players.length; i++){

            if(playerId != players[i].id){

                if(players[i].oldPositionX != players[i].positionX){

                    if(players[i].oldPositionX > players[i].positionX){

                        players[i].oldPositionX -= 5;    
                    }
                    else{

                        players[i].oldPositionX += 5;
                    }
                }

                if(players[i].oldPositionY != players[i].positionY){

                    if(players[i].oldPositionY > players[i].positionY){

                        players[i].oldPositionY -= 5;    
                    }
                    else{

                        players[i].oldPositionY += 5;
                    }
                }
                //players[i].oldPositionX = lerp(players[i].oldPositionX, players[i].positionX, 0.45);

                ellipse(players[i].oldPositionX, players[i].oldPositionY, 50);

                text(players[i].name, players[i].oldPositionX, players[i].oldPositionY-45);
            }
            else{

                ellipse(playerPositionX, playerPositionY, 50);
            }
        }
    }
}


function sendPosition(){ // Envia posição ao servidor

    playerPosition = {

        id: playerId,
        positionX: playerPositionX,
        positionY: playerPositionY,
        oldPositionX: oldPlayerPositionX,
        oldPositionY: oldPlayerPositionY, 
    }

    socket.emit('refreshPlayerPosition', playerPosition);
}