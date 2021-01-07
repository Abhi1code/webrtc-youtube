var localVideo = document.querySelector("#localVideo");
var remoteVideo = document.querySelector("#remoteVideo");

var localstream = null;

var hangup = document.querySelector("#hangup");
hangup.addEventListener('click', hangupClick);

var call = document.querySelector("#call");
call.addEventListener('click', callClick);

var send11 = document.querySelector("#send1");
send11.addEventListener('click', send1);

var send21 = document.querySelector("#send2");
send21.addEventListener('click', send2);

var configuration = {
    "iceServers": [{ url: "stun:stun2.1.google.com:19302" }, {
        url: 'turn:35.225.250.3:3478',
        credential: 'Abhi',
        username: 'Abhi'
    }]
};

var pc1 = new RTCPeerConnection(configuration);
pc1.onicecandidate = onicecandidate1;
pc1.ontrack = ontrack1;
pc1.ondatachannel = ondatachannel1;
pc1.onsignalingstatechange = onsignalingstatechange;
pc1.oniceconnectionstatechange = oniceconnectionstatechange;
var dc1 = pc1.createDataChannel("channel1");
dc1.onopen = onopen1;
dc1.onclose = onclose1;
dc1.onmessage = onmessage1;

var pc2 = new RTCPeerConnection(configuration);
pc2.onicecandidate = onicecandidate2;
pc2.ontrack = ontrack2;
pc2.ondatachannel = ondatachannel2;
var dc2 = pc2.createDataChannel("channel2");
dc2.onopen = onopen2;
dc2.onclose = onclose2;
dc2.onmessage = onmessage2;


function onsignalingstatechange() {
    console.log('Signaling state changed to: ' + pc1.signalingState);
}

function oniceconnectionstatechange() {
    console.log('ICE connection state changed to: ' + pc1.iceConnectionState);
}

function callClick(event) {
    pc1.createOffer().then(function(offer) {
        pc1.setLocalDescription(offer);
        pc2.setRemoteDescription(offer);
        pc2.createAnswer().then(function(answer) {
            pc2.setLocalDescription(answer);
            pc1.setRemoteDescription(answer);
        });
    });
}

function hangupClick(event) {
    pc1.close();
    pc2.close();
    if (typeof localstream.getTracks === "undefined") {
        localstream.stop();
    } else {
        localstream.getTracks().forEach(track => {
            track.stop();
        });
    }
}

function onicecandidate1(event) {
    pc2.addIceCandidate(event.candidate);
}

function onicecandidate2(event) {
    pc1.addIceCandidate(event.candidate);
}

function ontrack1(e) {

}

function ontrack2(e) {
    remoteVideo.srcObject = e.streams[0];
}

navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then(function(stream) {
    localVideo.srcObject = stream;
    localstream = stream;
    pc1.addStream(stream);
});

function ondatachannel1(channel) {
    dc1 = channel.channel;
    dc1.onopen = onopen1;
    dc1.onclose = onclose1;
    dc1.onmessage = onmessage1;
}

function ondatachannel2(channel) {
    dc2 = channel.channel;
    dc2.onopen = onopen2;
    dc2.onclose = onclose2;
    dc2.onmessage = onmessage2;
}

function onopen1() {
    console.log("channel opened for user 1");
}

function onopen2() {
    console.log("channel opened for user 2");
}

function onclose1() {
    console.log("channel closed for user 1");
}

function onclose2() {
    console.log("channel closed for user 1");
}

function onmessage1(msg) {
    box1.value = msg.data;
}

function onmessage2(msg) {
    box2.value = msg.data;
}

function send1(event) {
    if (dc1.readyState === "open") {
        dc1.send(box1.value);
    }
}

function send2(event) {
    if (dc2.readyState === "open") {
        dc2.send(box2.value);
    }
}