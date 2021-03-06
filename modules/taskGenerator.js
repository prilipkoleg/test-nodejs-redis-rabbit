const config = require('config/config');
const event = require('config/constants').events;

class Generator{

    constructor(eventEmitter){
        this.Mediator = eventEmitter;
        this.taskCount = 1;

        this.setEventListeners();
    }

    setEventListeners(){
        const self = this;

        this.Mediator.on(
            event.APP_START,
            () => {
                self.startGenerate();
                self.Mediator.emit(event.GENERATOR_START);
            }
        );
        this.Mediator.on(
            event.GENERATOR_STOP,
            () => self.stopGenerate()
        )
    }

    startGenerate()
    {
        this.intervalObj = setInterval(
            this.generatorLoop.bind(this),
            config.taskGenerator.generateInterval
        );
    }

    stopGenerate()
    {
        clearInterval(this.intervalObj);
    }

    generatorLoop()
    {
        let count = this.randomIntInc(config.taskGenerator.min, config.taskGenerator.max);
        /**
         * taskBody is a string with dots like -> "...",
         * where count of dots depends from random int from min to max
         * @type {string}
         */
        let taskBody = '';
        while (count) { taskBody += '.'; count-- }
        this.Mediator.emit(event.GENERATOR_GENERATED_NEW_TASK, `task_${this.taskCount++}`, taskBody);
    }

    randomIntInc (low, high)
    {
        return Math.floor(Math.random() * (high - low + 1) + low);
    }
}

module.exports = Generator;