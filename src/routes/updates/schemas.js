const updatePackageSchema = {
    "title": "Update Package",
    "description": "A Sineware Update Package object",
    "type": "object",
    "properties": {
        "uuid": {
            "description": "The UUID assigned to the actual uploaded update package",
            "type": "string"
        },
        "product": {
            "description": "The product name this update is applicable to",
            "type": "string"
        },
        "variant": {
            "description": "The product variant this update is applicable to (ex. server)",
            "type": "string"
        },
        "channel": {
            "description": "The update channel this update belongs to",
            "type": "string"
        },
        "build": {
            "description": "The update build number",
            "type": "number"
        },
        "hash": {
            "description": "The hash of the update package file",
            "type": "string"
        },
        "status": {
            "description": "The status of the update (ex. fresh or ready, used for auto-updates)",
            "type": "string"
        },
        "setPointer": {
            "description": "Whether or not to set the product:variant:channel pointer to this update",
            "type": "boolean"
        }


    },
    "required": [ "uuid", "product", "variant", "channel", "build", "hash", "status", "setPointer" ]
}

module.exports = {
    updatePackageSchema
}