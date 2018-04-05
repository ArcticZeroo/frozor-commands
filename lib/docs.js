const fs = require('fs');
const { promisify } = require('util');

const Collection = require('djs-collection');

const defaultConfig = require('../config/docs.js');
const CommandHandler = require('./CommandHandler');
const { Command } = require('./Command');

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
    },
    joiner: '\n\n'
};

const docMethods = ['title',
    (command) => command.aliases.length !== 0 ? 'aliases' : null,
    (command) => command.description ? 'description' : null,
    (command) => command.getUsageStatement().trim().length !== 0 ? 'usage' : null,
    (command) => command.examples.length !== 0 ? 'examples' : null,
    'args'];

// https://stackoverflow.com/a/43197340
function isClass(obj) {
    const isCtorClass = obj.constructor
        && obj.constructor.toString().substring(0, 5) === 'class';

    if (obj.prototype === undefined) {
        return isCtorClass
    }

    const isPrototypeCtorClass = obj.prototype.constructor
        && obj.prototype.constructor.toString
        && obj.prototype.constructor.toString().substring(0, 5) === 'class';

    return isCtorClass || isPrototypeCtorClass;
}

function handleOptions(base, given, nullCountsAsValue = true) {
    const options = Object.assign({}, base);
    
    if (!given) {
        return options;
    }

    if (typeof given !== 'object') {
        return options;
    }

    for (const key of Object.keys(given)) {
        // If null cannot be used as a value, and the value given is null, don't let it be used
        if (!nullCountsAsValue && given[key] == null) {
            continue;
        }

        // Otherwise check if it has the property (ie is anything under than undefined) before setting it
        if (!given.hasOwnProperty(key)) {
            continue;
        }

        const givenValue = given[key];
        const baseValue = base[key];

        // Deep option assignment if both are deeper
        // But only if the given is not an array or class instance
        if (typeof baseValue === 'object' && typeof givenValue === 'object'
            && !Array.isArray(givenValue)
            && !isClass(givenValue))
        {
            options[key] = handleOptions(baseValue, given[key], nullCountsAsValue);
            continue;
        }

        options[key] = givenValue;
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

    parts.push(...newParts);
}

module.exports = async function generateDocs(options) {
    options = handleOptions(defaultOptions, options);

    if (typeof options.output === 'string') {
        options.output = { separate: false, path: options.output };
    }

    options.config = handleOptions(defaultConfig, options.config, false);

    let commands;
    if (options.handler && options.handler instanceof CommandHandler) {
        commands = Array.from(options.handler.commands.keys());
    } else if (options.commands && Array.isArray(options.commands)) {
        commands = options.commands;
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

        docs.set(command, parts.join(options.joiner));
    }

    if (!options.output.separate) {
        try {
            await writeFile(options.output.path.endsWith('.md') ? options.output.path : options.output.path + 'docs.md', Array.from(docs.values()).join('\n\n'));
        } catch (e) {
            throw e;
        }

        return;
    }

    for (const command of docs.keys()) {
        try {
            await writeFile(options.output.path + options.output.filename(command), docs.get(command));
        } catch (e) {
            throw e;
        }
    }
};