# Frozor Commands

Easy to use command creation system!

## Installation
`npm i --save frozor-commands`

*Note: This documentation is unfinished.*

## Usage

The module exports properties equivalent to the classes listed below, e.g. FrozorCommands.Command

### CommandArg Class
#### Description
Use this class to populate your command's arguments array. Type is not validated, but is useful for users.

#### Constructor
`<String name>, [String type], [Boolean required (default true)]`

#### Properties

* name: the name of the command arg (required)
* type: the type of the command arg (optional)
* required: whether the command arg should be required (default true),
* hide: whether the command arg should be hidden (default false)

#### Methods

#### getVariableArgs (Static)
Returns an array of CommandArg instances based on the call parameters (count, name, type, required).

The first instance will be not hidden, and will have `[]` after the type to show that there may be multiple (or type will be equal to `[]` if none is set)

This is intended to be used if the user can input CommandArgs where `1 <= args.length <= n`

Example:

```javascript
class EchoCommand extends Command{
    constructor(){
        super("echo", [], "Echoes stuff back to you!", CommandArg.getVariableArgs(50, 'text', 'String', true))
    }
    
    run(msg, bot){
        /*
        * Because required was set to true above,
        * there must be at least 1 element for the
        * 'text' arg, and up to 50.
        */
        let input = msg.args.join(' ');
        
        msg.reply(`Here's what you wrote: ${input}`);
    }
}
```

This can, of course, be used in conjunction with other arguments, but generally this should be the last argument in your array.

```javascript
class SayHello extends Command{
    constructor(){
        // Here we use ES6 spread syntax to avoid having to use .concat, but concat works too.
        super("echo", [], "Say hi to the bot!", [new CommandArg('user_name', 'String', true), ...CommandArg.getVariableArgs(50, 'text', 'String', false)])
    }
    
    run(msg, bot){
        /*
        * Because required was set to false above,
        * there can be between 0 and 50 text args.
        * we can check args.length to see how many
        * there are, or based on the command it could
        * just be ignored.
        */
        let name = msg.args[0]
        
        // Set mention to false here so it doesn't mention them
        msg.reply(`Hey there, ${name}}`, false);
    }
}
```

#### getUsageString
Returns a string based on whether the arg is hidden, its type, and if it is required.

Required commands have arrow brackets (<>) around them, optional ones have square brackets ([]) around them. 

Example return value for optional with type `String` and name `text`: `[String text]`

Example return value for required with type `String` and name `text`: `<String text>`

#### parseArgs
Returns an object based on parsed arguments in an array.

Properties can be represented in a few ways
* key=value
* key="value with spaces"
* --key value
* --key value with spaces
 
For instance:

`['--prop', 'hello', 'world', 'how', 'are', 'you']` will return `{prop: 'hello world how are you'}`

`['prop="', 'hello', 'world', 'how', 'are', 'you"']` will return `{prop: 'hello world how are you'}`

Dash properties without a key will be set to true.

`['--prop', '--prop2']` will return `{prop: true, prop2: true}`

key=value properties that attempt to include spaces without quotation marks will be set to the value before the first space. If there is no closing quotation, it will also be set to the first value before the space.

### Command Class

#### Constructor
`<String name>, [Array aliases], [String description], [Array<CommandArg> args], [String type], [Array allowedUsers]`

#### Properties
* name: the name of the command, what users have to type to execute it
* aliases: an array containing all alternative names users can type in order to run your command
* description: the description of the command, useful if you write a help command
* args: an array of CommandArg instances that allow the command to determine min/max args
* maxArgs: a number set to the length of args
* minArgs: a number set to the number of args which have required = true
* type: command type, useful if you want to only allow certain users to run commands with certain types, etc.
* allowedUsers: a property not used by default, but useful if you want to restrict a command to multiple users.

If you want to use allowedUsers, you should override Command.prototype.canRun !


#### Methods

##### getUsageStatement

This method returns a string which contains the name of the command and all of its CommandArgs' usage strings. This also filters out any usage statements that are undefined or are equal to '', so it does not return hidden ones.

An example output would look something like one of these:

`google <String[] terms>`

`help`

`usage <String command>`

`whois <SlackMention user>`

##### canRun

This method must be synchronous (at least for the time being) and return a boolean indicating whether the command can be run. It is passed args (msg, bot, extra). You do not have to include this method, because by default it just reutrns true.

In some cases, you may want to override canRun for all commands in your program. You can do so by overriding the prototype for canRun.

Example usage (with frozor-slackbot API):

```javascript
Command.prototype.canRun = function (msg, bot) {
    if(this.allowedUsers.length > 0){
        if(bot.api.cache.users.hasOwnProperty(msg.user.id)){
            return (this.allowedUsers.indexOf(bot.api.cache.users[msg.user.id].name) > -1);
        }else{
            return false;
        }
    }
};
```

#### run

This is the method called when a user actually runs your command. It is passed the args (msg, bot, extra).

Nothing needs to be returned, so this may be async.

If your method raises an unhandled exception, the CommandHandler will let the user know an exception occurred.

### CommandHandler

#### Description

Handles commands, of course! This is where commands are registered and run.

#### Constructor

`SomeBot bot, Object messageFormatter`

#### Properties

* bot: this is the bot that is, by default, passed to all commands. You can omit this when instantiating the class, but you should probably pass it in the `handle` method if you do that.
* formatter: this is an object which contains methods for formatting messages. All formatters are used in a `message.reply` call, with the exception of logger which is used for `console.log`. Unless otherwise noted, the method takes the parameters (message, command, bot)
    * nocommand: WHen a user runs a nonexistent command
    * minargs: When the user has not entered enough args
    * maxargs: When the user entered too many args
    * error: When the command failed, takes an additional property for the error raised (e.g. (msg, cmd, bot, error))
    * logger: Formats the message to console.log when a user runs a command, takes an additional property (boolean) for the command's success (e.g. (msg, cmd, bot success)).
    * permission: When the user is unable to use the command, which can happen if canRun is false
* runCommand: this method is called when all other checks have passed and the handler is ready to run the command. You can override this to perform whatever tasks you would like, including completely ignoring the command if you wanted to for whatever reason.
* commands: an Object containing all the commands.

If you want to override `formatter`, pass an object for the parameter `messageFormatter` in the constructor with whichever formatters you'd like to override. Return false to prevent it from performing an action. If you'd still like to perform the action, just use a different string to do so, return a string as your value.

Example:

```javascript
const commands = new CommandHandler(MyBot, {
    // Override minargs with a custom message
    minargs: (msg, cmd, bot)=> `You didn't enter enough args!`,
    // Don't console.log
    logger: ()=> false
});
```

#### Methods

##### add

Takes arguments (name, command) and adds it to the commands list

##### register

Takes a Command argument and adds it and all its aliases to the commands list by calling `add`

##### process

This is how commands are processed. This takes arguments (message, extra, bot), where

* message: the message that triggered the command to be invoked. Required properties listed below.
    * args: an array representing the arguments passed to it.
    * commandName: the command the user is attempting to invoke
    * reply: a method that takes a string argument and replies in some way to the user. This is not necessary if you override the formatter to return false for all (non-logger) events.
* extra: An (optional) object that can contain any extra data you want to pass to your comomands. This could be the existence of other bots, some variables you want to pass, or anything else you'd like the command to have available (since, in practice, your commands should be separated from your main script). This defaults to just {}
* bot: An (optional) bot to use instead of the bot you may or may not have provided in the constructor.

This method does all the following:

* Checks if the command exists in registered commands
    * If not, this is where the `nocommand` formatter is used
* Checks if command.canRun returns true
    * If not, this is where the `permission` formatter is used
* Checks if message.args.length >= minArgs
    * If not, this is where the `minargs` formatter is used
* Checks if message.args.length <= maxArgs
    * If not, this is where the `maxargs` formatter is used
* Calls the method runCommand
    * If an error is caught (since the call is wrapped in a try catch), this is where the `error` formatter is used
    
## Putting It All Together

This example uses the frozor-slackbot api

```javascript
const SlackBot = require('frozor-slackbot');
const {CommandArg, Command, CommandHandler} = require('frozor-commands');

const bot = new SlackBot(process.env.SLACK_TOKEN);
bot.commands = new CommandHandler(bot);

class HelloCommand extends Command{
    constructor(){
        super('hello', ['hi', 'hey'], 'Say hi!', CommandArg.getVariableArgs(300, 'text', 'String', false))
    }
    
    run(message){
        message.reply('Hey there!')
    }
}

class SpeedCommand extends Command{
    constructor(){
        super('speed', ['ping', 'speedtest', 'pingtest'], 'See how long it takes to process a command!')
    }
    
    run(message, bot, extra){
        message.reply(`I took \`${Date.now() - extra.startTime}\` ms to process and run that command.`)
    }
}

bot.commands.register(new HelloCommand());
bot.commands.register(new SpeedCommand());

bot.init();

bot.on('message', (msg)=>{
    if(msg.startsWith('!')){
        msg.args = msg.text.split(' ');
        msg.commandName = msg.args.shift().substr(1);
        bot.commands.process(msg, {startTime: Date.now()});
    }
});
```

In this example, we've initialized a SlackBot and given it two commands: 'hello', and 'speed'. Each time the bot receives a message, it's checked for the command prefix (in this case a '!'), and if the prefix matches this command prefix, the command is processed. If the user provided too many or too few args, the bot will reply with a message letting them know such. If the command runs but hits an error, the bot will also let them know such.