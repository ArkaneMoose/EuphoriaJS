"use strict";

var util = require("util");
var WebSocket = require("ws");

var RECONNECT_DELAY = 500;
var ERROR_RECONNECT_DELAY = 1000;

function BotConnection() {
    WebSocket.apply(this, arguments);
    this.pendingMessages = [];
    this.packetId = 0;
    this.reconnect = true;
    this.on("open", function () {
        var pendingMessage;
        while (pendingMessage = this.pendingMessages.shift())
            this.send.apply(this, pendingMessage);
    });
    this.on("message", function (data, flags) {
        var packet;
        try {
            packet = JSON.parse(data);
        } catch (e) {
            this.emit("protocolError", new Error("invalid JSON"));
            return;
        }
        if (!packet.type) {
            this.emit("protocolError", new Error("missing type"));
            return;
        }
        this.emit("packet", packet);
    });
    this.on("close", function (code, message) {
        if (this.reconnect) {
            if (!this.emit("reconnectRequired", {
                pendingMessages: this.pendingMessages,
                delay: RECONNECT_DELAY
            }))
                throw new Error("Unhandled 'reconnectRequired' event");
        }
    });
    this.on("error", function () {
        if (this.reconnect) {
            if (!this.emit("reconnectRequired", {
                pendingMessages: this.pendingMessages,
                delay: ERROR_RECONNECT_DELAY
            }))
                throw new Error("Unhandled 'reconnectRequired' event");
        }
    });
}

util.inherits(BotConnection, WebSocket);

BotConnection.prototype.rawSend = WebSocket.prototype.send;
BotConnection.prototype.send = function () {
    if (this.readyState !== WebSocket.OPEN) this.pendingMessages.push(arguments);
    else this.rawSend.apply(this, arguments);
};
BotConnection.prototype.sendPacket = function (packet) {
    var promise = null;
    if (!packet.type.endsWith("-reply")) {
        packet.id = (this.packetId++).toString();
        var that = this;
        promise = new Promise(function (resolve, reject) {
            var packetHandler = function (replyPacket) {
                if (replyPacket.id === packet.id) {
                    that.removeListener("packet", packetHandler);
                    if (replyPacket.error) reject(new Error(replyPacket.error));
                    else resolve(replyPacket.data);
                }
            };
            that.on("packet", packetHandler);
        });
    }
    this.send(JSON.stringify(packet));
    return promise;
};

module.exports = BotConnection;
