var Call = function(params) {
    this.params_ = params;

    this.pcClient_ = null;

    // callbacks
    this.onMediaSuccess = null;
    this.onMediaFailed = null;
    this.showSharingDiv = null;
    this.onRemoteStreamAdded = null;
    this.onRemoteSdp = null;
    this.onRemoteHangup = null;
    this.onRoomFull = null;

    this.onDataChannelOpen = null;
    this.onDataChannelClose = null;
    this.onDataChannelMessage = null;

    this.channel_ = new SignalingChannel(this.params_.firebaseConfig);
};

Call.prototype.start_ = function(roomId, isInitiator) {
    this.connectToRoom_(roomId, isInitiator);
};

Call.prototype.onMessageReceived_ = function(msg) {
    this.createpcClient_().then(this.pcClient_.onMessage_(msg));
};

Call.prototype.connectToRoom_ = function(roomId, isInitiator) {
    this.params_.roomId = roomId;
    this.params_.isInitiator = isInitiator;

    this.channel_.roomId_ = roomId;
    this.channel_.isInitiator_ = isInitiator;

    this.channel_.initiate_().then(function() {

        var getPath = this.params_.roomServer + '/?id=' + this.params_.roomId;
        window.history.replaceState({ id: '100' }, "Room", getPath);

        this.channel_.onMessage = this.onMessageReceived_.bind(this);

        this.maybeGetMedia_().then(function() {
            this.startSignalling_();
        }.bind(this)).catch(function() {
            // TODO handle when media fails
        }.bind(this));

    }.bind(this)).catch(function() {
        if (this.onRoomFull) this.onRoomFull();
    }.bind(this));
};

Call.prototype.maybeGetMedia_ = function() {
    var mediaConstraints = this.params_.mediaConstraints;
    var mediaPromise = null;
    mediaPromise = navigator.mediaDevices.getUserMedia(mediaConstraints).then(function(stream) {
        this.onUserMediaSuccess_(stream);
        return Promise.resolve();
    }.bind(this)).catch(function(error) {
        this.onUserMediaFailed_(error);
        return Promise.reject();
    }.bind(this));
    return mediaPromise;
};

Call.prototype.onUserMediaSuccess_ = function(stream) {
    this.localStream_ = stream;
    if (this.onMediaSuccess) this.onMediaSuccess(stream);
};

Call.prototype.onUserMediaFailed_ = function(error) {
    if (this.onMediaFailed) this.onMediaFailed(error);
};

Call.prototype.createpcClient_ = function() {
    return new Promise(function(resolve, reject) {
        if (this.pcClient_) {
            resolve();
            return;
        }
        this.pcClient_ = new PeerConnectionClient(this.params_);
        this.pcClient_.sendMessage = this.sendMessage_.bind(this);
        this.pcClient_.onRemoteStreamAdded = this.onRemoteStreamAdded;
        this.pcClient_.onRemoteSdp = this.onRemoteSdp;
        this.pcClient_.onRemoteHangup = this.onRemoteHangup;
        this.pcClient_.onDataChannelOpen = this.onDataChannelOpen;
        this.pcClient_.onDataChannelClose = this.onDataChannelClose;
        this.pcClient_.onDataChannelMessage = this.onDataChannelMessage;
        resolve();
    }.bind(this));
};


Call.prototype.startSignalling_ = function() {
    if (this.params_.isInitiator && this.showSharingDiv) {
        var getPath = this.params_.roomServer + '/?id=' + this.params_.roomId;
        this.showSharingDiv(getPath);
    }

    trace("Started signalling");
    this.createpcClient_().then(function() {
        trace("Peer connection class created");
        if (this.localStream_) {
            this.pcClient_.addStream_(this.localStream_);
        }
        if (this.params_.isInitiator) {
            this.pcClient_.startAsCaller();
        } else {
            this.pcClient_.startAsCallee();
        }
    }.bind(this));
};

Call.prototype.toggleVideoMute_ = function() {
    var videoTracks = this.localStream_.getVideoTracks();
    if (videoTracks.length === 0) {
        trace('No local video available.');
        return;
    }

    trace('Toggling video mute state.');
    for (var i = 0; i < videoTracks.length; ++i) {
        videoTracks[i].enabled = !videoTracks[i].enabled;
    }
    trace('Video ' + (videoTracks[0].enabled ? 'unmuted.' : 'muted.'));
};

Call.prototype.toggleAudioMute_ = function() {
    var audioTracks = this.localStream_.getAudioTracks();
    if (audioTracks.length === 0) {
        trace('No local audio available.');
        return;
    }

    trace('Toggling audio mute state.');
    for (var i = 0; i < audioTracks.length; ++i) {
        audioTracks[i].enabled = !audioTracks[i].enabled;
    }
    trace('Audio ' + (audioTracks[0].enabled ? 'unmuted.' : 'muted.'));
};

Call.prototype.sendMessage_ = function(msg) {
    if (!this.channel_) return;
    this.channel_.send_(msg);
};

Call.prototype.hangup = function() {
    if (this.localStream_) {
        if (typeof this.localStream_.getTracks === "undefined") {
            this.localStream_.stop();
        } else {
            this.localStream_.getTracks().forEach(function(track) {
                track.stop();
            });
        }
        this.localStream_ = null;
    }

    if (!this.params_.roomId) return;

    if (this.pcClient_) {
        this.pcClient_.close_();
        this.pcClient_ = null;
    }

    if (this.channel_) {
        return this.channel_.close_().then(function() {
            trace("Cleanup completed ...");
            return Promise.resolve();
        }).catch(function() {
            trace("Some error occured...");
            return Promise.resolve();
        });
    }
};

Call.prototype.sendChannelMessage = function(msg) {
    if (!this.pcClient_) return;
    this.pcClient_.sendDataMessage_(msg);
}