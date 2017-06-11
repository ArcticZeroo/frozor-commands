const chalk = require('chalk');

class CommandHandler{
    constructor(opts = {}){
        this.bot = opts.bot;

        // Defaults to slack
        this.formatter = Object.assign({
            nocommand: ()=> false,
            minargs: (msg, cmd, bot, extra)=> `Not enough arguments! Usage: \`${cmd.getUsageStatement()}\``,
            maxargs: (msg, cmd, bot, extra)=> `Too many arguments! Usage: \`${cmd.getUsageStatement()}\``,
            error: (msg, cmd, bot, extra, e)=> `Unable to process command *${cmd.name}*, please try again later.\nError: ${e}`,
            logger: (msg, cmd, bot, extra, success)=> `User ${chalk.cyan(msg.user.id)} executed command ${chalk.magenta(msg.text)} ${(success) ? chalk.green('Successfully') : chalk.red('Unsuccessfully')}`,
            permission: (msg, cmd, bot, extra)=> `Sorry, but you can't use this command.`,
            disabled: (msg, cmd, bot, extra)=> `Sorry, but this command is disabled.`
        }, (opts.messageFormatter || opts.formatter || {}));

        this.runCommand = function (command, ...callArgs) {
            return command.run(...callArgs);
        };

        this.commands = {};
    }

    add(name, command){
        this.commands[name.toLowerCase()] = command;
    }

    register(...commands){
        for (let command of commands) {
            this.add(command.name, command);

            command.aliases.forEach((alias)=>{
                this.add(alias.toLowerCase(), command);
            });
        }
    }

    remove(name){
        delete this.commands[name.toLowerCase()];
    }

    unregister(command){
        this.remove(command.name);

        command.aliases.forEach((alias)=>{
            this.remove(alias);
        });
    }

    populate (path) {

    }

    // Message MUST have reply() and .commandName
    async process(message, extra = {}, bot = this.bot){
        message.commandName = message.commandName.toLowerCase();

        const reply = message.reply.bind(message);

        if(this.commands.hasOwnProperty(message.commandName)){
            const command = this.commands[message.commandName];

            const notify = (formatter, action = reply, ...params)=>{
                let format = formatter(message, command, bot, extra, ...params);

                if(format){
                    action(format);
                }
            };

            let log = (success)=> notify(this.formatter.logger, console.log, success);

            if (command.disabled === true) {
                notify(this.formatter.disabled);
                return;
            }

            let canRun;

            try{
                canRun = await command.canRun(message, bot, extra);
            }catch (e){
                console.error(e);
                notify(this.formatter.error, reply, e);
                return;
            }

            if(!canRun){
                log(false);

                notify(this.formatter.permission);
            }
            else if(message.args.length < command.minArgs){
                log(false);

                notify(this.formatter.minargs);
            }
            else if(message.args.length > command.maxArgs){
                log(false);

                notify(this.formatter.maxargs);
            }
            else{
                log(true);

                // Arrow so it binds to self
                const err = (e)=>{
                    notify(this.formatter.error, reply, e);
                };

                try{
                    await this.runCommand(command, message, bot, extra).catch(err);
                }catch (e){
                    err(e);
                }
            }
        }else{
            let format = this.formatter.nocommand(message, bot, extra);
            if(format){
                reply(format);
            }
        }
    }
}

module.exports = CommandHandler;