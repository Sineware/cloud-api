/*
 *  Sineware Cloud API Server
 *  Copyright (C) 2021  Seshan Ravikumar
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as
 *  published by the Free Software Foundation, either version 3 of the
 *  License, or (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */
require('dotenv').config()
const redis = require('./db');
const express = require('express');
const path = require('path');
const got = require('got');

const app = express();
const expressWs = require('express-ws')(app);
const port = process.env.PORT;

const serverVer  = "1";
const updateRoutes = require("./routes/updates/updates");
const websiteRoutes = require("./routes/website/website");
const gatewayRoutes = require("./device-gateway/wsgateway");
const {authenticateRoute} = require("./authentication");

async function main() {

    /*
    try {
        const {body} = await got.get(process.env.AUTHSERVER_URL + '/', { responseType: 'json' });
    } catch (e) {
        console.log("Could not connect to AuthServer!");
        console.error(e.message);
        process.exit(-1);
    }*/


    let res = await redis.info();
    console.log("Redis Info:");
    console.log(res)

    app.set("view engine", "ejs");

    // Basic Middleware
    app.use(function(req, res, next) {
        res.header('X-Powered-By', "Sineware Cloud");
        next();
    });
    app.use(express.json());
    app.use('/', express.static(path.join(__dirname, 'public')))

    // Update endpoints
    app.use(updateRoutes);
    app.use(websiteRoutes);
    app.get("/test", authenticateRoute, async (req, res) => {
        res.send({success: true, message: "ehe te nandayo"});
    });

    // Websocket Gateway
    app.use(gatewayRoutes);

    app.listen(port, () => {
        console.log(`HTTP Server listening at http://0.0.0.0:${port}`);
    });

}
main().then(() => {
    console.log("Sineware Cloud API Server v" + serverVer + " has started.");
})
