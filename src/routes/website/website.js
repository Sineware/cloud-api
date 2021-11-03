const express = require('express');
const cors = require('cors');
const redis = require('../../db');
const {authenticateRoute, userPassAuthorizer} = require("../../authentication");
const basicAuth = require('express-basic-auth')

const router = express.Router();
const prefix = process.env.SERVER_API_PREFIX + "website"

let contents = require("./contents.json");

router.use(cors());
const authorizeWithUserPass = basicAuth({
    authorizer: userPassAuthorizer,
    authorizeAsync: true,
    challenge: true,
})

/* Admin Pages */
router.get('/admin', authorizeWithUserPass, async function (req, res) {
    const pages = (await redis.keys("website:page:" + "*")).map(x => x.substr(x.lastIndexOf(":") + 1)).filter(x => x !== "settings");
    res.render('index', {
       pages,
    });
});
router.get('/admin/edit/:page', authorizeWithUserPass, async function (req, res) {
    let requestedPage = req.params.page;
    if(!(await redis.exists("website:page:" + requestedPage)) && !(await redis.exists("website:page:" + requestedPage + ":settings")) )
        return res.status(404).send({success: false, error: "Page not found!"});

    const sections = await redis.hgetall("website:page:" + requestedPage);
    const settings = await redis.hgetall("website:page:" + requestedPage + ":settings");
    res.render('editpage', {
        page: requestedPage,
        sections,
        settings
    });
});

/* Page Access */
router.get(prefix + "/default", async (req, res) => {
    res.send(contents);
});
router.get(prefix + "/all", async (req, res) => {
    const pages = await redis.keys("website:page:" + "*");
    res.send(pages.map(x => x.substr(x.lastIndexOf(":") + 1)).filter(x => x !== "settings"));
});
router.get(prefix + "/:page", async (req, res) => {
    const requestedPage = req.params.page;

    if(!(await redis.exists("website:page:" + requestedPage)) && !(await redis.exists("website:page:" + requestedPage + ":settings")) )
        return res.status(404).send({success: false, error: "Page not found!"});

    const sections = await redis.hgetall("website:page:" + requestedPage);
    const settings = await redis.hgetall("website:page:" + requestedPage + ":settings");

    res.send({sections, settings});
});

/* Page Actions */
router.post(prefix + "/:page", authorizeWithUserPass, async (req, res) => {
    const requestedPage = req.params.page;
    const sections = req.body.sections;
    const settings = req.body.settings;

    await redis.hset("website:page:" + requestedPage, sections);
    await redis.hset("website:page:" + requestedPage + ":settings", settings);
    res.send({success: true});
});
router.delete(prefix + "/:page", authorizeWithUserPass, async (req, res) => {
    const requestedPage = req.params.page;
    await redis.del("website:page:" + requestedPage);
    await redis.del("website:page:" + requestedPage + ":settings");
    res.send({success: true});
});

module.exports = router;
