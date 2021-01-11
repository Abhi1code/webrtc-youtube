var loginDiv = $("#loginDiv");
var chatDiv = $("#chatDiv");
var nameInput = $("#name");
var joinBtn = $("#joinBtn");
var localVideo = $("#localVideo");
var remoteVideo = $("#remoteVideo");
var callerName = $("#callingName");
var callBtn = $("#callBtn");
var hangupBtn = $("#hangupBtn");
var info = $("#info");
var audioBtn = $("#audioBtn");
var videoBtn = $("#videoBtn");
var msgBody = $("#msgBody");
var inputMsg = $("#inputMsg");
var sendBtn = $("#sendBtn");

var configuration = {
    "iceServers": [{ url: "stun:stun2.1.google.com:19302" }, {
        url: 'turn:35.225.250.3:3478',
        credential: 'Abhi',
        username: 'Abhi'
    }]
};

var ref = firebase.database().ref();
var localName = null;
var remoteName = null;
var isCaller = false;

var pc = null;
var dc = null;
var localstream = null;

/// Firebase functions
function attachCallerListener(name) {
    if (!name) return;
    ref.child(name).child("remote").on('value', function(snapShot) {
        if (snapShot.val()) {
            callBtn.prop('disabled', true);
            isCaller = false;
            remoteName = snapShot.val().init;
            attachOfferListener(name);
        }
    });
}

function attachOfferListener(name) {
    if (!name) return;
    ref.child(name).child("offer").on('value', function(snapShot) {
        if (snapShot.val()) {
            pc.setRemoteDescription({ type: "offer", sdp: snapShot.val().sdp });
            pc.createAnswer().then(function(answer) {
                pc.setLocalDescription(answer);
                ref.child(name).child("answer").child("sdp").set(answer.sdp);
            });
        }
    });
    ref.child(name).child("remotecandidate").on('value', function(snapShot) {
        if (snapShot.val()) {
            pc.addIceCandidate({
                candidate: snapShot.val().candidate,
                sdpMid: snapShot.val().sdpMid,
                sdpMLineIndex: snapShot.val().sdpMLineIndex
            });
        }
    });
    ref.child(name).child("hangup").on('value', function(snapShot) {
        if (snapShot.val()) {
            cleanup();
        }
    });
}

function attchAnswerListener(name) {
    if (!name) return;
    ref.child(name).child("answer").on('value', function(snapShot) {
        if (snapShot.val()) {
            pc.setRemoteDescription({ type: "answer", sdp: snapShot.val().sdp });
        }
    });
    ref.child(name).child("localcandidate").on('value', function(snapShot) {
        if (snapShot.val()) {
            pc.addIceCandidate({
                candidate: snapShot.val().candidate,
                sdpMid: snapShot.val().sdpMid,
                sdpMLineIndex: snapShot.val().sdpMLineIndex
            });
        }
    });
    ref.child(name).child("hangup").on('value', function(snapShot) {
        if (snapShot.val()) {
            cleanup();
        }
    });
}

/// Webrtc functions
function initialize(name) {
    if (!name) return;
    pc = new RTCPeerConnection(configuration);
    dc = pc.createDataChannel("channel");
    dc.onopen = onopen;
    dc.onclose = onclose;
    dc.onmessage = onmessage;

    pc.onicecandidate = onicecandidate;
    pc.ontrack = ontrack;
    pc.oniceconnectionstatechange = oniceconnectionstatechange;
    pc.ondatachannel = ondatachannel;

    navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then(function(stream) {
        localVideo.prop('srcObject', stream);
        pc.addStream(stream);
        localstream = stream;
    });
}

function onicecandidate(e) {
    if (!e.candidate || !e.candidate.candidate) return;
    if (isCaller) {
        ref.child(remoteName).child("remotecandidate").set({
            candidate: e.candidate.candidate,
            sdpMLineIndex: e.candidate.sdpMLineIndex,
            sdpMid: e.candidate.sdpMid
        });
    } else {
        ref.child(localName).child("localcandidate").set({
            candidate: e.candidate.candidate,
            sdpMLineIndex: e.candidate.sdpMLineIndex,
            sdpMid: e.candidate.sdpMid
        });
    }
}

function ontrack(e) {
    remoteVideo.prop('srcObject', e.streams[0]);
}

function oniceconnectionstatechange(e) {
    if (pc.iceConnectionState === "connected") {
        hangupBtn.show();
        info.text("Connected to " + remoteName);
    }
    if (pc.iceConnectionState === "disconnected") {
        cleanup();
    }
}

function ondatachannel(e) {
    dc = e.channel;
    dc.onopen = onopen;
    dc.onclose = onclose;
    dc.onmessage = onmessage;
}

function onopen() {
    sendBtn.show();
}

function onclose() {
    sendBtn.hide();
}

function onmessage(e) {
    msgBody.append("<span id='leftmsg'>" + e.data + "</span>");
}

function cleanup() {
    if (pc) {
        pc.close();
        if (localstream) {
            if (typeof localstream.getTracks === "undefined") {
                localstream.stop();
            } else {
                localstream.getTracks().forEach(track => {
                    track.stop();
                });
            }
        }
        pc = null;
        localName = null;
        remoteName = null;
        localstream = null;
        location.reload();
    }
}

/// Button clicks
joinBtn.click(function() {
    var iname = nameInput.val();
    if (iname !== '') {
        joinBtn.prop('disabled', true);
        ref.child(iname).remove();
        ref.child(iname).child("init").set(true).then(function() {
            localName = iname;
            loginDiv.hide();
            chatDiv.show();
            initialize(iname);
            attachCallerListener(iname);
        });
    }
});

callBtn.click(function() {
    var rname = callerName.val();
    if (rname !== '') {
        isCaller = true;
        callBtn.prop('disabled', true);
        remoteName = rname;
        ref.child(remoteName).child("remote").child("init").set(localName);
        pc.createOffer().then(function(offer) {
            pc.setLocalDescription(offer);
            attchAnswerListener(remoteName);
            ref.child(remoteName).child("offer").child("sdp").set(offer.sdp);
        });
    }
});

hangupBtn.click(function() {
    if (isCaller) {
        ref.child(remoteName).child("hangup").child("hangup").set(true).then(function() {
            cleanup();
        });
    } else {
        ref.child(localName).child("hangup").child("hangup").set(true).then(function() {
            cleanup();
        });
    }
});

audioBtn.click(function() {
    var audioTracks = localstream.getAudioTracks();
    if (audioTracks.length === 0) {
        audioBtn.html("No audio");
        return;
    }

    for (var i = 0; i < audioTracks.length; ++i) {
        audioTracks[i].enabled = !audioTracks[i].enabled;
    }
    audioTracks[0].enabled ? audioBtn.html("Audio on") : audioBtn.html("Audio off");
});

videoBtn.click(function() {
    var videoTracks = localstream.getVideoTracks();
    if (videoTracks.length === 0) {
        videoBtn.html("No video");
        return;
    }

    for (var i = 0; i < videoTracks.length; ++i) {
        videoTracks[i].enabled = !videoTracks[i].enabled;
    }
    videoTracks[0].enabled ? videoBtn.html("Video on") : videoBtn.html("Video off");
});

sendBtn.click(function() {
    if (dc && dc.readyState === "open") {
        msgBody.append("<span id='rightmsg'>" + inputMsg.val() + "</span>");
        dc.send(inputMsg.val());
        inputMsg.val("");
    }
});