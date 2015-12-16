"use strict";

var util = require("util");
var extensions = require("./extensions.js");

var DEFAULT_SERVER = "wss://euphoria.io";
var DEFAULT_ENDPOINT = "%s/room/%s/ws";

function sanitizeOptions(options) {
    // Sanitize endpoint and server
    if (!options.endpoint) {
        options.server = options.server || DEFAULT_SERVER;
        options.server = options.server.toLowerCase();
        if (options.server.endsWith("/"))
            options.server = options.server.substring(0, options.server.length - 1);
        if (options.server.startsWith("http://") || options.server.startsWith("https://"))
            options.server = options.server.replace("http", "ws");
        if (!options.server.startsWith("ws://") && !options.server.startsWith("wss://"))
            options.server = "ws://" + options.server;
        options.endpoint = util.format(DEFAULT_ENDPOINT, options.server);
    } else options.server = (options.endpoint.match(/^\w+:\/\/[^\/]*/) || [null])[0];
    // A room is required
    if (!options.room) throw new Error("no room specified");
    if (!options.extensions) options.extensions = [extensions.defaults];
    return options;
}

module.exports = util;
util.sanitizeOptions = sanitizeOptions;
