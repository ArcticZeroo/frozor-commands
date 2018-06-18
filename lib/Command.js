/* eslint-disable no-unused-vars */
// This is precompiled up here because it slightly improves regex performance
// and memory is minimal.
const ArgumentRegex = /(.+)=(.+)/;
const DashArgumentRegex = /-{1,2}(.+)/;

class CommandArg {
    constructor(name, type, required = true) {
        this.name = name;
        this.type = type;
        this.required = required;
        this.hide = false;
    }

    /**
     * This argument's usage string.
     * This will have square brackets if required, and triangle if optional.
     * Type is also added before the name of the arg if it's there.
     * If the arg is hidden, the returned string will be ''.
     * @return {string}
     */
    getUsageString() {
        return (!this.hide) ? `${(!this.required) ? '[' : '<'}${(this.type != null) ? `${this.type} ` : ''}${this.name}${(!this.required) ? ']' : '>'}` : '';
    }

    /**
     * Returns an array of arguments that allows the user to put 1,count or 0,count args and make it valid.
     * This will eventually be improved with something like CommandArg.INFINITY or something.
     * @param count {number} - The maximum amount of args the user can input.
     * @param name {string} - The name of the args
     * @param type {string} - The type of the args
     * @param required {boolean} - Whether the FIRST argument is required. All others are not required.
     * @return {Array.<CommandArg>}
     */
    static getVariableArgs(count, name, type, required) {
        const firstArg = new CommandArg(name, `${type || ''}[]`, required);

        // Dummy values that point to the same obj to reduce memory
        const arg = new CommandArg('', null, false);
        arg.hide = true;

        return [firstArg].concat(Array(count - 1).fill(arg));
    }

    /**
     * Parse arguments out of an array of string args.
     * Args can be --key value, key=value, or key="a value"
     * @param args {Array.<string>} - The arguments to parse.
     * @return {object}
     */
    static parseArgs(args) {
        const parsed = {};

        for (let i = 0; i < args.length; i++) {
            const match = ArgumentRegex.exec(args[i]);

            if (match) {
                match[1] = match[1].toLowerCase();

                if (match[2].startsWith('"')) {
                    // Could be a quoted arg
                    // search for the next quote, add until then
                    let quotedArg = match[2].slice(1);
                    let hasEnd = false;
                    for (let j = i + 1; j < args.length; j++) {
                        if (args[j].includes('"') && args[j].charAt(args[j].indexOf('"') - 1) !== '\\') {
                            // We're going to consider it the end of the quote
                            const split = args[j].split('"');

                            quotedArg += ` ${split[0]}`;

                            args[j] = split[1];

                            parsed[match[1]] = quotedArg;

                            i = --j;

                            hasEnd = true;

                            break;
                        } else {
                            quotedArg += ` ${args[j]}`;
                        }
                    }

                    if (!hasEnd) {
                        parsed[match[1]] = match[2];
                    }
                } else {
                    parsed[match[1]] = match[2];
                }
            }
            else {
                const dashMatch = DashArgumentRegex.exec(args[i]);

                if (dashMatch) {
                    dashMatch[1] = dashMatch[1].toLowerCase();

                    if ((i + 2) < args.length) {
                        let arg = args[i + 1];

                        function add(j) {
                            arg += ` ${args[j]}`;
                        }

                        for (let j = i + 2; j < args.length; j++) {
                            if (j === args.length - 1) {
                                add(j);

                                parsed[dashMatch[1]] = arg;
                                i = --j;

                                break;
                            }

                            if (DashArgumentRegex.test(args[j]) || ArgumentRegex.test(args[j])) {
                                parsed[dashMatch[1]] = arg;
                                i = --j;

                                break;
                            } else {
                                add(j);
                            }
                        }
                    } else {
                        if (i >= args.length - 1) {
                            parsed[dashMatch[1]] = true;
                        } else {
                            if (DashArgumentRegex.test(args[i + 1])) {
                                parsed[dashMatch[1]] = true;
                            } else {
                                parsed[dashMatch[1]] = args[i + 1];
                            }
                        }
                    }
                }
            }
        }

        return parsed;
    }

    /**
     * Returns an object with keys related to the names of the CommandArgs in the given command.
     * @param args {Array.<string>} - The args to parse.
     * @param command {Command} - The command to use when creating keys.
     * @return {object} - An object whose keys are the argument names of the args, and values are the arg strings
     */
    static parseCommandArgs(args, command) {
        const parsed = {};

        for (let i = 0; i < args.length; i++) {
            const argName = command.args[i].name;

            if (!parsed.hasOwnProperty(argName)) {
                parsed[argName] = args[i];
            } else {
                parsed[argName] += ` ${args[i]}`;
            }
        }

        return parsed;
    }
}

class Command {
    /**
     * Create a new Command instance
     * @param {{}|string} [options={}] - Options to use for this command handler.
     */
    constructor(options = {}) {
        // Assign from default options, and from the ones provided
        /**
         * @namespace
         * @property Command.name {string} - The name of the command, as called upon by the user.
         * @property {string} [Command.type=command] - The type of command. Change this to hidden/debug/etc when necessary.
         * @property {string} [Command.description=''] - The description of the command.
         * @property {Array.<string>} [Command.aliases=[]] - This command's aliases, as strings.
         * @property {Array.<CommandArg|string|object>} [Command.args=[]] - The command's args, used to determine min/max args.
         * @property {Array.<string>} [Command.examples=[]] - Example usage of this command.
         * @property {Array.<string>|string} [Command.help] - A string or Array representing information to display in the help statement.
         * @property {string} [Command.usage] - Optional command usage, to override the getUsageStatement method
         */
        Object.assign(this, {
            allowedUsers: [],
            type: 'command',
            description: '',
            aliases: [],
            args: [],
            examples: [],
            help: ''
        }, options);

        // Convert all args that are strings to just command args, in case I get lazy!
        this.args = this.args.map((arg) => {
            if (arg instanceof CommandArg) {
                return arg;
            }

            if (typeof arg === 'function') {
                return new arg();
            }

            if (typeof arg === 'object') {
                const newArg = new CommandArg(arg.name, arg.type, arg.required);

                Object.assign(newArg, arg);

                return newArg;
            }

            if (typeof arg === 'string') {
                return new CommandArg(arg);
            }

            return new CommandArg('UnknownArg');
        });

        this.maxArgs = this.args.length;
        this.minArgs = this.args.filter((arg) => arg.required).length;
    }

    /**
     * Add infinite args to this command.
     * This will be added as an additional arg after any existing ones you already have, with the given name/type.
     * None of them are required. Set {@link Command.minArgs} if you want to make 1 required.
     * @param {string} [name='text'] - The argument name
     * @param {string} [type='String[]'] - The argument type (defaults to a representation of a string array)
     */
    addInfiniteArgs(name = 'text', type = 'String[]') {
        this.maxArgs = Number.POSITIVE_INFINITY;

        this.args.push(new CommandArg(name, type));
    }

    /**
     * Parse data using {@link CommandArg#parseCommandArgs}.
     * @param {object|Array} data - The data to parse. Usually msg.args or the message itself (msg.args will be extracted)
     * @param {Array} [data.args] - The arguments, if data is an object.
     * @returns {object} - The data returned from {@link CommandArg#parseCommandArgs}.
     */
    parse(data) {
        // If a message instance was passed instead
        if (typeof data === 'object' && !Array.isArray(data) && data.hasOwnProperty('args')) {
            data = data.args;
        }

        return CommandArg.parseCommandArgs(data, this);
    }

    /**
     * Get all names this command is known by.
     * Combines name and aliases.
     * @return {Array.<string>}
     */
    names() {
        return [this.name, ...this.aliases];
    }

    /**
     * Get this command's usage statement as a string.
     * This should generally only include the name
     * @return {string}
     */
    getUsageStatement() {
        if (this.usage) {
            return this.usage;
        }

        let str = this.name;

        for (const arg of this.args) {
            const usage = arg.getUsageString();
            if (usage) {
                str += ` ${usage}`;
            }
        }

        return str;
    }

    /**
     * Get a help statement for this command.
     * Formatting defaults to markdown, which
     * should work in both discord and slack.
     * @return {string}
     */
    getHelpStatement() {
        const lines = [`Help - *${this.name}*`, ''];

        if (this.aliases.length > 0) {
            lines.push(`Also known as: \`${this.aliases.join('`, `')}\``);
        }

        lines.push(`Usage: \`${this.getUsageStatement()}\``);

        if (this.examples.length > 0) {
            lines.push('Examples:');
            for (const example of this.examples) {
                lines.push(` \`${this.name} ${example}\``);
            }
        }

        if (this.description) {
            lines.push(`Description: \`${this.description}\``);
        }

        lines.push(`Type: ${this.type}`);

        return lines.join('\n');
    }

    /**
     * Whether this command can be run.
     * It is often most useful to override Command.prototype.canRun rather than per-command.
     * @param message {object} - The message object sent by the user.
     * @param bot {object} - The bot to use for replies, checking user data, etc.
     * @param extra {object} - Extra metadata provided to the {@link CommandHandler}
     * @return {Promise.<boolean>}
     */
    async canRun(message, bot, extra) { return true; }

    /**
     * The method to call upon when the command is run.
     * @param message {object} - The message object sent by the user.
     * @param bot {object} - The bot to use for replies, checking user data, etc.
     * @param extra - Extra metadata provided to the {@link CommandHandler}
     * @return {Promise.<void>}
     */
    async run(message, bot, extra) {}
}

exports.CommandArg = CommandArg;
exports.Command = Command;