"use strict";

var WebSocket = require("ws");
var EventEmitter = require("events");
var util = require("./util.js");
var extensions = require("./extensions.js");
var BotConnection = require("./connection.js");

function Bot(options, extensions) {
    EventEmitter.apply(this);
    this.options = util.sanitizeOptions(options);
    this.connect();
    var that = this;
    this.connection.once("open", function () {
        that.emit("ready");
    });
}

util.inherits(Bot, EventEmitter);

Bot.prototype.use = function (extension) {
    if (!extension instanceof Function) throw new TypeError(
        "extension must be a function");
    extension.apply(this);
};
Bot.prototype.connect = function (pendingMessages) {
    this.connection = new BotConnection(util.format(this.options.endpoint, this.options.room));
    this.options.extensions.forEach(this.use, this);
    if (pendingMessages) this.connection.pendingMessages = this.connection.pendingMessages.concat(pendingMessages);
    var that = this;
    this.connection.on("reconnectRequired", function (parameters) {
        if (!parameters.delay) that.connect(parameters.pendingMessages);
        else setTimeout(function () {
            that.connect(parameters.pendingMessages);
        }, parameters.delay);
    });
};
Bot.prototype.quit = function () {
    this.emit("cleanup");
    this.connection.reconnect = false;
    this.connection.close();
    this.emit("quit");
}

Bot.extensions = extensions;

module.exports = Bot;
