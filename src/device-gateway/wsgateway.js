const {authenticateDevice, authenticateUser} = require("../authentication");
const express = require('express');
const router = express.Router();

const Device = require("./Device");
const User = require("./User");

// Proof of Concept API Gateway
// not suitable for production!

/** @type {User[]}*/
let users = [];

/** @type {Device[]}*/
let devices = [];

router.ws(process.env.SERVER_API_PREFIX + 'gateway', function(ws, req) {
    /**
     * This connection type (device or user)
     * @type {"device"|"user"}
     */
    let type;

    /** @type {Device|User} */
    let self;

    ws.on('message', async (msgRaw) => {
        let wsSend = (msgObj) => {
            ws.send(JSON.stringify(msgObj));
        }
        let wsSendOther = (msgObj, otherWS) => {
            otherWS.send(JSON.stringify(msgObj));
        }
        console.log(msgRaw);

        try {
            let msg = JSON.parse(msgRaw);
            if(msg.action === undefined || msg.payload === undefined) {
                throw new Error("Invalid or corrupt message")
            }
            // Action Switch
            switch(msg.action) {
                case "hello": {
                    if(msg.payload.token === undefined || msg.payload.info === undefined) {
                        throw new Error("No token or identification info provided")
                    }

                    let as;
                    if(msg.payload.type === "user") {
                        // Register user as online
                        console.log("User Registering: " + msg.payload.token);
                        as = await authenticateUser(msg.payload.token);
                        if(!as) {
                            throw new Error("Could not authenticate");
                        } else {
                            wsSend({
                                action: "hello-ack",
                                payload: as
                            });
                        }
                    } else if(msg.payload.type === "device") {
                        // Register user as online
                        console.log("Device Registering: " + msg.payload.token);
                        as = await authenticateDevice(msg.payload.token);
                        if(!as) {
                            throw new Error("Could not authenticate");
                        } else {
                            devices[as.id] = new Device(as.id, msg.payload.info, ws)
                            wsSend({
                                action: "hello-ack",
                                payload: as
                            });
                        }
                    } else {
                        throw new Error("Invalid type");
                    }
                } break;

                case "unsafe-exec-cmd": {
                    /**
                     * @typedef {Object} UnsafeExecCmdMsg
                     * @property {string} deviceID - The target device ID
                     * @property {string} cmd - The command to execute
                     */
                    /** @type {UnsafeExecCmdMsg}*/
                    let pl = msg.payload;

                    if(devices[pl.deviceID] === null) {
                        throw "Failed to exec CMD: Device does not exist"
                    }

                    let target = devices[pl.deviceID];
                    wsSendOther({
                        action: "unsafe-exec-cmd",
                        payload: {
                            cmd: pl.cmd,
                            requestUserID: "todo"
                        }
                    }, target.ws)
                } break;

                case "ping": {
                    wsSend({
                        action: "ping-ack",
                        payload: "pong"
                    });
                } break;
                default:
                    wsSend({
                        action: "error",
                        payload: {
                            "message": "Invalid Action"
                        }
                    })
            }
        } catch(e) {
            wsSend({
                action: "error",
                payload: {
                    message: e.message
                }
            });
        }

    });
    ws.on('end', async () => {
        console.log("Client End");
    })
});

module.exports = router;
