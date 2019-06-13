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

  socket.on('offer', function (data) {
    console.log('relaying offer');
    socket.broadcast.to(data.room).emit('offer', data.offer);
  });

  socket.on('answer', function (data) {
    console.log('relaying answer');
    socket.broadcast.to(data.room).emit('answer', data.answer);
  });


  socket.on('candidate', function (data) {
    console.log('relaying candidate');
    socket.broadcast.to(data.room).emit('candidate', data.candidate);
  });

  // somebody closed the browser tab
  socket.on('disconnect', function () {
    console.log('somebody disconnected');
  });

  socket.on('join-room', function (room) {
    socket.join(room);
  });

  socket.on('leave-room', function (room) {
    socket.leave(room);
  });

});

http.listen(port, function(){
  console.log('listening on *:' + port);
});
