var express = require('express');
var app = express();
var server = app.listen(3000);
app.use(express.static('public'));
var socket = require('socket.io');
var io = socket(server);

// Tamanho da arena que o player pode se mover
var HALF_ARENA_WIDTH  = 800;
var HALF_ARENA_HEIGHT = 800;

let players = []; // Segura todos os players
let bullets = []; // Segura os tiros


io.on('connection', newConnection);


const interval = 51;
const calcInterval = 16; // +- 60 fps
var playerSpeed = 10;
var playerRadius = 50;
var bulletSpeed = 30;
var bulletRadius = 20;


var refreshPlayersWorld = setInterval (function () {                                                                // Atualiza os clients
        
    var dataToEmit = {

        players: players,
        bullets: bullets
    }

    io.sockets.emit('refreshWorld', dataToEmit);

    // Após enviar, atualizar a posição antiga do player
    for(var i=0; i<players.length;i++){

        players[i].oldPositionX = players[i].positionX;
        players[i].oldPositionY = players[i].positionY; 
    }

    // E dos tiros
    for(var i=0; i<bullets.length;i++){

        bullets[i].oldPositionX = bullets[i].positionX;
        bullets[i].oldPositionY = bullets[i].positionY;
    }

}, interval); 


// Calcula a posição dos players, das balas, e a colisão
var calculateWorld = setInterval (function () {                                                                     // Calcula as ações do mundo
        
    updateBulletsPosition();
    collisionCheck();

}, calcInterval); 


function updateBulletsPosition(){                                                                                   // Calcula a posição das balas

    for(var i=0; i<bullets.length;i++){

        bullets[i].positionX += bullets[i].directionX * bulletSpeed;
        bullets[i].positionY += bullets[i].directionY * bulletSpeed;

        // Depois de um tempo tira a bala da lista
        // Não precisa se preocupar com deltatime pois 
        // o framerate do servidor é (teoricamente) sempre o mesmo
        bullets[i].lifetime++;
        if(bullets[i].lifetime >= 30){

            bullets.splice(i, 1);
        }
    }
}


function collisionCheck(){                                                                                          // Cálculo de colisão

    for(var i=0; i<players.length; i++){

        for(var j=0; j<bullets.length; j++){

            var aX = players[i].positionX - bullets[j].positionX;
            var aY = players[i].positionY - bullets[j].positionY;
        
            var distance = Math.sqrt((aX * aX) + (aY * aY));
            Math.abs(distance);

            if( distance <= playerRadius + bulletRadius && bullets[j].id != players[i].id){

                console.log("BATEU");
            }
        }
    }
}


function newConnection(socket){

    console.log("New connection: " + socket.id);

    socket.emit('playerId', socket.id); // Envia o id do player


                                                                                                                    // Requisições do client
    socket.on('enterGame', connectPlayer); // Conecta o player
    socket.on('refreshPlayerPosition', refreshPlayerPosition);
    socket.on('fired', addBullet);


    // Quando algum player desconectar
    socket.on('disconnect', function () {

        for(var i=0; i < players.length; i++){

            if(players[i].id == socket.id){

                console.log('Disconnected: ' + socket.id);
                players.splice(i, 1);
            }
        }
    });
}


function connectPlayer(data){                                                                       // Adicionao player nos conectados

    var playerToAdd = {

        name: data.name,
        id: data.id,
        positionX: 0,
        positionY: 0,
        oldPositionX:0,
        oldPositionY:0
    };

    players.push(playerToAdd); // Adiciona o player na lista
}


function refreshPlayerPosition(data){                                                               // Atualiza a posição do player

    // Procura o player pelo id e muda sua posição
    for(var i=0; i < players.length; i++){

        if(players[i].id == data.id){


            players[i].positionX += data.directionX * playerSpeed;
            players[i].positionY += data.directionY * playerSpeed;

            if(players[i].positionX < -HALF_ARENA_WIDTH){

                players[i].positionX = -HALF_ARENA_WIDTH;
            }
            else if(players[i].positionX > HALF_ARENA_WIDTH){

                players[i].positionX = HALF_ARENA_WIDTH;
            }

            
            if(players[i].positionY < -HALF_ARENA_HEIGHT){

                players[i].positionY = -HALF_ARENA_HEIGHT;
            }
            else if(players[i].positionY > HALF_ARENA_HEIGHT){

                players[i].positionY = HALF_ARENA_HEIGHT;
            }
            
        }
    }
}


function addBullet(data){                                                                            // Adiciona a bala

    for(var i=0;i<players.length;i++){

        if(players[i].id == data.id){

             // Cria objeto da bala para poder botar na lista
            var bulletToAdd = {

                id: data.id,
                directionX: data.directionX,
                directionY: data.directionY,
                positionX: players[i].positionX,
                positionY: players[i].positionY,
                oldPositionX: players[i].positionX,
                oldPositionY: players[i].positionY,
                lifetime:0
            };

            bullets.push(bulletToAdd);
        }
    }
}