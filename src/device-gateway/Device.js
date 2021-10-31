class Device {
    id;
    info;
    ws;

    constructor(id, info, ws) {
        this.id = id;
        this.info = info;
        this.ws = ws;
    }
}

module.exports = Device;
