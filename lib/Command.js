const ArgumentRegex = /(.+)=(.+)/;
const DashArgumentRegex = /--(.+)/;

class CommandArg{
    constructor(name, type, required = true) {
        this.name = name;
        this.type = type;
        this.required = required;
        this.hide = false;
    }

    getUsageString(){
        return (!this.hide)?`${(!this.required) ? "[" : "<"}${(this.type !== null) ? this.type + " " : ""}${this.name}${(!this.required) ? "]" : ">"}`:''
    }

    static getVariableArgs(count, name, type, required){
        let firstArg = new CommandArg(name, (type||'')+'[]', required);

        // Dummy values to reduce memory
        let arg = new CommandArg('', null, false);
        arg.hide = true;

        return [firstArg].concat(Array(count-1).fill(arg));
    }

    static parseArgs(args){
        let parsed = {};

        for(let i = 0; i < args.length; i++){
            let match = ArgumentRegex.exec(args[i]);

            if(match){
                match[1] = match[1].toLowerCase();

                if(match[2].startsWith('"')){
                    // Could be a quoted arg
                    // search for the next quote, add until then
                    let quotedArg = match[2].slice(1);
                    let hasEnd = false;
                    for(let j = i+1; j < args.length; j++){
                        if(args[j].includes('"') && args[j].charAt(args[j].indexOf('"')-1) !== '\\'){
                            // We're going to consider it the end of the quote
                            let split = args[j].split('"');

                            quotedArg += ' ' + split[0];

                            args[j] = split[1];

                            parsed[match[1]] = quotedArg;

                            i = --j;

                            hasEnd = true;

                            break;
                        }else{
                            quotedArg += ' ' + args[j];
                        }
                    }

                    if(!hasEnd){
                        parsed[match[1]] = match[2];
                    }
                }else{
                    parsed[match[1]] = match[2];
                }
            }
            else{
                let dashMatch = DashArgumentRegex.exec(args[i]);

                if(dashMatch){
                    dashMatch[1] = dashMatch[1].toLowerCase();

                    if((i + 2) < args.length){
                        let arg = args[i+1];

                        function add(j) {
                            arg += ' ' + args[j];
                        }

                        for(let j = i+2; j < args.length; j++){
                            if(j === args.length - 1){
                                add(j);

                                parsed[dashMatch[1]] = arg;
                                i = --j;

                                break;
                            }

                            if(DashArgumentRegex.test(args[j]) || ArgumentRegex.test(args[j])){
                                parsed[dashMatch[1]] = arg;
                                i = --j;

                                break;
                            }else{
                                add(j);
                            }
                        }
                    }else{
                        if(i >= args.length-1){
                            parsed[dashMatch[1]] = true;
                        }else{
                            if(DashArgumentRegex.test(args[i+1])){
                                parsed[dashMatch[1]] = true;
                            }else{
                                parsed[dashMatch[1]] = args[i+1];
                            }
                        }
                    }
                }
            }
        }

        return parsed;
    }

    static parseCommandArgs(args, command){
        let parsed = {};

        for(let i = 0; i < args.length; i++){
            let argName = command.args[i].name;
            if(!parsed.hasOwnProperty(argName)){
                parsed[argName] = args[i];
            }else{
                parsed[argName] += ` ${args[i]}`;
            }
        }

        return parsed;
    }
}

class Command{
    constructor(name, aliases = [], description = '', args = [], type = 'command'){
        this.name = name;
        this.aliases = aliases;
        this.description = description;
        this.minArgs = 0;
        this.maxArgs = 0;
        this.args = args;
        this.allowedUsers = [];
        this.type = type;

        this.maxArgs = args.length;
        this.minArgs = (this.args.filter((arg)=> arg.required)).length
    }

    getUsageStatement(){
        let str = `${this.name}`;
        this.args.forEach((arg)=>{
            let usage = arg.getUsageString();
            if(usage && usage != ''){
                str += ` ${usage}`;
            }
        });
        return str;
    }

    canRun(message, bot, extra){ return true; }
    run(message, bot, extra){}
}

exports.CommandArg = CommandArg;
exports.Command = Command;