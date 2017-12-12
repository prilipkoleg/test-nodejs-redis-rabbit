const config = require('app/config/config').redis;
const event = require('app/config/constants').events;
const redis = require('redis');

class Redis {

    constructor(eventEmitter)
    {
        this.EE = eventEmitter;
        this.connect();
    }

    connect()
    {
        const self =this;
        this.client = redis.createClient(config.port, config.host);

        this.client.on(
            'connect',
            () => self.EE.emit(event.REDIS_CONNECTED)
        );
    }

    getClient()
    {
        return this.client;
    }

    disconnect(){
        this.getClient().disconnect();
    }
}

module.exports = Redis;

