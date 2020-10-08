var express = require('express');
var app = express();
var server = app.listen(3000);
app.use(express.static('public'));
var socket = require('socket.io');
var io = socket(server);


let players = []; // Segura todos os players
let bullets = []; // Segura os tiros


io.on('connection', newConnection);


const interval = 51;
const calcInterval = 16; // +- 60 fps
var playerSpeed = 10;
var bulletSpeed = 30;


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

}, calcInterval); 


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