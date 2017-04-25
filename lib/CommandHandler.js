const chalk = require('chalk');

class CommandHandler{
    constructor(bot, messageFormatter){
        this.bot = bot;

        // Defaults to slack
        this.formatter = Object.assign({
            nocommand: ()=> false,
            minargs: (msg, cmd, bot)=> `Not enough arguments! Usage: \`${cmd.getUsageStatement()}\``,
            maxargs: (msg, cmd, bot)=> `Too many arguments! Usage: \`${cmd.getUsageStatement()}\``,
            error: (msg, cmd, bot, e)=> `Unable to process command *${cmd.name}*, please try again later.\nError: ${e}`,
            logger: (msg, cmd, bot, success)=> `User ${chalk.cyan(msg.user.id)} executed command ${chalk.magenta(msg.text)} ${(success) ? chalk.green('Successfully') : chalk.red('Unsuccessfully')}`,
            permission: (msg, cmd, bot)=> `Sorry, but you can't use this command.`
        }, (messageFormatter || {}));

        this.runCommand = function (command, ...callArgs) {
            command.run(...callArgs);
        };

        this.commands = {};
    }

    add(name, command){
        this.commands[name.toLowerCase()] = command;
    }

    register(command){
        this.add(command.name, command);

        command.aliases.forEach((alias)=>{
            this.add(alias, command);
        });
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

    // Message MUST have reply() and .commandName
    process(message, extra = {}, bot = this.bot){
        message.commandName = message.commandName.toLowerCase();

        let reply = message.reply.bind(message);

        if(this.commands.hasOwnProperty(message.commandName)){
            let command = this.commands[message.commandName];

            let notify = (formatter, action, ...extra)=>{
                let format = formatter(message, command, bot, ...extra);

                if(format){
                    action(format);
                }
            };

            let log = (success)=> notify(this.formatter.logger, console.log, success);

            if(!command.canRun(message, bot, extra)){
                log(false);

                notify(this.formatter.permission, reply);
            }
            else if(message.args.length < command.minArgs){
                log(false);

                notify(this.formatter.minargs, reply);
            }else if(message.args.length > command.maxArgs){
                log(false);

                notify(this.formatter.maxargs, reply);
            }else{
                log(true);

                try{
                    this.runCommand(command, message, bot, extra);
                }catch (e){
                    notify(this.formatter.error, reply, e);
                }
            }
        }else{
            let format = this.formatter.nocommand(message, bot);
            if(format){
                reply(format);
            }
        }
    }
}

module.exports = CommandHandler;