const EventEmitter = require('events');
const Express = require('express');
const Constants = require('config/constants');
const RedisClient = require('modules/redis/index');
const RabbitMq = require('modules/rabbitMq/index');
const TaskGenerator = require('modules/taskGenerator');
const config = require('config/config');
const say = require('helpers/say');

const App = Express();
const Mediator = new EventEmitter();
const Rabbit = new RabbitMq(Mediator);
const Redis = new RedisClient(Mediator);
const Generator = new TaskGenerator(Mediator);
const event = Constants.events;

// start app ----------------------
Mediator.on( event.RABBIT_CONNECTED,
    () => {
        Mediator.emit(event.APP_START);
        say("[*] Rabbit connected!");
    }
);
Mediator.on( event.REDIS_CONNECTED, () => say("[*] Redis connected!"));
Mediator.on( event.GENERATOR_START, () => say('[*] Generator started!'));

Mediator.on( event.GENERATOR_GENERATED_NEW_TASK,
    (taskId, taskBody) => {
        Redis.getClient().hmset( // push task to Redis
            taskId,
            'body', taskBody,
            'status', Constants.constants.taskStatuses.CREATED
        );
        Rabbit.sendToQueue( {taskId: taskId, taskBody: taskBody} ); // and push task to Rabbit
        Redis.showTaskInfo(taskId, `[*] New task created: "${taskId}"`);
    }
);
Mediator.on( event.RABBIT_PUSHED_TO_QUEUE,
    (data) => say(`Task: "${data.taskId}" pushed to queue.`, true)
);
Mediator.on( event.RABBIT_WORKER_RECEIVE_TASK,
    (taskId) => {
        Redis.updateTaskStatus(
            taskId,
            Constants.constants.taskStatuses.IN_PROGRESS,
            `[*] Worker receive task: "${taskId}".`
        );
    }
);
Mediator.on( event.RABBIT_WORKER_FINISHED_TASK,
    (taskId) => {
        Redis.updateTaskStatus(
            taskId,
            Constants.constants.taskStatuses.FINISHED,
            `[x] Worker finished task: "${taskId}".`
        );
    }
);

Mediator.on( event.RABBIT_DISCONNECTED, () => say("[x] Rabbit disconnected!"));
Mediator.on( event.REDIS_DISCONNECTED,  () => say("[x] Redis disconnected!"));
Mediator.on( event.GENERATOR_STOP,      () => say('[x] Generator stopped!'));

Mediator.on('error',
    (errorName, err) => {
        // do something.....
        say([errorName, err], true, true);
    }
);

// stop app ----------------------
setTimeout(()=>{
    Mediator.emit(event.GENERATOR_STOP);
    setTimeout(
        ()=> {
            Mediator.emit(event.APP_STOP);
            process.exit(0);
        },
        3000
    );
}, config.app.generatorWorkingTime);

// app server  ----------------------
// App.listen(
//     config.app.port,
//     () => say('[*] App listening on port 3000!')
// );