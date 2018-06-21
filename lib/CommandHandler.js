/* eslint-disable no-console,no-unused-vars */
const fs = require('fs');
const path = require('path');
const util = require('util');
const readDir = util.promisify(fs.readdir);

const chalk = require('chalk');
const Collection = require('djs-collection');

const { Command } = require('./Command');

class CommandHandler {
    /**
     *
     * @param {object|{}} [opts={}] - Options to use
     * @param {object} [opts.formatter] - An optional formatter to use for messages
     * @param {object} [opts.messageFormatter] - Same as formatter.
     * @param {boolean} [opts.enforceArgLimits] - Whether or not this handler should enforce arg limits by default. If this is false, users can submit more args than the max (but not less than min)
     */
    constructor(opts = {}) {
        this.client = opts.client || opts.bot;

        // Defaults to slack
        /**
         * The formatters to use for various messages being sent back to the user when some stuff fails.
         * If you want to prevent a message from being sent, have it return false.
         * @type {object}
         */
        this.formatter = Object.assign({
            nocommand: () => false,
            minargs: (msg, cmd, client, extra) => `Not enough arguments! Usage: \`${cmd.getUsageStatement()}\``,
            maxargs: (msg, cmd, client, extra) => `Too many arguments! Usage: \`${cmd.getUsageStatement()}\``,
            error: (msg, cmd, client, extra, e) => `Unable to process command *${cmd.name}*, please try again later.\nError: ${e}`,
            logger: (msg, cmd, client, extra, success) => `User ${chalk.cyan(msg.user.id)} executed command ${chalk.magenta(msg.text)} ${(success) ? chalk.green('Successfully') : chalk.red('Unsuccessfully')}`,
            permission: (msg, cmd, client, extra) => 'Sorry, but you can\'t use this command.',
            disabled: (msg, cmd, client, extra) => 'Sorry, but this command is disabled.'
        }, (opts.messageFormatter || opts.formatter || {}));

        /**
         *  ¯\_(ツ)_/¯ pretty obvious
         * @type {Collection}
         */
        this.commands = new Collection();

        this.enforceArgLimits = opts.enforceArgLimits || false;
    }

    /**
     * The method to use when running a command.
     * @param command {Command} - The command to run
     * @param callArgs
     * @return {Promise}
     */
    static runCommand(command, ...callArgs) {
        return command.run(...callArgs);
    }

    /**
     * Add a command with the given name  to this handler.
     * @param {string} name - The name of the command
     * @param {Command} command - The command to add
     * @private
     */
    _add(name, command) {
        this.commands.set(name.toLowerCase(), command);
    }

    /**
     * Register any number of commands.
     * <p>
     * This registers the Command.name and all aliases in
     * Command.alias.
     * @param {...Command} commands - 1 or more commands to register
     */
    register(...commands) {
        for (const item of commands) {
            const command = this._create(item);

            if (!command || !(command instanceof Command)) {
                continue;
            }

            for (const alias of [command.name, ...command.aliases]) {
                this._add(alias, command);
            }
        }
    }

    /**
     * Remove a particular command name from this handler.
     * <p>
     * This does not remove aliases, so use
     * {@link CommandHandler#unregister} for that.
     * @param {string} name - The name of the command to remove.
     */
    _remove(name) {
        this.commands.delete(name.toLowerCase());
    }

    /**
     * Remove a particular command from this handler.
     * <p>
     * This removes the command name and all aliases.
     * @param {...Command} commands - 1 or more commands to un-register
     */
    unregister(...commands) {
        for (const command of commands) {
            // Don't try to register invalid commands
            if (!(command instanceof Command)) {
                continue;
            }

            this._remove(command.name);

            command.aliases.forEach((alias) => {
                this._remove(alias);
            });
        }
    }

    /**
     * Turn an item into an array of valid commands.
     * If this returns null, the item is invalid.
     * @param {Command|function|object|Array} i - An item to turn into an array of commands.
     * @param {...*} d - Any parameters to pass to the new instance if needed.
     * @return {Array|null}
     * @private
     */
    _create(i, ...d) {
        if (i instanceof Command) {
            return [i];
        }

        if (typeof i === 'function') {
            // Assume it's a command that can be instantiated
            const c = new i(...d);

            if (c instanceof Command) {
                return [c];
            }

            return null;
        }

        if (typeof i === 'object') {
            const commands = [];

            if (Array.isArray(i)) {
                for (const e of i) {
                    const c = this._create(e, ...d);

                    commands.push(...(Array.isArray(c) ? c : [c]));
                }
            } else {
                for (const k of Object.keys(i)) {
                    const e = i[k];

                    const c = this._create(e, ...d);

                    commands.push(...(Array.isArray(c) ? c : [c]));
                }
            }

            return (commands.length) ? commands.filter(c => !!c && c instanceof Command) : null;
        }

        return null;
    }

    /**
     * Populate this CommandHandler instance with
     * a whole bunch of commands at once.
     * <p>
     * If a string is passed, the handler will attempt
     * to read all files from a directory whose absolute
     * path is the input. This works but getting absolute
     * path might be more pain than it's worth.
     * <p>
     * You can also pass a Command instance, an uninitialized
     * Command instance, an Array containing either, or an object
     * whose values are either.
     * <p>
     * This returns a promise because readdir could fail. If you're
     * not passing this method a string, it shouldn't really be possible
     * to fail, but may as well catch it just in case.
     * @param {string|Array|object|Command} input - Input to populate with
     * @param {...*} d - Extra params to use when initializing uninitialized commands, if applicable
     * @return {Promise.<void>}
     */
    async populate (input, ...d) {
        // Assume it's a path.
        if (typeof input === 'string') {
            try {
                const files = await readDir(input);
                const commands = [];

                for (const file of files) {
                    // eslint-disable-next-line global-require
                    const commandFile = require(path.join(input, file));

                    commands.push(commandFile);
                }

                input = commands;
            } catch (e) {
                // pass it up, yo
                throw e;
            }
        }

        // Don't really care what it is, try to let _create handle it.
        const commands = this._create(input, ...d);

        if (commands) {
            this.register(...commands);
        }
    }

    /**
     * Process a message and run it if it gets that far.
     * <p>
     * This checks the following things before allowing the command to run:
     * <p> - If the command exists in registered commands, obviously.
     * <p> - If there are too little or too many args
     * <p> - If {@link Command#canRun} returns false.
     * <p>
     * Then, it attempts to run the command, and catches any errors thrown.
     *
     * @param {object} message - The message sent by the user.
     * @param {string} message.commandName - The name of the command sent by the user.
     * @param {function(*)} message.reply - A function to reply to the message, whose first param is the reply text.
     * @param {Array.<string>} message.args - An array of string arguments the message was passed.
     * @param {object} [extra = {}] - Extra data to pass to the command when it is run
     * @param {object} [client = this.client] - The client to pass to the command when it is run.
     * @return {Promise.<void>}
     */
    async process(message, extra = {}, client = this.client) {
        if (!message.reply || !message.commandName) {
            return;
        }

        // Just in case it's not lowercase already...
        message.commandName = message.commandName.toLowerCase();

        // This only exists for IDE highlights/autocomplete
        /**
         * Reply to the message.
         * @param {...*} d - data to reply with
         * @return {Promise.<void>}
         */
        async function reply(...d) {
            try {
                await message.reply(...d);
            } catch (e) {
                console.error('Could not reply to a message when processing a command:');
                console.error(e);
                throw e;
            }
        }

        if (this.commands.has(message.commandName)) {
            const command = this.commands.get(message.commandName);

            async function notify(formatter, action = reply, ...params) {
                const format = formatter(message, command, client, extra, ...params);

                if (format) {
                    try {
                        await action(format);
                    } catch (e) {
                        throw e;
                    }
                }
            }

            const log = (success) => notify(this.formatter.logger, console.log, success);

            if (command.disabled === true) {
                return notify(this.formatter.disabled);
            }

            if (message.args.length < command.minArgs) {
                return log(false)
                    .then(() => notify(this.formatter.minargs));
            }

            if (message.args.length > command.maxArgs) {
                if (this.enforceArgLimits) {
                    return log(false)
                        .then(() => notify(this.formatter.maxargs));
                }

                message.args = message.args.slice(0, command.maxArgs);
            }

            let canRun;
            try {
                canRun = await command.canRun(message, client, extra);
            } catch (e) {
                console.error('canRun ran into an error: ');
                console.error(e);

                return notify(this.formatter.error, reply, e);
            }

            if (!canRun) {
                return log(false)
                    .then(() => notify(this.formatter.permission));
            }

            try {
                await log(true);
            } catch (e) {
                throw e;
            }

            const err = (e) => {
                return notify(this.formatter.error, reply, e);
            };

            try {
                await CommandHandler.runCommand(command, message, client, extra).catch(err);
            } catch (e) {
                return err(e);
            }
        } else {
            const format = this.formatter.nocommand(message, client, extra);

            if (format) {
                return reply(format);
            }
        }
    }

    static get defaultHelpFilter() {
        return (entry) => (entry.command.aliases.indexOf(entry.name) === -1 && entry.command.type === 'command' && entry.command.allowedUsers.length === 0);
    }

    static get defaultHelpFormatter() {
        return (command) => (`*${command.name}* - ${command.description} | \`${command.getUsageStatement()}\``);
    }

    getHelpStatement(formatter = CommandHandler.defaultHelpFormatter, filter = CommandHandler.defaultHelpFilter) {
        let help = '';

        for (const [name, command] of this.commands.entries()) {
            if (!filter({ name, command })) {
                continue;
            }

            const format = formatter(command);

            if (!format) {
                continue;
            }

            help += format;
        }

        return help;
    }

    *[Symbol.iterator]() {
        for (const command of new Set(this.commands.values())) {
            yield command;
        }
    }
}

module.exports = CommandHandler;