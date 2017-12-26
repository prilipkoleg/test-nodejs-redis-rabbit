const config = require('config/config').redis;
const say = require('helpers/say');
const Constants = require('config/constants');
const event = Constants.events;
const redis = require('redis');

class Redis {

    constructor(eventEmitter)
    {
        this.Mediator = eventEmitter;
        this.connect();
    }

    connect()
    {
        const self =this;
        this.client = redis.createClient(config.port, config.host);

        this.client.on(
            'connect',
            () => self.Mediator.emit(event.REDIS_CONNECTED)

        );
        this.Mediator.on(
            event.APP_STOP,
            () => {
                self.disconnect();
                self.Mediator.emit(event.REDIS_DISCONNECTED);
            }
        );
    }

    getClient()
    {
        return this.client;
    }

    disconnect(){
        this.client.quit();
        this.client = null;
    }

    updateTaskStatus(taskId, newStatus, message)
    {
        const self = this;
        const client = this.client;

        client.exists(
            taskId,
            (err, reply) =>
                (reply === 1)
                    ? updateHash()
                    : say(`Redis key: '${taskId}' doesn\'t exist!`)
        );

        function updateHash() {
            client.hgetall(
                taskId,
                (err, object) =>
                {
                    if (err) {}
                    client.hmset(
                        taskId,
                        'body', object.body,
                        'status', newStatus
                    );
                    if (newStatus === Constants.constants.taskStatuses.FINISHED)
                    {
                        client.expire(taskId, config.keyExpire);
                    }
                    if(message)
                        self.showTaskInfo(taskId, message);
                }
            );
        }
    }

    showTaskInfo(taskId, mess = false)
    {
        const client = this.client;

        client.exists(
            taskId,
            (err, reply) =>
                (reply === 1)
                    ? showMessage()
                    : say(`Redis key: '${taskId}' doesn\'t exist!`)
        );

        function showMessage() {
            client.hgetall(
                taskId,
                (err, object) =>
                {
                    if (err) return say(['Error', err], true);
                    say(mess ? [mess, object] : object);
                }
            );
        }
    }
}

module.exports = Redis;

