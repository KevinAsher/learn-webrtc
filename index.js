const express = require('express');
const path = require('path');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;

app.use('/', express.static(path.join(__dirname, 'client')));

// app.get('/', function(req, res){
//   res.sendFile(__dirname + '/client/index.html');
// });

io.on('connection', function(socket){
  console.log('user connected #' + socket.id);
  socket.on('chat message', function(msg){
    console.log(msg);
    io.emit('chat message', msg);
  });

  socket.on('offer', function (data) {
    console.log('relaying offer');
    socket.broadcast.emit('offer', data);
  });

  socket.on('answer', function (data) {
    console.log('relaying answer');
    socket.broadcast.emit('answer', data);
  });


  socket.on('candidate', function (data) {
    console.log('relaying candidate');
    socket.broadcast.emit('candidate', data);
  });

  // somebody closed the browser tab
  socket.on('disconnect', function () {
    console.log('somebody disconnected');
  });

  socket.broadcast.emit('new');
});

http.listen(port, function(){
  console.log('listening on *:' + port);
});
