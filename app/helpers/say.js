const _ = require('lodash');

function say(messages, separatorStatus = false, exitStatus = false) {
    //if (config.getEnv() !== 'dev') return;

    if (_.isUndefined(messages)) return;

    const params = { depth: null };
    const separatorStart    = "|=|=|=|=|=|=|=|=|=|=| ------ Start ------  |=|=|=|=|=|=|=|=|=|=|";
    const separatorEnd      = "===================== ------  End  ------  =====================\n";
    const separatorOfArray  = "---------------------------------------------------";

    if( _.isArray(messages) && messages.length > 0 ){
        console.log(separatorStart);
        messages.map(
            (mess, i) => {
                if(i)
                    console.log(separatorOfArray);
                console.dir(mess, params);
            }
        );
        console.log(separatorEnd);
    }else
    {
        if (!separatorStatus){
            _.isString(messages)
                ? console.log(messages)
                : console.dir(messages);
        }else
        {
            console.log(separatorStart);
            _.isString(messages) ? console.log(messages) : console.dir(messages, params);
            console.log(separatorEnd);
        }
    }

    if( exitStatus ) process.exit(0);
}

module.exports = say;