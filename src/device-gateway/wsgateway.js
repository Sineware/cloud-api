const {authenticateDevice, authenticateUser, userHasDevicePermissions, getUserByID, getDeviceByID, userIsInOrg, getDevicesByOrgID} = require("../authentication");
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
                            let userObj = new User(as.id, msg.payload.info, ws);
                            users[as.id] = userObj;
                            self = userObj;
                            type = "user";
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
                            let deviceObj = new Device(as.id, msg.payload.info, ws);
                            devices[as.id] = deviceObj;
                            self = deviceObj;
                            type = "device";
                            wsSend({
                                action: "hello-ack",
                                payload: as
                            });
                        }
                    } else {
                        throw new Error("Invalid type");
                    }
                } break;

                // User -> Device
                case "unsafe-exec-cmd": {
                    /**
                     * @typedef {Object} UnsafeExecCmdMsg
                     * @property {string} deviceID - The target device ID
                     * @property {string} cmd - The command to execute
                     */
                    /** @type {UnsafeExecCmdMsg}*/
                    let pl = msg.payload;

                    if(self === undefined) {
                        throw new Error("Not authenticated")
                    }

                    if(!(await userHasDevicePermissions(self.id, pl.deviceID))) {
                        throw new Error("Failed to exec CMD: Permission to interact with device denied");
                    }

                    if(devices[pl.deviceID] === undefined) {
                        throw new Error("Failed to exec CMD: Device does not exist or is not online");
                    }

                    let target = devices[pl.deviceID];
                    wsSendOther({
                        action: "unsafe-exec-cmd",
                        payload: {
                            cmd: pl.cmd,
                            requestUserID: self.id
                        }
                    }, target.ws);
                } break;

                // Device -> User
                case "stream-terminal": {
                    /**
                     * @typedef {Object} StreamTerminalMsg
                     * @property {string} userID - The target user ID
                     * @property {string} output - A line of terminal output
                     */
                    /** @type {StreamTerminalMsg}*/
                    let pl = msg.payload;

                    if(!(await userHasDevicePermissions(pl.userID, self.id))) {
                        throw new Error("Failed to stream: Permission to interact with user denied");
                    }

                    if(users[pl.userID] === undefined) {
                        throw new Error("Failed to stream: User does not exist or is not online")
                    }
                    wsSendOther({
                        action: "stream-terminal",
                        payload: {
                            requestDeviceID: self.id,
                            output: pl.output
                        }
                    }, users[pl.userID].ws)
                } break;

                case "get-devices": {
                    /**
                     * @typedef {Object} GetDevicesMsg
                     * @property {string} orgID - The org ID
                     */
                    /** @type {GetDevicesMsg}*/
                    let pl = msg.payload;

                    if(self === undefined) {
                        throw new Error("Not authenticated")
                    }

                    if(!(await userIsInOrg(self.id, pl.orgID))) {
                        throw new Error("Failed to get devices: Not authorized for OrgID");
                    }

                    wsSend({
                        action: "get-devices-ack",
                        payload: (await getDevicesByOrgID(pl.orgID))
                    });

                } break;

                case "get-self": {
                    if(self === undefined) {
                        throw new Error("Not authenticated")
                    }
                    // AuthServer User
                    let asUser = await getUserByID(self.id);
                    wsSend({
                        action: "get-self-ack",
                        payload: {type, self: asUser}
                    });
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
