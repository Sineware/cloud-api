// This should probably be more fancy
async function authenticateRoute(req, res, next) {
    if(req.header("X-API-Key") === process.env.SERVER_API_KEY) {
        next();
    } else {
        res.status(401).header("WWW-Authenticate", "X-API-Key").send({error: "Invalid API Key"})
    }
}

module.exports = authenticateRoute