require('./lib/polyfill');

const {Command, CommandArg} = require('./lib/Command');
const CommandHandler = require('./lib/CommandHandler');
const LegacyConvert = require('./lib/LegacyConvert');
const CommandParent = require('./lib/CommandParent');
const docs = require('./lib/docs');

module.exports = {Command, CommandArg, CommandHandler, LegacyConvert, CommandParent, docs };