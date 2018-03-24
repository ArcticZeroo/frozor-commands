module.exports = {
    h1: '#', h2: '##', h3: '###', h4: '####',

    capitalize (str) {
        return str[0].toUpperCase() + str.substr(1);
    },
    prettifyNum (num) {
        if (num === 0) {
            return 'None';
        }

        if (num === Number.POSITIVE_INFINITY) {
            return 'Infinite';
        }
    },


    title: (command) => {
        return this.h2 + ' ' + this.capitalize(command.name);
    },
    aliases: (command) => {
        return [this.h3 + ' Aliases', command.aliases.join(', ')];
    },
    description: (command) => {
        return [this.h3 + ' Description', command.description];
    },
    usage: (command) => {
        return [this.h3 + ' Usage', command.getUsageStatement()];
    },
    args: (command) => {
        const data = [];

        data.push(this.h3 + ' Arguments');

        if (command.args.length === 0) {
            data.push('This command requires no arguments.');
            return data;
        }

        data.push(this.h4 + ' Min Args: ' + this.prettifyNum(command.minArgs));
        data.push(this.h4 + ' Max Args: ' + this.prettifyNum(command.maxArgs));

        data.push('Name|Description|Required|Type');

        for (const arg of command.args) {
            data.push(`${arg.name || ''}|${arg.description || ''}|${arg.required != null ? (arg.required ? 'Yes' : 'No') : ''}|${arg.type || ''}`);
        }

        return data;
    }
};