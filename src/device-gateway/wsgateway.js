const {authenticateRoute} = require("../authentication");
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
                wsSend({
                    action: "error",
                    payload: {
                        message: "Invalid or corrupt message."
                    }
                });
            }
            // Action Switch
            switch(msg.action) {
                case "hello": {

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
