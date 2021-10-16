const {authenticateDevice, authenticateUser} = require("../authentication");
const express = require('express');
const router = express.Router();

// Proof of Concept API Gateway
// not suitable for production!

let clients = [];

router.ws(process.env.SERVER_API_PREFIX + 'gateway', function(ws, req) {
    ws.on('message', async (msgRaw) => {
        let wsSend = (msgObj) => {
            ws.send(JSON.stringify(msgObj));
        }
        console.log(msgRaw)
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
                        as = await authenticateUser();
                    } else if(msg.payload.type === "device") {
                        // Register user as online
                        console.log("Device Registering: " + msg.payload.token);
                        as = await authenticateDevice();
                    } else {
                        throw new Error("Invalid type")
                    }
                    if(!as) {
                        throw new Error("Could not authenticate");
                    } else {
                        wsSend(as);
                    }
                }
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
