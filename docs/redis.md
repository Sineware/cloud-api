# Keys in the Redis DB

## Updates
Software updates live in the update:* key namespace

Keys **update:UUID** are hashes containing the update package information.

Keys **update:PRODUCT:VARIANT:CHANNEL** are "pointers" that contain a UUID to 
the corresponding update (for example, key update:prolinux:server:latest will 
contain a UUID of the latest update for ProLinux Server on the latest channel).

The key **update:list** is a list of update UUIDs in the order they were uploaded 
to the server.