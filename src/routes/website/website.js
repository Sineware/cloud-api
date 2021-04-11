const express = require('express');
const cors = require('cors');
const router = express.Router();
const prefix = process.env.SERVER_API_PREFIX + "website"

let contents = require("./contents.json");
router.use(cors())
router.get(prefix + "/:page", async (req, res) => {
    const page = req.params.page;
    if(typeof contents[page] === "undefined")
        return res.status(404).send({error: "Page not found!"});
    res.send(contents[page]);
});

module.exports = router;