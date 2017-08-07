const { Command } = require('./Command');
const Collection = require('djs-collection');

class CommandParent extends Command {
    /**
     * Create a CommandParent instance. This can be used to run sub-commands.
     * @param data {object} - Data to instantiate the command and parent with.
     * @Param data.children {Array.<Command|CommandParent>} - Command instances to use as subcommands for the parent.
     */
    constructor(data) {
        if (!data.children || data.children.length === 0) {
            throw new Error('Children must be provided to CommandParent');
        }

        if (!Array.isArray(data.children)) {
            throw new TypeError('Expected type Array in data.children')
        }

        let depth = 0;

        const children = new Collection();

        for (const child of data.children) {
            if (!child instanceof Command) {
                throw new TypeError('Expected type Command in children. Did you forget to instantiate it?');
            }

            for (const name of child.names()) {
                children.set(name, child);
            }

            if (child instanceof CommandParent) {
                depth = Math.max(depth, child.depth);
            }
        }

        depth += 1;

        super(data);

        this.maxArgs = Number.POSITIVE_INFINITY;

        this.depth = depth;
        this.children = children;

        this.subCommandNotProvided = 'Please provide a sub-command to run.';
        this.subCommandFail = 'Hmm, that sub-command doesn\'t seem to exist. Sorry about that.';
    }

    /**
     * Act on a message's intended action.
     * If overriding, use this whenever you want to run a sub-command.
     * Don't forget to strip unnecessary args.
     * @param action {string} - An action to act upon... this is effectively just a sub-command.
     * @param msg {object} - The message to act upon. Requires args property and reply method.
     * @param {object} [bot] - The bot to pass.
     * @param {object} [extra] - The object to pass.
     * @return {Promise} - The children's run result.
     */
    act(action, msg, bot, extra) {
        if (!this.children.has(action)) {
            return msg.reply(this.subCommandFail);
        }

        // Get the child and run it, returning the promise since this is an AsyncFunction
        return this.children.get(subCommand).run(msg, bot, extra);
    }

    async run(msg, bot, extra) {
        if (msg.args.length === 0) {
            return msg.reply(this.subCommandNotProvided);
        }

        const subCommand = msg.args[0].toLowerCase();

        // Remove the first arg since the next command doesn't care about its own arg.
        msg.args = msg.args.slice(1);

        return this.act(msg, subCommand);
    }
}

module.exports = CommandParent;