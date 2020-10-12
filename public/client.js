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
var playerName = "You";
var playerId;
var playerScore = 0;
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
var gameStarted = false;


// Tela de score
var scoreTablePosX = 390;
var scoreTablePosY = -440;


var topScorePlayers = [];

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

    renderWorld();
    renderScoreTable();
    movePlayer();
}


// COMUNICAÇÕES COM O SERVIDOR -------------------------------------------------------------------------------------------------------------------------------

socket.on('playerId', getPlayerId);
socket.on('refreshWorld', refreshWorld);


function getPlayerId(data){

    playerId = data;
    gameStarted = true;
}

function refreshWorld(data){                                                                    // Atualiza o mundo

    players = data.players;
    bullets = data.bullets;

    organizePlayersByScore();

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


function organizePlayersByScore(){                                                                  // Pega os top 5 players

    function compare(a,b){

        if(a.score < b.score){
            return 1;
        }
        if(a.score>b.score){
            return -1;
        }
        return 0;
    }

    players.sort(compare);
}


function renderScoreTable(){                                                                     // Renderiza a tabela de score

    var tableColor = color(0,0,0);
    tableColor.setAlpha(100);
    fill(tableColor);
    rect(scoreTablePosX + playerPosX, scoreTablePosY + playerPosY, 250, 225);

    renderScoreTableText();
    renderPlayerScore();
}

function renderScoreTableText(){                                                                // Renderiza o texto da tabela de score

    textAlign(LEFT);
    fill('black');
    textSize(24);

    // Renderiza o nome dos 5 players com mais score
    if(players.length>=1){
        fill(255, 204, 0);

        text(players[0].score, scoreTablePosX + playerPosX + 10, scoreTablePosY + 30 + playerPosY);
        text(players[0].name, scoreTablePosX + playerPosX + 50, scoreTablePosY + 30 + playerPosY);
    }

    if(players.length>=2){
        fill(200, 200, 200);
        text(players[1].score, scoreTablePosX + playerPosX + 10, scoreTablePosY + 70 + playerPosY);
        text(players[1].name, scoreTablePosX + playerPosX + 50, scoreTablePosY + 70 + playerPosY);
    }
    
    if(players.length>=3){
        fill(205, 127, 50);
        text(players[2].score, scoreTablePosX + playerPosX + 10, scoreTablePosY + 110 + playerPosY);
        text(players[2].name, scoreTablePosX + playerPosX + 50, scoreTablePosY + 110 + playerPosY);
    }

    fill('white');

    if(players.length>=4){
        text(players[3].score, scoreTablePosX + playerPosX + 10, scoreTablePosY + 150 + playerPosY);
        text(players[3].name, scoreTablePosX + playerPosX + 50, scoreTablePosY + 150 + playerPosY);
    }

    if(players.length>=5){
        text(players[4].score, scoreTablePosX + playerPosX + 10, scoreTablePosY + 190 + playerPosY);
        text(players[4].name, scoreTablePosX + playerPosX + 50, scoreTablePosY + 190 + playerPosY);
    }
}

function renderPlayerScore(){                                                                         // Renderiza o score do player

    // If não realmente necessário
    // só pra tirar um erro inicial que não afeta nada
    if(gameStarted){ 

        text(playerScore, scoreTablePosX + playerPosX + 10, scoreTablePosY + 240 + playerPosY);
        text(playerName, scoreTablePosX + playerPosX + 50, scoreTablePosY + 240 + playerPosY);
    }

    // Como é continuação da rendrização dos top players, usa as configurações de texto
    // anteriores e só muda ao normal depois de renderizar o deste player
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

            playerScore = players[i].score;
            playerPosX = x;
            playerPosY = y;

            cam.setPosition(playerPosX, playerPosY, 800);
        }

        // Renderiza
        ellipse(x, y, 50);

        // Se for o player MVP, deixa o nome dourado
        if(i == 0)
            fill(255, 204, 0);
        else if(i == 1)
            fill(200, 200, 200);
        else if(i==2)
            fill(205, 127, 50);

        text(players[i].name, x, y-45);
    }
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