var ChatBox = function(chatBoxDiv, uiConstants) {
    this.chatBoxDiv_ = chatBoxDiv;

    this.chatMsgInput_ = this.chatBoxDiv_.querySelector(uiConstants.msgerInput);
    this.msgerChat_ = this.chatBoxDiv_.querySelector(uiConstants.msgerChat);
    this.msgerForm_ = this.chatBoxDiv_.querySelector(uiConstants.msgerForm);

    this.sendListener_ = this.onsendButton_.bind(this);
    this.msgerForm_.addEventListener('submit', this.sendListener_);

    // callback
    this.sendDataMessage = null;
};

ChatBox.prototype.onsendButton_ = function(e) {
    e.preventDefault();
    const msg = this.chatMsgInput_.value;
    if (!msg) return;
    this.appendMessage_("right", msg);
    this.chatMsgInput_.value = "";
    if (this.sendDataMessage) this.sendDataMessage(msg);
};

ChatBox.prototype.appendMessage_ = function(side, text) {
    const msgHTML = `
    <div class="msg ${side}-msg">
      
      <div class="msg-bubble">
        
        <div class="msg-text">${text}</div>
      </div>
    </div>
  `;
    this.msgerChat_.insertAdjacentHTML("beforeend", msgHTML);
    this.msgerChat_.scrollTop += 300;
};

ChatBox.prototype.msgReceived = function(msg) {
    this.appendMessage_("left", msg);
};

ChatBox.prototype.removeEventListener = function() {
    this.msgerForm_.removeEventListener('submit', this.sendListener_);
};