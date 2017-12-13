const eventEmitter = require('events');
const express = require('express');
const constants = require('config/constants');
const config = require('config/config');
const redisClient = require('modules/redis/index');
const rabbitMq = require('modules/rabbitMq/index');
const taskGenerator = require('modules/taskGenerator');
const say = require('helpers/say');

const App = express();
const EE = new eventEmitter();
const Rabbit = new rabbitMq(EE);
const Redis = new redisClient(EE);
const Generator = new taskGenerator(EE);
const event = constants.events;

// start app ----------------------
EE.on( event.RABBIT_CONNECTED,
    () => {
        EE.emit(event.APP_START);
        say("[*] Rabbit connected!");
    }
);
EE.on( event.REDIS_CONNECTED, () => say("[*] Redis connected!"));
EE.on( event.GENERATOR_START, () => say('[*] Generator started!'));

EE.on( event.GENERATOR_GENERATED_NEW_TASK,
    (taskId, taskBody) => {
        Redis.getClient().hmset( // push task to Redis
            taskId,
            'body', taskBody,
            'status', constants.constants.taskStatuses.CREATED
        );
        Rabbit.sendToQueue( {taskId: taskId, taskBody: taskBody} ); // and push task to Rabbit
        Redis.showTaskInfo(taskId, `[*] New task created: "${taskId}".`);
    }
);
EE.on( event.RABBIT_PUSHED_TO_QUEUE,
    (data) => say(`Task: "${data.taskId}" pushed to queue.`, true)
);
EE.on( event.RABBIT_WORKER_RECEIVE_TASK,
    (taskId) => {
        Redis.updateTaskStatus(
            taskId,
            constants.constants.taskStatuses.IN_PROGRESS,
            `[*] Worker receive task: "${taskId}".`
        );
    }
);
EE.on( event.RABBIT_WORKER_FINISHED_TASK,
    (taskId) => {
        Redis.updateTaskStatus(
            taskId,
            constants.constants.taskStatuses.FINISHED,
            `[x] Worker finished task: "${taskId}".`
        );
    }
);

EE.on( event.RABBIT_DISCONNECTED, () => say("[x] Rabbit disconnected!"));
EE.on( event.REDIS_DISCONNECTED,  () => say("[x] Redis disconnected!"));
EE.on( event.GENERATOR_STOP,      () => say('[x] Generator stopped!'));

EE.on('error',
    (errorName, err) => {
        // do something.....
        say([errorName, err], true, true);
    }
);

// stop app ----------------------
setTimeout(()=>{
    EE.emit(event.GENERATOR_STOP);
    setTimeout(
        ()=> {
            EE.emit(event.APP_STOP);
            process.exit(0);
        },
        3000
    );
}, config.app.generatorWorkingTime);

// app server  ----------------------
App.listen(
    config.app.port,
    () => say('App listening on port 3000!')
);