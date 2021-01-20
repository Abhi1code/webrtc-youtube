// Keep this in sync with the HTML element id attributes. Keep it sorted.
var UI_CONSTANTS = {
    chatBoxDiv: '#chatbox',
    chatScreen: '#chatscreen',
    confirmJoinButton: '#confirm-join-button',
    confirmJoinDiv: '#confirm-join-div',
    confirmJoinRoomSpan: '#confirm-join-room-span',
    fullscreenSvg: '#fullscreen',
    hangupSvg: '#hangup',
    icons: '#icons',
    infoDiv: '#info-div',
    localVideo: '#local-video',
    msgerChat: '#msger-chat',
    msgerForm: '#msger-inputarea',
    msgerInput: '#msger-input',
    miniVideo: '#mini-video',
    muteAudioSvg: '#mute-audio',
    muteVideoSvg: '#mute-video',
    newRoomButton: '#new-room-button',
    newRoomLink: '#new-room-link',
    privacyLinks: '#privacy',
    remoteVideo: '#remote-video',
    rejoinButton: '#rejoin-button',
    rejoinDiv: '#rejoin-div',
    rejoinLink: '#rejoin-link',
    roomLinkHref: '#room-link-href',
    roomSelectionDiv: '#room-selection',
    roomSelectionInput: '#room-id-input',
    roomSelectionInputLabel: '#room-id-input-label',
    roomSelectionJoinButton: '#join-button',
    roomSelectionRandomButton: '#random-button',
    sharingDiv: '#sharing-div',
    statusDiv: '#status-div',
    turnInfoDiv: '#turn-info-div',
    videosDiv: '#videos',
};

// The controller that connects the Call with the UI.
var AppController = function(loadingParams) {

    this.chatBoxDiv_ = $$(UI_CONSTANTS.chatBoxDiv);
    this.chatScreenSvg_ = $$(UI_CONSTANTS.chatScreen);
    this.hangupSvg_ = $$(UI_CONSTANTS.hangupSvg);
    this.icons_ = $$(UI_CONSTANTS.icons);
    this.localVideo_ = $$(UI_CONSTANTS.localVideo);
    this.miniVideo_ = $$(UI_CONSTANTS.miniVideo);
    this.sharingDiv_ = $$(UI_CONSTANTS.sharingDiv);
    this.statusDiv_ = $$(UI_CONSTANTS.statusDiv);
    this.turnInfoDiv_ = $$(UI_CONSTANTS.turnInfoDiv);
    this.remoteVideo_ = $$(UI_CONSTANTS.remoteVideo);
    this.videosDiv_ = $$(UI_CONSTANTS.videosDiv);
    this.roomLinkHref_ = $$(UI_CONSTANTS.roomLinkHref);
    this.rejoinDiv_ = $$(UI_CONSTANTS.rejoinDiv);
    this.rejoinLink_ = $$(UI_CONSTANTS.rejoinLink);
    this.newRoomLink_ = $$(UI_CONSTANTS.newRoomLink);
    this.rejoinButton_ = $$(UI_CONSTANTS.rejoinButton);
    this.newRoomButton_ = $$(UI_CONSTANTS.newRoomButton);
    this.muteAudioIconSet_ = $$(UI_CONSTANTS.muteAudioSvg);
    this.muteVideoIconSet_ = $$(UI_CONSTANTS.muteVideoSvg);

    this.loadingParams_ = loadingParams;
    this.roomSelection_ = null;
    this.localStream_ = null;

    if (findGetParameter("id")) {
        const rid = findGetParameter("id");
        var confirmJoinDiv = $$(UI_CONSTANTS.confirmJoinDiv);
        this.show_(confirmJoinDiv);

        $$(UI_CONSTANTS.confirmJoinButton).onclick = function() {
            this.hide_(confirmJoinDiv);
            this.createCall_();
            this.finishCallSetup_(rid, false);
        }.bind(this);
    } else {
        this.showRoomSelection_();
    }
};

AppController.prototype.showRoomSelection_ = function() {
    var roomSelectionDiv = $$(UI_CONSTANTS.roomSelectionDiv);
    this.roomSelection_ = new RoomSelection(roomSelectionDiv, UI_CONSTANTS);
    this.show_(roomSelectionDiv);
    this.roomSelection_.onJoinRoom = function(value) {
        this.hide_(roomSelectionDiv);
        this.roomSelection_.removeEventListener_();
        this.roomSelection_ = null;
        this.createCall_();
        this.finishCallSetup_(value, true);
    }.bind(this);
};

AppController.prototype.createCall_ = function() {
    this.call_ = new Call(this.loadingParams_);
    this.call_.onMediaSuccess = this.onMediaSuccess_.bind(this);
    this.call_.onMediaFailed = this.onMediaFailed_.bind(this);
    this.call_.showSharingDiv = this.showSharingDiv_.bind(this);
    this.call_.onRemoteSdp = this.onRemoteSdp_.bind(this);
    this.call_.onRemoteStreamAdded = this.onRemoteStreamAdded_.bind(this);
    this.call_.onRemoteHangup = this.onRemoteHangup_.bind(this);
    this.call_.onRoomFull = this.onRoomFull_.bind(this);

    this.call_.onDataChannelOpen = this.onDataChannelOpen_.bind(this);
    this.call_.onDataChannelClose = this.onDataChannelClose_.bind(this);
    this.call_.onDataChannelMessage = this.onDataChannelMessage_.bind(this);
};

AppController.prototype.onRemoteSdp_ = function(flag) {
    if (flag) {
        this.waitForRemoteVideo_();
    } else {
        this.transitionToActive_();
    }
};

AppController.prototype.onRemoteStreamAdded_ = function(stream) {
    this.deactivate_(this.sharingDiv_);
    this.remoteVideo_.srcObject = stream;
};

AppController.prototype.finishCallSetup_ = function(roomId, isInitiator) {
    this.call_.start_(roomId, isInitiator);
    this.setupUi_();
};

AppController.prototype.showSharingDiv_ = function(url) {
    this.displaySharingInfo_(url);
};

AppController.prototype.onMediaSuccess_ = function(stream) {
    this.localStream_ = stream;
    trace("Attaching local stream");
    this.localVideo_.srcObject = this.localStream_;
    this.show_(this.localVideo_);
    this.show_(this.icons_);
};

AppController.prototype.onMediaFailed_ = function(error) {
    trace("Error occured, media error");
    alert("Media error");
};

AppController.prototype.show_ = function(element) {
    element.classList.remove('hidden');
};

AppController.prototype.hide_ = function(element) {
    element.classList.add('hidden');
};

AppController.prototype.activate_ = function(element) {
    element.classList.add('active');
};

AppController.prototype.deactivate_ = function(element) {
    element.classList.remove('active');
};

AppController.prototype.setupUi_ = function() {
    this.iconEventSetup_();
    window.onmousemove = this.showIcons_.bind(this);

    $$(UI_CONSTANTS.muteAudioSvg).onclick = this.toggleAudioMute_.bind(this);
    $$(UI_CONSTANTS.muteVideoSvg).onclick = this.toggleVideoMute_.bind(this);
    $$(UI_CONSTANTS.hangupSvg).onclick = this.hangup_.bind(this);
    $$(UI_CONSTANTS.chatScreen).onclick = this.toggleChatBoxDiv_.bind(this);

};

AppController.prototype.toggleAudioMute_ = function() {
    this.call_.toggleAudioMute_();
    this.toggle_(this.muteAudioIconSet_);
};

AppController.prototype.toggleVideoMute_ = function() {
    this.call_.toggleVideoMute_();
    this.toggle_(this.muteVideoIconSet_);
};

AppController.prototype.toggleChatBoxDiv_ = function() {
    if (this.chatBoxDiv_.classList.contains('hidden')) {
        this.show_(this.chatBoxDiv_);
    } else {
        this.hide_(this.chatBoxDiv_);
    }
};

AppController.prototype.hangup_ = function() {
    trace("Hanging up");
    this.hide_(this.icons_);
    this.displayStatus_("Hanging up");
    window.mousemove = null;
    this.call_.hangup().then(function() {
        window.location.assign(this.loadingParams_.roomServer);
    }.bind(this)).catch(function() {
        window.location.assign(this.loadingParams_.roomServer);
    }.bind(this));
};

AppController.prototype.onRemoteHangup_ = function() {
    this.transitionToDone_();
    this.displayStatus_("The remote side hung up.");
    this.activate_(this.rejoinDiv_);
    this.hide_(this.icons_);
    this.call_.hangup();
    this.newRoomButton_.addEventListener('click', function() {
        window.location.assign(this.loadingParams_.roomServer);
    }.bind(this));
};

AppController.prototype.onRoomFull_ = function() {
    this.hide_($$(UI_CONSTANTS.confirmJoinDiv));
    this.displayStatus_('Room is already full.');
    //this.transitionToWaiting_();
    this.activate_(this.rejoinDiv_);
    this.newRoomButton_.addEventListener('click', function() {
        window.location.assign(this.loadingParams_.roomServer);
    }.bind(this));
};

AppController.prototype.displayStatus_ = function(status) {
    if (status === '') {
        this.deactivate_(this.statusDiv_);
    } else {
        this.activate_(this.statusDiv_);
    }
    this.statusDiv_.innerHTML = status;
};

AppController.prototype.displaySharingInfo_ = function(url) {
    this.roomLinkHref_.href = url;
    this.roomLinkHref_.text = url;
    this.roomLink_ = url;
    this.activate_(this.sharingDiv_);
};

AppController.prototype.showIcons_ = function() {
    if (!this.icons_.classList.contains('active')) {
        this.activate_(this.icons_);
        this.setIconTimeout_();
    }
};

AppController.prototype.hideIcons_ = function() {
    if (this.icons_.classList.contains('active')) {
        this.deactivate_(this.icons_);
    }
};

AppController.prototype.setIconTimeout_ = function() {
    if (this.hideIconsAfterTimeout) {
        window.clearTimeout.bind(this, this.hideIconsAfterTimeout);
    }
    this.hideIconsAfterTimeout = window.setTimeout(function() {
        this.hideIcons_();
    }.bind(this), 5000);
};

AppController.prototype.iconEventSetup_ = function() {
    this.icons_.onmouseenter = function() {
        window.clearTimeout(this.hideIconsAfterTimeout);
    }.bind(this);

    this.icons_.onmouseleave = function() {
        this.setIconTimeout_();
    }.bind(this);
};

AppController.prototype.toggle_ = function(element) {
    if (element.classList.contains('on')) {
        element.classList.remove('on');
        // turn it off: CSS hides `svg path.on` and displays `svg path.off`
    } else {
        // turn it on: CSS displays `svg.on path.on` and hides `svg.on path.off`
        element.classList.add('on');
    }
};

AppController.prototype.waitForRemoteVideo_ = function() {
    // Wait for the actual video to start arriving before moving to the active
    // call state.
    if (this.remoteVideo_.readyState >= 2) { // i.e. can play
        this.transitionToActive_();
    } else {
        this.remoteVideo_.oncanplay = this.waitForRemoteVideo_.bind(this);
    }
};

AppController.prototype.transitionToActive_ = function() {
    // Stop waiting for remote video.
    this.remoteVideo_.oncanplay = undefined;

    // Prepare the remote video and PIP elements.
    trace('reattachMediaStream: ' + this.localVideo_.srcObject);
    this.miniVideo_.srcObject = this.localVideo_.srcObject;

    // Transition opacity from 0 to 1 for the remote and mini videos.
    this.activate_(this.remoteVideo_);
    this.activate_(this.miniVideo_);
    // Transition opacity from 1 to 0 for the local video.
    this.deactivate_(this.localVideo_);
    this.localVideo_.srcObject = null;
    // Rotate the div containing the videos 180 deg with a CSS transform.
    this.activate_(this.videosDiv_);
    this.show_(this.hangupSvg_);
    this.displayStatus_('');
};

AppController.prototype.transitionToDone_ = function() {
    // Stop waiting for remote video.
    this.remoteVideo_.oncanplay = undefined;
    this.deactivate_(this.localVideo_);
    this.deactivate_(this.remoteVideo_);
    this.deactivate_(this.miniVideo_);
    this.hide_(this.hangupSvg_);
    this.activate_(this.rejoinDiv_);
    this.show_(this.rejoinDiv_);
    this.displayStatus_('');
};

AppController.prototype.onDataChannelOpen_ = function() {
    this.chatboxClass_ = new ChatBox(this.chatBoxDiv_, UI_CONSTANTS);
    this.chatboxClass_.sendDataMessage = function(msg) {
        if (!this.call_) return;
        this.call_.sendChannelMessage(msg);
    }.bind(this);
    this.show_(this.chatScreenSvg_);
};

AppController.prototype.onDataChannelClose_ = function() {
    this.hide_(this.chatScreenSvg_);
    this.hide_(this.chatBoxDiv_);
    if (!this.chatboxClass_) return;
    this.chatboxClass_.removeEventListener();
    this.chatboxClass_ = null;
};

AppController.prototype.onDataChannelMessage_ = function(msg) {
    if (!this.chatboxClass_) return;
    this.chatboxClass_.msgReceived(msg);
    this.show_(this.chatBoxDiv_);
};