var SignalingChannel = function(config) {
    this.config_ = config;
    this.roomId_ = null;
    this.isInitiator_ = null;
    this.conn_ = null;
    this.isRegistered_ = false;

    // callback
    this.onMessage = null;
};

SignalingChannel.prototype.initiate_ = function() {
    if (this.conn_) {
        trace("Connection already opened...")
        return;
    }

    trace("Connecting...");
    firebase.initializeApp(this.config_);
    this.conn_ = firebase.database().ref();

    if (this.isRegistered_) {
        trace("User already registered...");
        return;
    }

    if (!this.roomId_) {
        trace("Room id is null...");
        return;
    }

    if (this.isInitiator_ == null) {
        trace("Is initiator is null...");
        return;
    }

    return this.conn_.child(this.roomId_).child("session").once('value').then(function(snapshot) {
        // If the user is initiator
        if ((!snapshot.val() && this.isInitiator_)) {
            this.conn_.child(this.roomId_).remove();
            return this.conn_.child(this.roomId_).child("session").child("code").set(1).then(function() {
                this.registerListener_();
                return Promise.resolve();
            }.bind(this));
        }

        // If the user is not initiator
        if (snapshot.val() && snapshot.val().code == 1 && !this.isInitiator_) {
            return this.conn_.child(this.roomId_).child("session").child("code").set(2).then(function() {
                this.registerListener_();
                return Promise.resolve();
            }.bind(this));
        }

        this.isRegistered_ = false;
        return Promise.reject();
    }.bind(this));
};

SignalingChannel.prototype.registerListener_ = function() {
    if (this.isRegistered_) {
        return;
    }

    if (this.isInitiator_) {
        this.conn_.child(this.roomId_).child("offer").on('value', function(snapshot) {
            if (snapshot.val()) {
                this.handleIncomingMessage_({ type: "offer", msg: { type: "offer", sdp: snapshot.val().sdp } });
            }
        }.bind(this));
        this.conn_.child(this.roomId_).child("remotecandidate").on('value', function(snapshot) {
            if (snapshot.val()) {
                this.handleIncomingMessage_({
                    type: "remotecandidate",
                    msg: {
                        sdpMLineIndex: snapshot.val().sdpMLineIndex,
                        candidate: snapshot.val().candidate,
                        sdpMid: snapshot.val().sdpMid
                    }
                });
            }
        }.bind(this));
        this.conn_.child(this.roomId_).child("hangup").on('value', function(snapshot) {
            if (snapshot.val()) {
                this.handleIncomingMessage_({ type: "hangup", msg: { type: "hangup", status: snapshot.val().hangup } });
            }
        }.bind(this));
    } else {
        this.conn_.child(this.roomId_).child("answer").on('value', function(snapshot) {
            if (snapshot.val()) {
                this.handleIncomingMessage_({ type: "answer", msg: { type: "answer", sdp: snapshot.val().sdp } });
            }
        }.bind(this));
        this.conn_.child(this.roomId_).child("localcandidate").on('value', function(snapshot) {
            if (snapshot.val()) {
                this.handleIncomingMessage_({
                    type: "localcandidate",
                    msg: {
                        sdpMLineIndex: snapshot.val().sdpMLineIndex,
                        candidate: snapshot.val().candidate,
                        sdpMid: snapshot.val().sdpMid
                    }
                });
            }
        }.bind(this));
        this.conn_.child(this.roomId_).child("hangup").on('value', function(snapshot) {
            if (snapshot.val()) {
                this.handleIncomingMessage_({ type: "hangup", msg: { type: "hangup", status: snapshot.val().hangup } });
            }
        }.bind(this));
    }
    this.isRegistered_ = true;
    trace("Registered listeners");
};

SignalingChannel.prototype.handleIncomingMessage_ = function(msg) {
    if (this.onMessage) this.onMessage(msg);
}

SignalingChannel.prototype.removeListener_ = function() {
    if (!this.isRegistered_) return;
    this.conn_.child(this.roomId_).child("offer").off();
    this.conn_.child(this.roomId_).child("answer").off();
    this.conn_.child(this.roomId_).child("localcandidate").off();
    this.conn_.child(this.roomId_).child("remotecandidate").off();
    this.conn_.child(this.roomId_).child("hangup").off();
    this.isRegistered_ = false;
};

SignalingChannel.prototype.close_ = function() {
    if (this.isRegistered_) {
        this.removeListener_();
    }
    if (!this.roomId_ || !this.conn_) return;

    return this.conn_.child(this.roomId_).child("hangup").child("hangup").set(true).then(function() {
        return this.conn_.child(this.roomId_).child("session").remove().then(function() {
            this.roomId_ = null;
            this.isInitiator_ = null;
            this.conn_ = null;
            return Promise.resolve();
        }.bind(this));
    }.bind(this));
};

SignalingChannel.prototype.send_ = function(msg) {
    if (!this.roomId_ || !this.conn_) return;
    this.conn_.child(this.roomId_).child(msg.type).set(msg.msg);
};