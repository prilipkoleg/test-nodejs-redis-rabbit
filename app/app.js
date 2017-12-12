const eventEmitter = new require('events');
const Constants = require('app/config/constants');
const config = require('app/config/config');
const RedisClient = require('app/modules/redis/index');
const RabbitMq = require('app/modules/rabbitMq/index');
const taskGenerator = require('app/modules/taskGenerator');
const express = require('express');
const app = express();

const EE = new eventEmitter();
const Rabbit = new RabbitMq(EE);
const Redis = new RedisClient(EE);
const generator = new taskGenerator(EE);
const event = Constants.events;

EE.on( event.REDIS_CONNECTED,
    () => {
        console.log("Redis connected!");
        EE.emit(event.GENERATOR_START);
    }
);

EE.on( event.RABBIT_CONNECTED,
    () => {
        console.log("Rabbit connected!");
        EE.emit(event.GENERATOR_START);
    }
);

EE.on(
    event.GENERATOR_GENERATED_NEW_TASK,
    (taskId, taskBody) => {
        // push task to Redis
        Redis.getClient().hmset(
            taskId,
            'body', taskBody,
            'status', Constants.constants.taskStatuses.CREATED
        );
        // and push in Rabbit
        Rabbit.sendToQueue( {taskId: taskId, taskBody: taskBody} );
        console.log(taskId, taskBody);
    }
);

EE.on(
    event.RABBIT_WORKER_FINISHED_TASK,
    (taskId) => {
        const client = Redis.getClient();

        client.exists(
            taskId,
            (err, reply) =>
            {
                (reply === 1)
                    ? updateHash()
                    : console.log(`Redis key '${taskId}' doesn\'t exist!`);
            }
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
                        'status', Constants.constants.taskStatuses.FINISHED
                    );
                    client.expire(taskId, 10);
                    client.hgetall(taskId, (err, val)=> console.log(taskId, val));
                }
            );
        }
    }
);

setTimeout(()=>{
    EE.emit(event.GENERATOR_STOP);
    generator.stopGenerate();
}, 10000);


EE.on(
    'error',
    (errorName, err) => {
        // do something.....
        console.log(errorName, err);
    }
);

app.listen(config.app.port, function () {
    console.log('App listening on port 3000!');
});