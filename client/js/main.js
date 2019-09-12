'use strict';
/* global io, $ */

// Insira o código de ínicio aqui

// Define action buttons.
const callButton = document.getElementById("callButton");
const hangupButton = document.getElementById("hangupButton");

let peerConnection;
let room;

// Set up media stream constant and parameters.
// In this codelab, you will be streaming video only: "video: true".
// Audio will not be streamed because it is set to "audio: false" by default.
const mediaStreamConstraints = {
  video: true
  // audio: true,
};

// Set up to exchange only video.
const offerOptions = {
  offerToReceiveVideo: 1,
};

let startTime = null;
let localStream;

// Set up initial action buttons status: disable call and hangup.
hangupButton.disabled = true;

// Allows for RTC server configuration.
const servers = {
  iceServers: [
    {
      urls: 'turn:numb.viagenie.ca',
      username: 'kev_asher@edu.univali.br',
      credential: 'guess*my*number',
    },
    {
      urls: [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302',
        'stun:stun3.l.google.com:19302',
        'stun:stun4.l.google.com:19302',
      ]
    }]
};



// Define peer connections, streams and video elements.
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

// Logs an action (text) and the time when it happened on the console.
function trace(text) {
  text = text.trim();
  const now = (window.performance.now() / 1000).toFixed(3);

  console.log(now, text);
}


var socket = io();

$(function () {
  $("#videoCallForm").submit(function (event) {
    event.preventDefault();
    room = $("#roomInput").val();
    socket.emit("join-room", room);

    callAction();
    return false;
  });

  // Insira o registro dos eventos do Socket.io aqui
})


// Handles call button action: creates peer connection.
function callAction() {
  navigator.mediaDevices
    .getUserMedia(mediaStreamConstraints)
    .then(function (mediaStream) {
      localVideo.srcObject = mediaStream;
      localStream = mediaStream;
      trace("Received local stream.");

      callButton.disabled = true;
      hangupButton.disabled = false;

      // Insira o ínicio da conexão Web RTC aqui
    })
}

// Handles hangup action: ends up call, closes connections and resets peers.
function hangupAction() {
  // Encerra a conexão webrtc aqui


  // Desabilita/habilita botões, emite sinal ao servidor para sair da sala 
  hangupButton.disabled = true;
  callButton.disabled = false;
  socket.emit('leave-room', room);
}

// Add click event handlers for buttons.
hangupButton.addEventListener('click', hangupAction);

