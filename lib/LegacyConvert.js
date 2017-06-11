// This isn't done!
// Don't use it!

const {Command, CommandArg} = require('./Command');

Object.set = function (obj, prop, val) {
    obj[prop] = val;

    return obj;
};

function convertLegacyCommandsArray(legacyCommands) {
    /**
     * Legacy commands are objects with the following certain properties
     * args
     * process
     *
     * Optional properties
     * name
     * description
     * usage (auto generated with the command API now)
     * all other properties should be set inside the prototype!
     */

    /**
     * This first maps all names to their commands
     * Then, it removes all non-alias commands
     * Finally, it reduces to an object of name: [aliases]
     * and deletes the alias from legacyCommands so we can
     * later iterate.
     */
    const aliases = {};

    for (let commandName of Object.keys(legacyCommands)) {
        const command = legacyCommands[commandName];

        if (!command.hasOwnProperty('alias') || command.alias === false) {
            continue;
        }

        if (!aliases.hasOwnProperty(command.alias)) {
            aliases[command.alias] = [];
        }

        aliases[command.alias].push(commandName);

        delete legacyCommands[commandName];
    }
    
    const commands = {};

    for (let commandName of Object.keys(legacyCommands)) {
        const legacyCommand = legacyCommands[commandName];

        const minArgs = legacyCommand.args.min;
        const maxArgs = legacyCommand.args.max;
        const args = [];

        if (minArgs > 0) {
            for (let i = 1; i <= minArgs; i++) {
                args.push(new CommandArg('Arg', 'Any', true));
            }
        }

        if (maxArgs > minArgs) {
            const optionalArgs = maxArgs - minArgs;

            if (optionalArgs === 1) {
                args.push(new CommandArg('Arg', 'Any', false))
            } else if (optionalArgs > 1) {
                args.push(...CommandArg.getVariableArgs(optionalArgs, 'Arg', 'Any', false));
            }
        }

        // Properties that should not appear in options
        const commandProperties = ['allowedUsers', 'type', 'description', 'aliases', 'args', 'minArgs', 'maxArgs', 'getUsageStatement', 'canRun', 'run', 'process', 'name'];

        const options = {
            name: commandName,
            args,
            aliases: aliases[commandName] || [],
            description: legacyCommand.description || '',
            type: legacyCommand.type || 'command'
        };

        for (let key of Object.keys(legacyCommand)) {
            if (!commandProperties.includes(key)) {
                options[key] = legacyCommand[key];
            }
        }

        commands[commandName] = new ( class LegacyCommand extends Command {
            constructor () {
                super(options)
            }

            async run (message, bot, extra) {
                legacyCommand.process(bot, message, extra);
            }
        } )
    }

    return Object.values(commands);
}

module.exports = convertLegacyCommandsArray;