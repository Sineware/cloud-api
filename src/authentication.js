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
 * @property {string[]} [organizations] - Organization IDs the user is a part of
 */

/**
 * Express Middleware for authenticating based on a bearer token.
 * @param req
 * @param res
 * @param next
 * @returns {Promise<void>}
 */
async function authenticateRoute(req, res, next) {
    // todo check permissions
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
 * Authorizer for express-basic-auth (use authorizeAsync: true), using username/password
 * @param {string} username
 * @param {string} password
 * @param {function} cb
 * @returns {Promise<void>}
 */
async function userPassAuthorizer(username, password, cb) {
    const {body} = await got.post(process.env.AUTHSERVER_URL + '/login', {
        json: { username, password },
        responseType: 'json'
    });
    cb(null, body.success === true);
}

/**
 * Authenticate a device from a token, returning its AuthServer object.
 * @param {string} token - User access token
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
 * @param {string} token - User access token
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

/**
 * Returns whether a user have permission to interact with a device.
 * @param {string} userID
 * @param {string} deviceID
 * @returns {Promise<boolean>}
 */
async function userHasDevicePermissions(userID, deviceID) {
    /** @type {ASUser} */
    let user = (await got.get(process.env.AUTHSERVER_URL + '/user/' + userID, { responseType: 'json' })).body;
    console.log(user)

    /** @type {ASDevice} */
    let device = (await got.get(process.env.AUTHSERVER_URL + '/device/' + deviceID, { responseType: 'json' })).body;
    console.log(device);

    return user.organizations.includes(device.orgid);
}

/**
 * Returns a user object given an ID.
 * @param {string} userID
 * @returns {Promise<ASUser>}
 */
async function getUserByID(userID) {
    /** @type {ASUser} */
    let user = (await got.get(process.env.AUTHSERVER_URL + '/user/' + userID, { responseType: 'json' })).body;
    console.log(user)
    return user;
}

/**
 * Returns a device object given an ID.
 * @param {string} deviceID
 * @returns {Promise<ASDevice>}
 */
async function getDeviceByID(deviceID) {
    /** @type {ASDevice} */
    let device = (await got.get(process.env.AUTHSERVER_URL + '/device/' + deviceID, { responseType: 'json' })).body;
    console.log(device);
    return device;
}

/**
 * Returns all users in an organization
 * @param {string} orgID
 * @returns {Promise<ASUser[]>}
 */
async function getUsersByOrgID(orgID) {
    return (await got.get(process.env.AUTHSERVER_URL + '/organization/' + orgID + "/users", {responseType: 'json'})).body;
}

// todo authenticate
/**
 * Returns all devices in an organization
 * @param {string} orgID
 * @returns {Promise<ASDevice[]>}
 */
async function getDevicesByOrgID(orgID) {
    return (await got.get(process.env.AUTHSERVER_URL + '/organization/' + orgID + "/devices", {responseType: 'json'})).body;
}

/**
 * Returns whether a user is in an organization.
 * @param {string} userID
 * @param {string} orgID
 * @returns {Promise<boolean>}
 */
async function userIsInOrg(userID, orgID) {
    /** @type {ASUser} */
    let user = (await got.get(process.env.AUTHSERVER_URL + '/user/' + userID, { responseType: 'json' })).body;
    console.log(user)

    return user.organizations.includes(orgID);
}

module.exports = {authenticateRoute, authenticateDevice, authenticateUser, userHasDevicePermissions, getUserByID, getDeviceByID, userIsInOrg, getDevicesByOrgID, getUsersByOrgID, userPassAuthorizer}
