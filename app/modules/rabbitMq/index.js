const config = require('app/config/config').rabbitMq;
const event = require('app/config/constants').events;

class RabbitMq {

    constructor(eventEmitter){
        this.EE = eventEmitter;
        this.init();
    }

    init(){
        const amqp = require('amqplib/callback_api');
        const self = this;

        amqp.connect(config.host, (err, conn) => {
            if(err)
            { self.EE.emit('error', 'Rabbit error:', err); }

            this.connection = conn;
            self.EE.emit(event.RABBIT_CONNECTED);

            conn.createChannel( (err, ch) =>
            {
                if (err){
                    self.EE.emit('error', 'Rabbit Chanel error', err);
                }

                self.channel = ch;
                self.EE.emit(event.RABBIT_CHANNEL_CREATED);

                const q = config.queueName;
                ch.assertQueue( q, config.queueConfig );
                //-- set consumer (simple worker)
                //todo:set noAck false after Confirming
                ch.consume( q, self.worker.bind(self), {noAck: true} );
            });
        });
    }

    sendToQueue(data)
    {
        this.channel.sendToQueue(config.queueName, new Buffer(JSON.stringify(data)));
        // Note: on Node 6 Buffer.from(msg) should be used
        this.EE.emit(event.RABBIT_PUSHED_TO_QUEUE, data);
    }

    //todo: Needs to Confirm messages
    worker(buffer)
    {
        const self = this;
        const {taskId, taskBody} = JSON.parse(buffer.content.toString());
        this.EE.emit(event.RABBIT_WORKER_RECEIVE_TASK, taskId);
        setTimeout(
            () => {
                self.EE.emit(event.RABBIT_WORKER_FINISHED_TASK, taskId);
            },
            taskBody.length * 1000
        );
    }

    destroy(){
        this.connection.close();
        console.log(`Rabbit connection closed!`);
    }
}

module.exports = RabbitMq;