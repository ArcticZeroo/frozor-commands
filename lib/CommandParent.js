const { Command } = require('./Command');
const Collection = require('djs-collection');
const CommandHandler = require('./CommandHandler');

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
            throw new TypeError('Expected type Array in data.children');
        }

        super(data);

        let depth = 0;

        const children = new CommandHandler({
            formatter: {
                nocommand: this.subCommandFail.bind(this),
                logger: () => false,
                ...data.formatter
            }
        });

        for (const item of data.children) {
            const created = CommandHandler.instantiate(item);

            if (!created) {
                throw new TypeError(`Invalid child provided: ${item}`);
            }

            const [child] = created;

            child.parent = this;

            children.register(child);

            if (child instanceof CommandParent) {
                depth = Math.max(depth, child.depth);
            }
        }

        depth += 1;

        this.maxArgs = Number.POSITIVE_INFINITY;

        this.depth = depth;
        this.children = children;
    }

    getUsageStatement() {
        return `${this.name} [${Array.from(this).map(child => child.name).join('|')}]`;
    }

    subCommandNotProvided(msg, bot, extra) {
        return `Please provide a sub-command to run. Usage: \`${this.getUsageStatement()}\``;
    }

    subCommandFail(subCommand, msg, bot, extra) {
        return `Hmm, the sub-command *${subCommand}* doesn't seem to exist.`;
    }

    async run(msg, bot, extra) {
        if (msg.args.length === 0) {
            return msg.reply(this.subCommandNotProvided(msg, bot, extra));
        }

        msg.commandName = msg.args.shift().toLowerCase();

        return this.children.process(msg, extra, bot);
    }

    [Symbol.iterator]() {
        return this.children[Symbol.iterator]();
    }
}

module.exports = CommandParent;