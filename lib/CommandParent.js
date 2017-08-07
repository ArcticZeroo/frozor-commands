const { Command } = require('./Command');
const Collection = require('djs-collection');

class CommandParent extends Command {
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
    }

    get subCommandFail() {
        return ()=> 'Hmm, that sub-command doesn\'t seem to exist. Sorry about that.';
    }

    async run(msg, bot, extra) {
        const subCommand = msg.args[0].toLowerCase();

        if (this.children.has(subCommand)) {
            // Remove the first arg since the next command doesn't care about its own arg.
            msg.args = msg.args.slice(1);

            // Get the child and run it, returning the promise since this is an AsyncFunction
            return this.children.get(subCommand).run(msg, bot, extra);
        }

        return msg.reply(this.subCommandFail);
    }
}

module.exports = CommandParent;