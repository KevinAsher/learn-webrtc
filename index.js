const express = require('express');
const path = require('path');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;

app.use('/', express.static(path.join(__dirname, 'client')));

http.listen(port, function(){
  console.log('listening on *:' + port);
});

// Insira código do socket.io aqui

