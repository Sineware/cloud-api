# API Reference
This document outlines the API endpoints.

API Prefix: /api/v1/

## Update Server APIs
Endpoint /update:
* GET: (Return a single update package info)
    * Body: `{"uuid": "some uuid"}` returns the info for that specific update uuid.
    * Body: `{
                 "product": "prolinux",
                 "variant": "server",
                 "channel": "latest"
             }` returns the update from the channel for a given product+variant.
    * Both return an update package JSON (see ./src/routes/updates/schemas.js)

* POST: (Deploy an update to the server. You need to upload the file first using /update/upload) Authenticated route.
    *  Body: `{
                  "uuid": "UUID from /update/upload",
                  "product": "prolinux",
                  "variant": "server",
                  "channel": "latest",
                  "build": 1001,
                  "hash": "abc123",
                  "status": "ready"
              }`. UUID is given when uploading update package file. status is either "fresh" or "ready" (when an update is 
              first deployed, mark it fresh for those tracking updates faster. After a while, recall this endpoint with "ready"
               to mark it ready for auto updates). 
Endpoint /update/all:
* GET: (Returns all the update packages in the system). Debugging only

Endpoint /update/upload: 
* POST: (Send the update package file as form data with name "update_package") Authenticated route.
               
Endpoint "/update/download/:uuid": 
* GET: (Download the update package file given a UUID)