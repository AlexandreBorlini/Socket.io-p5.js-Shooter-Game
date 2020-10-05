var express = require('express');
var app = express();
var server = app.listen(3000);
app.use(express.static('public'));
var socket = require('socket.io');
var io = socket(server);


let players = [];


io.on('connection', newConnection);

const interval = 1000;

function newConnection(socket){

    console.log("New connection: " + socket.id);

    socket.emit('playerId', socket.id); // Envia o id do player

    // Requisições do client
    socket.on('enterGame', connectPlayer); // Conecta o player
    socket.on('refreshPlayerPosition', refreshPlayerPosition);

    var refreshPlayersWorld = setInterval (function () {
        
        io.sockets.emit('refreshWorld', players);
    }, interval); 
}


function connectPlayer(data){ // Adicionao player nos conectados

    var playerToAdd = data;

    players.push(playerToAdd); // Adiciona o player na lista
}


function refreshPlayerPosition(data){ // Atualiza a posição do player

    // Procura o player pelo id e muda sua posição
    for(var i=0; i < players.length; i++){

        if(players[i].id == data.id){

            players[i].positionX = data.positionX;
            players[i].positionY = data.positionY;
            players[i].oldPositionX = data.oldPositionX;
            players[i].oldPositionY = data.oldPositionY;
        }
    }
}