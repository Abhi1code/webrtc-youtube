var PeerConnectionClient = function(config) {
    this.config_ = config;

    this.pc_ = new RTCPeerConnection(this.config_.configuration);
    this.pc_.onicecandidate = this.onicecandidate_.bind(this);
    this.pc_.ontrack = this.ontrack_.bind(this);
    this.pc_.oniceconnectionstatechange = this.oniceconnectionstatechange_.bind(this);
    this.pc_.ondatachannel = this.onDataChannelCreated_.bind(this);

    this.dataChannel_ = this.pc_.createDataChannel("datachannel", this.config_.dataChannelOptions);
    this.dataChannel_.onopen = this.onDataChannelOpen_.bind(this);
    this.dataChannel_.onclose = this.onDataChannelClose_.bind(this);
    this.dataChannel_.onmessage = this.onDataChannelMessage_.bind(this);

    this.isInitiator_ = null;
    this.isStarted_ = false;

    // callback
    this.sendMessage = null;
    this.onRemoteStreamAdded = null;
    this.onRemoteSdp = null;
    this.onRemoteHangup = null;

    this.onDataChannelOpen = null;
    this.onDataChannelClose = null;
    this.onDataChannelMessage = null;
};

PeerConnectionClient.prototype.addStream_ = function(stream) {
    if (!this.pc_) return;
    this.pc_.addStream(stream);
}

PeerConnectionClient.prototype.startAsCaller = function() {
    if (!this.pc_) return;
    if (this.isStarted_) return;
    this.isInitiator_ = true;
    this.isStarted_ = true;
};

PeerConnectionClient.prototype.startAsCallee = function() {
    trace("calling callee function");
    if (!this.pc_) return;
    if (this.isStarted_) return;
    this.isInitiator_ = false;
    this.isStarted_ = true;

    this.pc_.createOffer().then(this.setLocalSdpAndNotify_.bind(this));
};

PeerConnectionClient.prototype.setLocalSdpAndNotify_ = function(e) {
    this.pc_.setLocalDescription(e);
    var temp = (this.isInitiator_) ? "answer" : "offer";
    var msg = { type: temp, msg: { type: temp, sdp: e.sdp } };
    this.sendMessageToServer_(msg);
};

PeerConnectionClient.prototype.onicecandidate_ = function(e) {
    if (e.candidate) {
        var temp = (this.isInitiator_) ? "localcandidate" : "remotecandidate";
        var message = {
            type: temp,
            msg: {
                candidate: e.candidate.candidate,
                sdpMLineIndex: e.candidate.sdpMLineIndex,
                sdpMid: e.candidate.sdpMid
            }
        };
        this.sendMessageToServer_(message);
    }
};

PeerConnectionClient.prototype.ontrack_ = function(e) {
    if (this.onRemoteStreamAdded) this.onRemoteStreamAdded(e.streams[0]);
};

PeerConnectionClient.prototype.oniceconnectionstatechange_ = function(e) {
    // TODO
};

PeerConnectionClient.prototype.setRemoteSdp_ = function(e) {
    this.pc_.setRemoteDescription(new RTCSessionDescription(e)).then(function() {
        var remoteStreams = this.pc_.getRemoteStreams();
        if (this.onRemoteSdp) this.onRemoteSdp(remoteStreams.length > 0);
    }.bind(this));
};

PeerConnectionClient.prototype.doAnswer_ = function() {
    this.pc_.createAnswer().then(this.setLocalSdpAndNotify_.bind(this));
};

PeerConnectionClient.prototype.onMessage_ = function(msg) {
    if (!msg) return;
    if (this.isInitiator_ && msg.type === "offer") {
        this.setRemoteSdp_(msg.msg);
        this.doAnswer_();
    }
    if (!this.isInitiator_ && msg.type === "answer") {
        this.setRemoteSdp_(msg.msg);
    }
    if (msg.type === "localcandidate" || msg.type === "remotecandidate") {
        this.pc_.addIceCandidate(msg.msg);
    }
    if (msg.type === "hangup" && msg.msg.status === true) {
        if (this.onRemoteHangup) this.onRemoteHangup();
    }
};

PeerConnectionClient.prototype.sendMessageToServer_ = function(msg) {
    trace("sending message");
    if (this.sendMessage) this.sendMessage(msg);
};

PeerConnectionClient.prototype.close_ = function() {
    if (!this.pc_) return;
    this.pc_.close();
    this.pc_ = null;
};

PeerConnectionClient.prototype.onDataChannelCreated_ = function(e) {
    this.dataChannel_ = e.channel;
    this.dataChannel_.onopen = this.onDataChannelOpen_.bind(this);
    this.dataChannel_.onclose = this.onDataChannelClose_.bind(this);
    this.dataChannel_.onmessage = this.onDataChannelMessage_.bind(this);
};

PeerConnectionClient.prototype.onDataChannelOpen_ = function(e) {
    if (!this.dataChannel_) return;
    if (this.onDataChannelOpen) this.onDataChannelOpen();
};

PeerConnectionClient.prototype.onDataChannelClose_ = function(e) {
    if (!this.dataChannel_) return;
    if (this.onDataChannelClose) this.onDataChannelClose();
};

PeerConnectionClient.prototype.onDataChannelMessage_ = function(e) {
    if (!this.dataChannel_) return;
    if (this.onDataChannelMessage) this.onDataChannelMessage(e.data);
};

PeerConnectionClient.prototype.sendDataMessage_ = function(msg) {
    if (!this.dataChannel_) return;
    this.dataChannel_.send(msg);
};