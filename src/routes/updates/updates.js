const express = require('express');
const fileUpload = require('express-fileupload');
const { v4: uuidv4, validate: uuidValidate } = require('uuid');
const Ajv = require("ajv").default;
const fs = require('fs');

const ajv = new Ajv()
const router = express.Router();
const redis = require('../../db');
const {updatePackageSchema} = require("./schemas");
const authenticateRoute = require("../../authentication");

const prefix = process.env.SERVER_API_PREFIX + "update"

router.use(fileUpload({
    createParentPath: true
}));

// Get an update (/update)
router.get(prefix, async (req, res) => {
    if(typeof req.body.uuid != "undefined" && uuidValidate(req.body.uuid)) {
        let uuid = req.body.uuid;
        let update = await redis.hgetall("update:" + uuid);
        res.send(update);
    } else {
        let updateReq = req.body;
        let updateUUID = await redis.get("update:" + updateReq.product + ":" + updateReq.variant + ":" + updateReq.channel);
        let update = await redis.hgetall("update:" + updateUUID);
        res.send(update);
    }
});
// Get all updates (/update/all)
router.get(prefix + "/all", async (req, res) => {
    let uuidList = await redis.lrange("update:list", 0, -1);
    let updateList = [];
    for(let uuid of uuidList) {
        try {
            let update = await redis.hgetall("update:" + uuid);
            updateList.push(update);
        } catch (e) {}
    }
    await res.send(updateList);
});

// Push an update to the server (/update)
// Authenticated route.
// Requires a update package to be uploaded first (/upload)
router.post(prefix, authenticateRoute, async (req, res) => {
    const validateUpdatePackage = ajv.compile(updatePackageSchema);
    if(!validateUpdatePackage(req.body)) {
        return res.status(400).send({error: validateUpdatePackage.errors});
    }
    if(!uuidValidate(req.body.uuid)) {
        return res.status(400).send({error: "A valid UUID was not provided"});
    }
    if(!fs.existsSync(process.env.SERVER_HOME + "files/updates/" + req.body.uuid)) {
        return res.status(400).send({error: "File with that UUID does not exist on the server."});
    }
    let update = req.body;
    try {
        await redis.hset("update:" + update.uuid, update);
        // Set the pointer for update:product:variant:channel
        // todo add to update:list (and allow not setting channel pointer)
        await redis.lpush("update:list", update.uuid);
        if(update.setPointer) await redis.set("update:" + update.product + ":" + update.variant + ":" + update.channel, update.uuid);
        res.send(update);
    } catch (e) {
        console.error("Failed to add update package to redis!");
        console.error(e);
        return res.status(500).send({error: e.message});
    }
});
// Delete an update from the system
// Authenticated route.
router.delete(prefix, authenticateRoute, async (req, res) => {
    if(typeof req.body.uuid == "undefined" || !uuidValidate(req.body.uuid)) {
        return res.status(400).send({error: "A valid UUID was not provided"});
    }
    let uuid = req.body.uuid;
    try {
        await redis.del("update:" + uuid);
        res.send({uuid});
    } catch (e) {
        console.error("Failed to delete update by UUID");
        console.error(e);
        res.status(500).send({error: e.message});
    }
})
// Upload the update package to the server. (/update/upload)
// Authenticated route.
router.post(prefix + "/upload", authenticateRoute, async (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }
    try {
        // Generate a UUID to identify the update package
        let uuid = uuidv4();
        let path = process.env.SERVER_HOME + "files/updates/" + uuid;
        await req.files.update_package.mv(path);
        await res.send({uuid});
    } catch (e) {
       console.error("There was an error moving the uploaded file.");
       console.error(e);
       res.status(500).send();
    }
});

// Download the update package given a UUID (/update/download)
router.get(prefix + "/download", async (req, res) => {
    if(typeof req.body.uuid == "undefined" || !uuidValidate(req.body.uuid)) {
        return res.status(400).send({error: "A valid UUID was not provided"});
    }
    await res.sendFile("./files/updates/" + req.body.uuid, {root: process.env.SERVER_HOME});
});


module.exports = router;