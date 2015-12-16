"use strict";

module.exports = {
    ping: function () {
        this.connection.on("packet", function (packet) {
            if (packet.type === "ping-event") this.sendPacket({
                type: "ping-reply",
                data: {
                    time: packet.data.time
                }
            });
        });
    },
    send: function () {
        this.send = function (message, parent) {
            return this.connection.sendPacket({
                type: "send",
                data: {
                    content: message,
                    parent: parent
                }
            });
        };
    },
    nick: function () {
        if (!this.pendingNickname) this.pendingNickname = this.options.nickname || "";
        this._nickname = "";
        if (!this.hasOwnProperty("nickname"))
            Object.defineProperty(this, "nickname", {
                get: function () {
                    return this._nickname;
                },
                set: function (nickname) {
                    this.setNick(nickname);
                }
            });
        var that = this;
        this.setNick = function (nickname) {
            var promise = this.connection.sendPacket({
                type: "nick",
                data: {
                    name: nickname
                }
            });
            promise.then(function (packet) {
                that._nickname = packet.to;
                that.pendingNickname = that._nickname;
            }, function (error) {
                that.pendingNickname = that._nickname;
            });
            return promise;
        };
        if (this.pendingNickname) this.setNick(this.pendingNickname);
    },
    defaults: function () {
        module.exports.ping.apply(this);
        module.exports.send.apply(this);
        module.exports.nick.apply(this);
    }
}
