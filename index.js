require('./lib/polyfill');

const Command = require('./lib/Command').Command;
const CommandArg = require('./lib/Command').CommandArg;
const CommandHandler = require('./lib/CommandHandler');

module.exports = {Command, CommandArg, CommandHandler};