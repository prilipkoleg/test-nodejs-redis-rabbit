const config = require('config/config').rabbitMq;
const event = require('config/constants').events;
const say = require('helpers/say');

class RabbitMq {

    constructor(eventEmitter){
        this.Mediator = eventEmitter;
        this.init();
    }

    init(){
        const self = this;
        const amqp = require('amqplib/callback_api');

        amqp.connect(
            config.host,
            (err, conn) =>
            {
                if(err)
                { self.Mediator.emit('error', 'Rabbit error:', err) }

                self.connection = conn;
                self.Mediator.emit(event.RABBIT_CONNECTED);

                conn.createChannel( (err, ch) =>
                {
                    if (err){
                        self.Mediator.emit('error', 'Rabbit Chanel error', err);
                    }
                    self.channel = ch;
                    self.Mediator.emit(event.RABBIT_CHANNEL_CREATED);
                    const q = config.queue.name;
                    ch.assertQueue( q, config.queue.config );
                    ch.consume( q, self.worker.bind(self), {noAck: false} ); // set consumer (simple worker)
                });
            }
        );

        this.Mediator.on(
            event.APP_STOP,
            () => self.disconnect()
        );
    }

    sendToQueue(data)
    {
        this.channel.sendToQueue(config.queue.name, new Buffer(JSON.stringify(data)));
        this.Mediator.emit(event.RABBIT_PUSHED_TO_QUEUE, data);
    }

    worker(buffer)
    {
        const self = this;
        const {taskId, taskBody} = JSON.parse(buffer.content.toString());
        this.Mediator.emit(event.RABBIT_WORKER_RECEIVE_TASK, taskId);
        setTimeout(
            () => {
                self.Mediator.emit(event.RABBIT_WORKER_FINISHED_TASK, taskId);
                self.channel.ack(buffer); // remove task from queue
            },
            taskBody.length * 1000
        );
    }

    disconnect(){
        this.connection.close();
        this.connection = null;
        this.Mediator.emit(event.RABBIT_DISCONNECTED);
    }
}

module.exports = RabbitMq;