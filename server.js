var express = require('express');
var app = express();
var server = app.listen(3000);
app.use(express.static('public'));
var socket = require('socket.io');
var io = socket(server);


io.on('connection', newConnection);

function newConnection(socket){

    console.log("New connection: " + socket.id);

    io.emit('playerId', socket.id); // Envia o id do player
}