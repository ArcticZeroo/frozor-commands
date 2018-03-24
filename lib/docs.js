const fs = require('fs');
const { promisify } = require('util');

const Collection = require('djs-collection');

const defaultConfig = require('../config/docs.js');
const CommandHandler = require('./CommandHandler');
const Command = require('./Command');

const writeFile = promisify(fs.writeFile);

const defaultOptions = {
    handler: null,
    commands: [],
    output: {
        separate: true,
        filename (command) {
            return `${command.name.toLowerCase()}.md`;
        },
        path: './doc/'
    }
};

const docMethods = ['title',
    (command) => command.aliases.length !== 0 ? 'aliases' : null,
    (command) => command.description ? 'description' : null,
    (command) => command.getUsageStatement().trim().length !== 0 ? 'usage' : null,
    'args'];

function handleOptions(base, given, nullCountsAsValue = true) {
    const options = Object.assign({}, base);
    
    if (!given) {
        return options;
    }

    if (typeof given !== 'object') {
        return options;
    }

    for (const key of Object.keys(base)) {
        if (!given.hasOwnProperty(key)) {
            options[key] = base[key];
            continue;
        }

        if (!nullCountsAsValue && given[key] == null) {
            options[key] = base[key];
            continue;
        }

        // Deep option assignment if both are deeper
        if (typeof base[key] === 'object' && typeof given[key] === 'object') {
            options[key] = handleOptions(base[key], given[key], nullCountsAsValue);
            continue;
        }
        
        options[key] = given[key];
    }
    
    return options;
}

function handleDoc(parts, command, call) {
    let newParts = call(command);

    if (!newParts) {
        return;
    }

    if (typeof newParts === 'string') {
        newParts = [newParts];
    }

    parts.append(...newParts);
}

module.exports = function (options) {
    options = handleOptions(defaultOptions, options);

    if (typeof options.output === 'string') {
        options.output = { path: options.output };
    }

    options.config = handleOptions(defaultConfig, options.config, false);

    let commands;
    if (options.handler && options.handler instanceof CommandHandler) {
        commands = Array.from(options.handler.commands.keys());
    } else if (options.commands && Array.isArray(options.commands)) {
        commands = options.commands.filter(c => !!c && c instanceof Command);
    } else {
        throw new Error('Expected options.handler or options.commands to be set as a CommandHandler or Command array');
    }

    const docs = new Collection();

    for (const command of commands) {
        const parts = [];

        for (let method of docMethods) {
            if (typeof method === 'function') {
                method = method(command);

                if (!method) {
                    continue;
                }
            }

            handleDoc(parts, command, options.config[method]);
        }
    }
};