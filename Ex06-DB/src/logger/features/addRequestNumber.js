"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addRequestNumber = void 0;
const winston_1 = require("winston");
const server_1 = require("../../server");
exports.addRequestNumber = (0, winston_1.format)((info, opts) => {
    if (server_1.requestNumber)
        info.requestNumber = server_1.requestNumber;
    return info;
});
