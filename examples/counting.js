"use strict";

var Bot = require("../index.js");

function main() {
    var bot = new Bot({
        room: "testing",
        nickname: "TestBot"
    });
    bot.on("ready", function () {
        bot.send("Hello world!");
        callback({id: null});
    });
    bot.on("cleanup", function () {
        bot.send("/me :leaves:");
    });
    var number = 0;
    var callback = function (packet) {
        var promise = bot.send((++number).toString(), packet.id);
        if (number < 10) promise.then(function (packet) {
            setTimeout(function () {
                callback(packet);
            }, 1000);
        });
        else promise.then(function () {
            bot.quit();
        });
    };
}

if (require.main === module) main();
