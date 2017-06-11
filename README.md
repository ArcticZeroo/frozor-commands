# Frozor Commands

Easy to use command creation system!

## Installation
`npm i --save frozor-commands`

*Note: This documentation is unfinished. The module itself is still undergoing some design changes. As I update I will try to keep the documentation updated as well, but sometimes lag behind. Feel free to open a pull request if you would like to contribute to the module or the readme.*

## Usage

The module exports properties are equivalent to the names of the classes listed below.
```javascript
const FrozorCommands = require('frozor-commands');

FrozorCommands.Command // The command class
FrozorCommands.CommandArg // The command arg class
FrozorCommands.CommandHandler // the command handler class
// etc
```

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
        super({
            name: 'echo',
            // Aliases is optional, but I'm including it just for my own sanity.
            aliases: [],
            description: 'Echoes stuff back to you!',
            args: CommandArg.getVariableArgs(50, 'text', 'String', true)
        })
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
const {Command, CommandArg} = require('frozor-commands');

class SayHello extends Command{
    constructor(){
        // Here we use ES6 spread syntax to avoid having to use .concat, but concat works too.
        super({
            name: 'echo',
            description: 'Say hi to the bot!',
            args: [new CommandArg('user_name', 'String', true), ...CommandArg.getVariableArgs(50, 'text', 'String', false)]
        })
    }
    
    run(msg, bot){
        /*
        * Because required was set to false above,
        * there can be between 0 and 50 text args.
        * we can check args.length to see how many
        * there are, or based on the command it could
        * just be ignored.
        */
        let name = msg.args[0];
        
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
Takes an array of strings as its input, and returns an object based on parsed arguments in an array.

If you only have a string/message text and want to parse it, the following can be used to get a message's args: `msg.text.split(' ').filter((m)=> m.trim() !== '');`. This prevents users from accidentally entering blank spaces as arguments, for instance on mobile.

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
`<Object options>`

#### Properties
(These are properties you can pass into the options object)
* name: the name of the command, what users have to type to execute it
* aliases: an array containing all alternative names users can type in order to run your command
* description: the description of the command, useful if you write a help command
* args: an array of CommandArg instances that allow the command to determine min/max args
* maxArgs: a number set to the length of args
* minArgs: a number set to the number of args which have required = true
* type: command type, useful if you want to only allow certain users to run commands with certain types, etc.
* allowedUsers: a property not used by default (it's set to []), but useful if you want to restrict a command to multiple users.

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

This method must be async (using the node 7.6+ keyword) and return a boolean indicating whether the command can be run. It is passed args (msg, bot, extra). You do not have to include this method, because by default it just reutrns true.

In some cases, you may want to override canRun for all commands in your program. You can do so by overriding the prototype for canRun.

Example usage (with frozor-slackbot API):

```javascript
// Make sure this is not an arrow function! If so, you won't be able to use `this` as if you were in the Command class.
Command.prototype.canRun = async function (msg, bot) {
    // If the command only allows certain users to run it...
    if(this.allowedUsers.length > 0){
        // Get the user from the API's storage
        let slackUser;
        try {
            slackUser = await bot.api.storage.users.get(msg.user.id);
        } catch (e) {
            // Something went wrong when grabbing the user
            // So we just say they can't run it.
            return false;
        }
        
        return this.allowedUsers.includes(slackUser.name);
    }
};
```

#### run

This is the method called when a user actually runs your command. It is passed the args (msg, bot, extra).

This must use node's `async` keyword, but nothing needs to be returned.

If your method raises an unhandled exception, the CommandHandler will let the user know an exception occurred. However, you must still catch all promises, since node does not allow that to be caught.

### CommandHandler

#### Description

Handles commands, of course! This is where commands are registered and run.

#### Constructor

`Object options`

#### Properties (options)

* bot: this is the bot that is, by default, passed to all commands. You can omit this when instantiating the class, but you should probably pass it in the `handle` method if you do that.
    * This property is only used when calling the command and when calling formatters (see below), so it doesn't matter what this is. It could be Slack, Discord, Skype, etc.
* formatter: this is an object which contains methods for formatting messages. All formatters are used in a `message.reply` call, with the exception of logger which is used for `console.log`. Unless otherwise noted, the method takes the parameters `(message, command, bot, extra)`
    * nocommand: When a user runs a nonexistent command
    * minargs: When the user has not entered enough args
    * maxargs: When the user entered too many args
    * error: When the command failed, takes an additional property for the error raised (e.g. (msg, cmd, bot, extra error))
    * logger: Formats the message to console.log when a user runs a command, takes an additional property (boolean) for the command's success (e.g. (msg, cmd, bot, extra, success)).
    * permission: When the user is unable to use the command, which can happen if canRun is false
* runCommand: this method is called when all other checks have passed and the handler is ready to run the command. You can override this to perform whatever tasks you would like, including completely ignoring the command if you wanted to for whatever reason.
* commands: an Object containing all the commands.

If you want to override `formatter`, pass an object for the parameter `messageFormatter` in the constructor with whichever formatters you'd like to override. Return false to prevent it from performing an action. If you'd still like to perform the action, just use a different string to do so, return a string as your value.

Example:

```javascript
const myBot = require('./bot');
const commands = new CommandHandler({
    formatter: {
       // Override minargs with a custom message
       minargs: (msg, cmd, bot, extra)=> `You didn't enter enough args!`,
       // Don't console.log the command usage
       logger: ()=> false
   },
   bot: myBot
});
```

#### Methods

##### add

Takes arguments (name, command) and adds it to the commands list

##### register

Takes a Command argument and adds it and all its aliases to the commands list by calling `add`

##### populate

Not yet implemented. This will take all files in a given directory, check if their constructor inherits command, and if so, register it.

##### process

This is how commands are processed. This takes arguments (message, extra, bot), where

* message: the message that triggered the command to be invoked. Required properties listed below.
    * args: an array representing the arguments passed to it.
    * commandName: the command name the user is attempting to invoke, e.g. `help`
    * reply: a method that takes a string argument and replies in some way to the user. This is not a required method if you override the formatter to return false for all (non-logger) events. However, it is incredibly useful inside commands themselves.
* extra: An (optional) object that can contain any extra data you want to pass to your comomands. This could be the existence of other bots, some variables you want to pass, or anything else you'd like the command to have available (since, in practice, your commands should be separated from your main script). This defaults to just {}.
    * Instead of using globals, consider putting helper methods inside the extra.
* bot: An (optional) bot to use instead of the bot you may or may not have provided in the constructor. If this is not provided, the bot will come from `this.bot`, so if none was provided in the constructor, you need to include a bot here.

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
        * The `error` formatter may also be used in the `canRun` call.
    
## Putting It All Together

This example uses the frozor-slackbot api

```javascript
const SlackBot = require('frozor-slackbot');
const {CommandArg, Command, CommandHandler} = require('frozor-commands');

// Get the slack token from env!
const bot = new SlackBot(process.env.SLACK_TOKEN);

// Set the commandHandler in the bot, useful so we don't have to deal with global variables, etc.
bot.commands = new CommandHandler({bot: bot});

class HelloCommand extends Command{
    constructor(){
        super('hello', ['hi', 'hey'], 'Say hi!', CommandArg.getVariableArgs(300, 'text', 'String', false))
    }
    
    async run(message){
        message.reply('Hey there!')
    }
}

class SpeedCommand extends Command{
    constructor(){
        super({
            name: 'speed',
            aliases: ['ping', 'speedtest', 'pingtest'],
            description: 'See how long it takes to process a command!'
        })
    }
    
    async run(message, bot, extra){
        message.reply(`I took \`${Date.now() - extra.startTime}\` ms to process and run that command.`)
    }
}

// Add the commands to the commandHandler
bot.commands.register(new HelloCommand());
bot.commands.register(new SpeedCommand());

// Initialize the bot, which connects it to slack's event system
bot.init();

// When we get a message...
bot.on('message', (msg)=>{
    // Check if it starts with our prefix (!)
    if(msg.startsWith('!')){
        // Get args (this is a naive way, but works for this example)
        msg.args = msg.text.split(' ');
        
        // To run a command, we need to have commandName as a property on the message.
        // We set it by taking the first argument of the message, and removing the first character, which is our prefix (!)
        msg.commandName = msg.args.shift().substr(1);
        
        // Process the command, and set the `extra` to `startTime: Date.now()`
        bot.commands.process(msg, {startTime: Date.now()});
    }
});
```

In this example, we've initialized a SlackBot and given it two commands: 'hello', and 'speed'. 
Each time the bot receives a message, it's checked for the command prefix (in this case a '!'), and if the prefix matches this command prefix, the command is processed. 
If the user provided too many or too few args, the bot will reply with a message letting them know such. If the command runs but hits an error, the bot will also let them know such.

I wouldn't recommend directly copying this if you are writing a bot, because often times you should incorporate more robust logic before running a command. For instance, you should check that the message sender is not the bot.

### LegacyConvert

#### Description

This is a method that allows people using a (very) old version of `frozor-commands` to update to the newest without doing any extra work, though you should really update it, since some stuff like Arguments gets really... weird.

If you ever used `frozor-commands` back when commands were a gigantic object like shown below, you may find this useful. If you have never seen the below, you can safely ignore this method.

```javascript
const commands = {
    hello : {
        description: 'say hi to the bot!',
        args: {
            min: 0,
            max: 1000
        },
        process: (slackBot, commandMessage, extra)=>{
            // ew
        }
    },
    hi: {
        type: 'alias',
        alias: 'hello'
    }
}

module.exports = new CommandUtil(commands);
```

This was not exactly optimal, and the new `frozor-commands` system allows for you to not want to die every time you use it, and for more flexibility.

To convert:

1. Import the `LegacyConvert` property from `frozor-commands` in your command file(s)
2. replace `new CommandUtil(commands)` with `LegacyConvert(commands)`.
3. That's it!

The object returned by LegacyConvert() is an Array of `Command` instances, named `LegacyCommand`. You can safely pass these _directly_ to a `CommandHandler`'s `.register()`.