'use strict';

var socket = io();
const servers = null;  // Allows for RTC server configuration.
let peerConnection;

$(function () {
  $('form').submit(function () {
    socket.emit('chat message', $('#m').val());
    $('#m').val('');
    return false;
  });
  socket.on('chat message', function (msg) {
    $('#messages').append($('<li>').text(msg));
    window.scrollTo(0, document.body.scrollHeight);
  });

  socket.on('offer', function(offer) {
    alert('found offer, see console');
    // console.log({offer});
    var description = new RTCSessionDescription(offer);
    peerConnection = new RTCPeerConnection(servers);

    peerConnection.addEventListener('icecandidate', handleICECandidateEvent);
    peerConnection.addEventListener('iceconnectionstatechange', handleICEConnectionStateChangeEvent);
    peerConnection.addEventListener('icegatheringstatechange', handleICEGatheringStateChangeEvent);
    peerConnection.addEventListener('signalingstatechange', handleSignalingStateChangeEvent);
    peerConnection.addEventListener('track', handleTrackEvent);
    

    peerConnection.setRemoteDescription(description).then(function() {
      return navigator.mediaDevices.getUserMedia(mediaStreamConstraints);
    })
    .then(function(stream) {
      localVideo.srcObject = stream;

      stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
    })
    .then(function() {
      return peerConnection.createAnswer();
    })
    .then(function(description) {
      return peerConnection.setLocalDescription(description);
    })
    .then(function(){
      socket.emit('answer', peerConnection.localDescription);
    })

  });

  socket.on('answer', function (answer) {
    alert('other end accepted our call');
    var desc = new RTCSessionDescription(answer);
    peerConnection.setRemoteDescription(desc).catch(function() { console.error('error answer')});
  });

  socket.on('candidate', function (candidate) {
    peerConnection.addIceCandidate(candidate)
      .catch(function () {
        console.error('error while adding new ice candidade to the connection')
      });
  });
});

// Set up media stream constant and parameters.

// In this codelab, you will be streaming video only: "video: true".
// Audio will not be streamed because it is set to "audio: false" by default.
const mediaStreamConstraints = {
  video: true,
  // audio: true,
};

// Set up to exchange only video.
const offerOptions = {
  offerToReceiveVideo: 1,
};

// Define initial start time of the call (defined as connection between peers).
let startTime = null;

// Define peer connections, streams and video elements.
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

let localStream;

function handleICECandidateEvent(event) {
  if (event.candidate) {
    socket.emit('candidate', event.candidate);            
  }
}


// Define action buttons.
const startButton = document.getElementById('startButton');
const callButton = document.getElementById('callButton');
const hangupButton = document.getElementById('hangupButton');

// Set up initial action buttons status: disable call and hangup.
callButton.disabled = true;
hangupButton.disabled = true;


// Handles start button action: creates local MediaStream.
function startAction() {
  startButton.disabled = true;
  navigator.mediaDevices.getUserMedia(mediaStreamConstraints)
    .then(function (mediaStream) {
      localVideo.srcObject = mediaStream;
      localStream = mediaStream;
      trace('Received local stream.');
      callButton.disabled = false;  // Enable call button.
    })
    .catch(function(error) { trace(`navigator.getUserMedia error: ${error.toString()}.`); });
  trace('Requesting local stream.');
}

// Handles call button action: creates peer connection.
function callAction() {
  callButton.disabled = true;
  hangupButton.disabled = false;

  trace('Starting call.');
  startTime = window.performance.now();

  // Get local media stream tracks.
  const videoTracks = localStream.getVideoTracks();
  const audioTracks = localStream.getAudioTracks();
  if (videoTracks.length > 0) {
    trace(`Using video device: ${videoTracks[0].label}.`);
  }
  if (audioTracks.length > 0) {
    trace(`Using audio device: ${audioTracks[0].label}.`);
  }


  // Create peer connections and add behavior.
  peerConnection = new RTCPeerConnection(servers);
  trace('Created local peer connection object peerConnection.');

  // this event is triggered when RTCPeerConnection.setLocalDescription() is called
  // on the local side of the connection?
  peerConnection.addEventListener('icecandidate', handleICECandidateEvent);
  peerConnection.addEventListener('iceconnectionstatechange', handleICEConnectionStateChangeEvent);
  peerConnection.addEventListener('icegatheringstatechange', handleICEGatheringStateChangeEvent);
  peerConnection.addEventListener('signalingstatechange', handleSignalingStateChangeEvent);
  peerConnection.addEventListener('track', handleTrackEvent);
  
  // Add local stream to connection and create offer to connect.
  // peerConnection.addStream(localStream); // deprecated
  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

  trace('Added local stream to peerConnection.');

  // triggered as soon the attached media tracks are ready
  peerConnection.addEventListener('negotiationneeded', function(event) {
    trace('peerConnection createOffer start.');
    peerConnection.createOffer(offerOptions)
      .then(function (description) {
        trace(`Offer from peerConnection:\n${description.sdp}`);

        return peerConnection.setLocalDescription(description);
      })
      .then(function() {
        // send offer to server
        socket.emit('offer', peerConnection.localDescription);
      })
  });
  
}

// Handles hangup action: ends up call, closes connections and resets peers.
function hangupAction() {
  peerConnection.close();
  peerConnection = null;
  hangupButton.disabled = true;
  callButton.disabled = false;
  trace('Ending call.');
}

// Add click event handlers for buttons.
startButton.addEventListener('click', startAction);
callButton.addEventListener('click', callAction);
hangupButton.addEventListener('click', hangupAction);

// Logs an action (text) and the time when it happened on the console.
function trace(text) {
  text = text.trim();
  const now = (window.performance.now() / 1000).toFixed(3);

  console.log(now, text);
}


function handleICEConnectionStateChangeEvent(event) {
  trace("*** ICE connection state changed to " + peerConnection.iceConnectionState);

  switch (peerConnection.iceConnectionState) {
    case "closed":
    case "failed":
    case "disconnected":
      hangupAction();
      break;
  }
}

function handleICEGatheringStateChangeEvent(event) {
  trace("*** ICE gathering state changed to: " + peerConnection.iceGatheringState);
}

// Set up a |signalingstatechange| event handler. This will detect when
// the signaling connection is closed.
//
// NOTE: This will actually move to the new RTCPeerConnectionState enum
// returned in the property RTCPeerConnection.connectionState when
// browsers catch up with the latest version of the specification!

function handleSignalingStateChangeEvent(event) {
  trace("*** WebRTC signaling state changed to: " + peerConnection.signalingState);
  switch (peerConnection.signalingState) {
    case "closed":
      hangupAction();
      break;
  }
}


// Called by the WebRTC layer when events occur on the media tracks
// on our WebRTC call. This includes when streams are added to and
// removed from the call.
function handleTrackEvent(event) {
  trace("*** Track event");
  console.log(event.streams);
  remoteVideo.srcObject = event.streams[0];
  hangupButton.disabled = true;
}