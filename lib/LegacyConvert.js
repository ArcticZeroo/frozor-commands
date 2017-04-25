const { Command } = require('./../index');

Object.set = function (obj, prop, val) {
    obj[prop] = val;

    return obj;
};

function ConvertLegacyCommandsArray(commands) {
    let aliases = Object.keys(commands)
        .map((name)=>{
            let cmd = commands[name];
            cmd.name = name;
            return cmd})
        .filter((cmd)=> cmd.hasOwnProperty('alias'))
        .reduce((cmd, aliases)=>{
            if(!aliases.hasOwnProperty(cmd.alias)){
                aliases[cmd.alias] = [];
            }
            aliases[cmd.alias].push(cmd.name);
        }, {});

    Object.keys(commands)
        .map((name)=> Object.set(commands[name], 'name', name, true))
        .reduce((legacyCommand, commands)=>{
            let newCommand = new Command(legacyCommand.name);

            if(legacyCommand.hasOwnProperty('description')){
                newCommand.description = legacyCommand.description;
            }

            if(legacyCommand.hasOwnProperty('disabled') && legacyCommand.disabled == true){
                newCommand.type = 'disabled';
            }

        }, {})
}