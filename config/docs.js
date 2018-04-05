const HEADERS = {
    h1: '#', h2: '##', h3: '###', h4: '####'
};

const METHODS = {
    capitalize (str) {
        return str[0].toUpperCase() + str.substr(1);
    },
    prettifyNum (num) {
        if (num === 0 || !num) {
            return 'None';
        }

        if (num === Number.POSITIVE_INFINITY) {
            return 'Infinite';
        }
    }
};

const FORMAT = {
    code (text) {
        return '`' + text + '`'
    },
    bold (text) {
        return '*' + text + '*'
    }
};

module.exports = {
    title: (command) => {
        return HEADERS.h2 + ' ' + METHODS.capitalize(command.name) + ' Command';
    },
    aliases: (command) => {
        return [HEADERS.h3 + ' Aliases', command.aliases.join(', ')];
    },
    description: (command) => {
        return [HEADERS.h3 + ' Description', command.description];
    },
    usage: (command) => {
        return [HEADERS.h3 + ' Usage', FORMAT.code(command.getUsageStatement())];
    },
    examples: (command) => {
        return [HEADERS.h3 + ' Examples', command.examples.map(FORMAT.code).join('\n\n')];
    },
    args: (command) => {
        const data = [];

        data.push(HEADERS.h3 + ' Arguments');

        if (command.args.length === 0) {
            data.push('This command requires no arguments.');
            return data;
        }

        data.push(HEADERS.h4 + ' Min Args: ' + FORMAT.code(METHODS.prettifyNum(command.minArgs)));
        data.push(HEADERS.h4 + ' Max Args: ' + FORMAT.code(METHODS.prettifyNum(command.maxArgs)));

        data.push('Name|Description|Required|Type');

        for (const arg of command.args) {
            data.push(`${arg.name || ''}|${arg.description || ''}|${arg.required != null ? (arg.required ? 'Yes' : 'No') : ''}|${arg.type || ''}`);
        }

        return data;
    }
};