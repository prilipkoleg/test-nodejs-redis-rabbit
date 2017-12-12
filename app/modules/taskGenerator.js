const config = require('app/config/config');
const event = require('app/config/constants').events;

class Generator{

    constructor(eventEmitter){
        this.EE = eventEmitter;
        this.taskCount = 1;

        this.setEventListeners();
    }

    setEventListeners(){
        const self = this;

        this.EE.on(
            event.GENERATOR_START,
            () => self.startGenerate()
        );
        this.EE.on(
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
        console.log(event.GENERATOR_START);
    }

    stopGenerate()
    {
        //:todo -> why clearInterval not working?
        clearInterval(this.intervalObj);
        this.intervalObj = null;
        console.log(event.GENERATOR_STOP);
    }

    generatorLoop()
    {
        // let count = this.randomIntInc(config.taskGenerator.min, config.taskGenerator.max);
        const min = config.taskGenerator.min;
        const max = config.taskGenerator.max;
        let count = Math.floor(Math.random() * (max - min + 1) + min);
        /**
         * taskBody is a string with dots like -> "...",
         * where count of dots depends from random int from min to max
         * @type {string}
         */
        let taskBody = '';
        while (count) { taskBody += '.'; count-- }
        this.EE.emit(event.GENERATOR_GENERATED_NEW_TASK, `task_${this.taskCount++}`, taskBody);
    }

    static randomIntInc (low, high)
    {
        return Math.floor(Math.random() * (high - low + 1) + low);
    }
}

module.exports = Generator;