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

const app = express();
const port = process.env.PORT;

const serverVer  = "1";
const updateRoutes = require("./routes/updates/updates");

async function main() {
    let res = await redis.info();
    console.log("Redis Info:");
    console.log(res)

    // Basic Middleware
    app.use(express.json());
    app.use('/', express.static(path.join(__dirname, 'public')))

    // Update endpoints
    app.use(updateRoutes);

    app.listen(port, () => {
        console.log(`HTTP Server listening at http://localhost:${port}`);
    });

}
main().then(() => {
    console.log("Sineware Cloud API Server v" + serverVer + " has started.");
})
