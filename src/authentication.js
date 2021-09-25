// Identify with AuthServer
const got = require("got");
async function authenticateRoute(req, res, next) {
    if(req.header("Authorization") === undefined) {
        res.status(401).header("WWW-Authenticate", "Bearer").send({success: false, error: "No Token Provided"});
        return
    }
    console.log(req.header("Authorization").split(" ")[1]);
    const {body} = await got.post(process.env.AUTHSERVER_URL + '/verify/user', {
        json: {
            token: req.header("Authorization").split(" ")[1]
        },
        responseType: 'json'
    });
    if(body.success) {
        next();
    } else {
        res.status(401).header("WWW-Authenticate", "Bearer").send({success: false, error: "Invalid Token"});
    }
}

module.exports = {authenticateRoute}
