// Identify with AuthServer
const got = require("got");

/**
 * @typedef {Object} ASDevice
 * @property {boolean} success - Authentication success or failure
 * @property {string} id - Device ID
 * @property {string} displayname - Device Display Name
 * @property {string} orgid - Organization ID
 * @property {string} type - Device Type
 * @property {string} token - Access Token
 */

/**
 * @typedef {Object} ASUser
 * @property {boolean} success - Authentication success or failure
 * @property {string} id - User ID
 * @property {string} username - User's username
 * @property {string} email - User's email
 * @property {string} fullname - User's full name
 * @property {string} displayname - User's display name (nickname)
 * @property {string} statusmsg - User's status message (for display purposes)
 */

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

/**
 * Authenticate a device from a token, returning its AuthServer object.
 * @param token
 * @returns {Promise<ASDevice|boolean>}
 */
async function authenticateDevice(token) {
    const {body} = await got.post(process.env.AUTHSERVER_URL + '/verify/device', {
        json: { token },
        responseType: 'json'
    });
    console.log(body)
    if(body.success) {
        return body;
    } else {
        return false;
    }
}

/**
 * Authenticate a user from a token, returning its AuthServer object.
 * @param token
 * @returns {Promise<ASUser|boolean>}
 */
async function authenticateUser(token) {
    const {body} = await got.post(process.env.AUTHSERVER_URL + '/verify/user', {
        json: { token },
        responseType: 'json'
    });
    console.log(body)
    if(body.success) {
        return body;
    } else {
        return false;
    }
}

module.exports = {authenticateRoute, authenticateDevice, authenticateUser}
