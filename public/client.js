const socket = io('localhost:3000');

// Tela
var CANVAS_WIDTH  = 1300;
var CANVAS_HEIGHT = 900;


// Arena
var ARENA_WIDTH  = 1600;
var ARENA_HEIGHT = 1600;


// Tela inicial
var inputPlayerName;
var buttonEnterGame;


// Dados do jogador
var playerName;
var playerId;
var playerPosX = 0;
var playerPosY = 0;


// Dados de atirar
var fireRate = 20;
var fireRateCounter = 0;
var bullets = [];


// Dados do mundo
var arialFont;
var enteredGame = false;
var amountLerp = 0.0;
var amountLerpStep = 0.34;
var players = [];
var highestScore = 0;
var cam;


// Tela de score
var scoreTablePosX = 390;
var scoreTablePosY = -440;


// RENDERIZAR ---------------------------------------------------------------------------------------------------------------------------

function setup() {                                                                              // Start

    createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT, WEBGL);
    frameRate(60);

    cam = createCamera();

    setTextConfigs(); // Seta as configurações de texto (fonte, tamanho...)
    initialUI(); // Renderiza janela de escolher nome
}
  

function draw() {                                                                               // Update

    fireRateCounter ++;

    background("#333333");
    
    noStroke();

    fill('#222222');
    rect(-ARENA_WIDTH/2, -ARENA_HEIGHT/2, ARENA_WIDTH, ARENA_WIDTH);

    renderScoreTable();
    renderWorld();
    movePlayer();
}


// COMUNICAÇÕES COM O SERVIDOR -------------------------------------------------------------------------------------------------------------------------------

socket.on('playerId', getPlayerId);
socket.on('refreshWorld', refreshWorld);


function getPlayerId(data){

    playerId = data;
}

function refreshWorld(data){                                                                    // Atualiza o mundo

    players = data.players;
    bullets = data.bullets;
    highestScore = data.highestScore;

    amountLerp = 0;
}


// JANELA INICIAL ------------------------------------------------------------------------------------------------------------------------------------

// Setar janela inicial
function initialUI(){

    setInputPlayerName();
    setButtonEnterGame();
}


function setInputPlayerName(){                                                                   // Input nome do player 

    inputPlayerName = createInput();
    inputPlayerName.size(300, 30);
    inputPlayerName.position((CANVAS_WIDTH/2)-150, CANVAS_HEIGHT/2);
}


function setButtonEnterGame(){                                                                   // Botão de entrar no jogo

    buttonEnterGame = createButton('ENTRAR');
    buttonEnterGame.size(100, 50);
    buttonEnterGame.position((CANVAS_WIDTH/2)-50, (CANVAS_HEIGHT/2)+50);

    buttonEnterGame.mousePressed(enterGame);
}


function enterGame(){ // Entrar no jogo

    playerName = inputPlayerName.value();

    var playerData = { // Envia os dados do jogador

        name: playerName,
        id: playerId
    }

    socket.emit('enterGame', playerData); // Envia o nome do jogador

    deleteInitialUI(); // Reseta a tela
    
    enteredGame = true;
}


function deleteInitialUI(){                                                                     // Apagar a UI inicial 

    buttonEnterGame.remove();
    inputPlayerName.remove();
}


// JOGO ----------------------------------------------------------------------------------------------------------------------------------------------

function setTextConfigs(){                                                                      // Setar configurações do texto  

    arialFont = loadFont('p5/arial.ttf');
    textFont(arialFont);
    textSize(32);
    textAlign(CENTER, CENTER);
}


function renderScoreTable(){                                                                     // Renderiza a tabela de score

    fill('white');
    rect(scoreTablePosX + playerPosX, scoreTablePosY + playerPosY, 250, 300);

    renderScoreTableText();
}

function renderScoreTableText(){                                                                // Renderiza o texto da tabela de score

    textAlign(LEFT);
    fill('black');
    textSize(24);

    // Renderiza o nome dos 5 players com mais score
    text("Jajajaja", scoreTablePosX + playerPosX + 10, scoreTablePosY + 30 + playerPosY);
    text("Jejejeje", scoreTablePosX + playerPosX + 10, scoreTablePosY + 70 + playerPosY);
    text("Jijijiji", scoreTablePosX + playerPosX + 10, scoreTablePosY + 110 + playerPosY);
    text("Jojojojo", scoreTablePosX + playerPosX + 10, scoreTablePosY + 150 + playerPosY);
    text("Jujujuju", scoreTablePosX + playerPosX + 10, scoreTablePosY + 190 + playerPosY);

    textAlign(CENTER, CENTER);
    textSize(32);
}

function movePlayer(){                                                                          // Mover o player

    var moved = false;
    var direction = createVector(0,0);

    if (keyIsDown(LEFT_ARROW)) {

        direction.x-=1;
        moved = true;
      }
      else if (keyIsDown(RIGHT_ARROW)){
  
        direction.x+=1;
        moved = true;
      }
  
      if (keyIsDown(DOWN_ARROW)) {
  
        direction.y+=1;
        moved = true;
      }
      else if (keyIsDown(UP_ARROW)){
  
        direction.y-=1;
        moved = true;
      }

      // Se tiver se movido atualiza posição no servidor
      if(moved == true){

        sendMovement(direction); // Envia ao servidor que ele andou
      }
}


function mousePressed() {                                                                          // Atirar

    if(fireRateCounter >= fireRate){

        // Pega a direção do tiro
        var bulletDirection = createVector( mouseX - (CANVAS_WIDTH/2), 
                                            mouseY - CANVAS_HEIGHT/2);
        bulletDirection.normalize();

        sendShoot(bulletDirection); // Envia que atirou ao servidor

        fireRateCounter = 0;
    }
}


function renderWorld(){                                                                            // Renderizar o mundo

     if(enteredGame == true){ 

        renderPlayer();
        renderBullets();
    }
}


function renderBullets(){

    for(var i=0; i< bullets.length; i++){

        if(bullets[i].id != playerId){

            fill('red');
        }
        else{

            fill('white');
        }


       // Suaviza o movimento das balas interpolando as posições
       var y = lerp(bullets[i].oldPositionY, bullets[i].positionY, amountLerp);
       var x = lerp(bullets[i].oldPositionX, bullets[i].positionX, amountLerp);

        ellipse(x, y, 20);
    }

    amountLerp += amountLerpStep;
}


function renderPlayer(){                                                                            // Renderiza os players

    for(var i = 0; i < players.length; i++){

        // Suaviza o movimento do outro player interpolando as posições
        var y = lerp(players[i].oldPositionY, players[i].positionY, amountLerp);;
        var x = lerp(players[i].oldPositionX, players[i].positionX, amountLerp);

        fill('white'); // Seta branco como a cor padrão, depois são feitas alterações
        
        if(players[i].id != playerId){

            fill('red');
        }
        else{

            playerPosX = x;
            playerPosY = y;

            cam.setPosition(playerPosX, playerPosY, 800);
            console.log("PLAYER SCORE: " + players[i].score);
        }

        // Renderiza
        ellipse(x, y, 50);

        // Se for o player MVP, deixa o nome dourado
        if(players[i].score >= highestScore){

            fill(255, 204, 0);
        }
        text(players[i].name, x, y-45);
    }

    console.log("MAIOR SCORE: " + highestScore);
}


function sendMovement(direction){                                                                           // Envia posição ao servidor

    data = {

        id: playerId,
        directionX: direction.x,
        directionY: direction.y
    }

    socket.emit('refreshPlayerPosition', data);
}


function sendShoot(bulletDirection){

    var data = {

        id: playerId,
        directionX: bulletDirection.x,
        directionY: bulletDirection.y
    }

    socket.emit('fired', data);
}