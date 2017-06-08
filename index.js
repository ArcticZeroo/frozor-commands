require('./lib/polyfill');

const {Command, CommandArg} = require('./lib/Command');
const CommandHandler = require('./lib/CommandHandler');
const LegacyConvert = require('./lib/LegacyConvert');

module.exports = {Command, CommandArg, CommandHandler, LegacyConvert};