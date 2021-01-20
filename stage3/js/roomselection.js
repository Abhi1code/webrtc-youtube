var RoomSelection = function(roomSelectionDiv, uiConstants) {
    this.roomSelectionDiv_ = roomSelectionDiv;
    this.roomIdInput_ = this.roomSelectionDiv_.querySelector(uiConstants.roomSelectionInput);
    this.roomIdInputLabel_ = this.roomSelectionDiv_.querySelector(uiConstants.roomSelectionInputLabel);
    this.roomJoinButton_ = this.roomSelectionDiv_.querySelector(uiConstants.roomSelectionJoinButton);
    this.roomRandomButton_ = this.roomSelectionDiv_.querySelector(uiConstants.roomSelectionRandomButton);

    this.roomIdInput_.value = randomString(9);
    this.onRoomIdInput_();

    this.roomIdInputListener_ = this.onRoomIdInput_.bind(this);
    this.roomIdInput_.addEventListener('input', this.roomIdInputListener_);

    this.roomRandomButtonListener_ = this.onRandomButton_.bind(this);
    this.roomRandomButton_.addEventListener(
        'click', this.roomRandomButtonListener_);

    this.roomJoinButtonListener_ = this.onJoinButton_.bind(this);
    this.roomJoinButton_.addEventListener(
        'click', this.roomJoinButtonListener_);

    // callback
    this.onJoinRoom = null;
};

RoomSelection.prototype.onRoomIdInput_ = function() {
    var room = this.roomIdInput_.value;
    var valid = room.length >= 5;
    var re = /^([a-zA-Z0-9-_]+)+$/;
    valid = valid && re.exec(room);
    if (valid) {
        this.roomJoinButton_.disabled = false;
        //this.roomIdInput_.classList.remove('invalid');
        this.roomIdInputLabel_.classList.add('hidden');
    } else {
        this.roomJoinButton_.disabled = true;
        //this.roomIdInput_.classList.add('invalid');
        this.roomIdInputLabel_.classList.remove('hidden');
    }
};

RoomSelection.prototype.onRandomButton_ = function() {
    this.roomIdInput_.value = randomString(9);
    this.onRoomIdInput_();
};

RoomSelection.prototype.onJoinButton_ = function() {
    if (this.onJoinRoom) this.onJoinRoom(this.roomIdInput_.value);
};

RoomSelection.prototype.removeEventListener_ = function() {
    this.roomIdInput_.removeEventListener('input', this.roomIdInputListener_);
    this.roomRandomButton_.removeEventListener('click', this.roomRandomButtonListener_);
    this.roomJoinButton_.removeEventListener('click', this.roomJoinButtonListener_);
};