const constants = {
    taskStatuses: {
        CREATED: "CREATED",
        IN_PROGRESS: "IN_PROGRESS",
        FINISHED: "FINISHED"
    }
};

// ------------- Events
const rabbit = 'rabbitMq';
const generator = 'generator';

const events = {
    APP_START: `APP_START`,
    APP_STOP: `APP_STOP`,
    //--------------
    REDIS_CONNECTED: `redis.connected`,
    REDIS_DISCONNECTED: `redis.disconnected`,
    //--------------
    RABBIT_CONNECTED: `${rabbit}.connected`,
    RABBIT_DISCONNECTED: `${rabbit}.disconnected`,
    RABBIT_CHANNEL_CREATED: `${rabbit}.channel_created`,
    RABBIT_PUSHED_TO_QUEUE: `${rabbit}.pushedToQueue`,
    RABBIT_WORKER_RECEIVE_TASK: `${rabbit}.worker.received_task`,
    RABBIT_WORKER_FINISHED_TASK: `${rabbit}.worker.finished_task`,
    //--------------
    GENERATOR_START: `${generator}.start`,
    GENERATOR_STOP: `${generator}.stop`,
    GENERATOR_GENERATED_NEW_TASK: `${generator}.new_task_generated`,
};

module.exports = {
    constants: constants,
    events: events
};