# Changelog

## [5.0.1]
### Fixed
- Fixes to make docs actually work... and export it. Whoops.

## [5.0.0]
### Added
- An API to allow easy documentation generation for commands.
- Command#addInfiniteArgs() which sets the command to be able to have infinite max args
- Command#parse(data) which takes in a message or the args array and parses it with CommandArg#parseCommandArgs

### Changed
- CommandHandler by default now allows commands to be run when the user has typed in more than the normal maximum args. The additional args are sliced off the array.
    - disable this by setting the option enforceArgLimits to false in the call to initialize it, or after initialization by setting it.

## [4.0.12]
### Fixed
- An issue where instanceof could not be called because it was checking an object instead of a constructor.

## [4.0.11]
### Added
- A working version of `CommandHandler.prototype.populate` now exists, so use it! (This was previously erroneously listed under 4.0.4, even though it wasn't actually there)
## Changed
- Use the terminology 'client' in properties/docs instead of 'bot'
- `CommandHandler.prototype.add` and `ComamndHandler.prototype.remove` are now private.
### Fixed
- An issue where `CommandHandler.prototype.remove` calls didn't actually do anything because it was still using `delete`

## [4.0.10]
### Changed
- `subCommandNotProivided` and `subCommandFail` are now methods.

### Fixed
- This changelog skipping 4.0.6, because I can't count apparently.

## [4.0.9]
### Fixed
- Another dumb issue causing an error to be thrown.

## [4.0.8]
### Fixed
- A dumb typo causing `CommandParent` to crash upon calls to `act`.

## [4.0.7] 
### Fixed
- Signature of `CommandParent.prototype.act` is now `Promise act(action, msg, client, extra)` to pass all properties to the child's `run` method. Not bumping minor because this version was out for maybe 2 minutes.

## [4.0.6]
### Changed
- `CommandParent` now uses `CommandParent.prototype.act` to act upon sub-commands, and you should, too, if you're not just using the default handling for it.

## [4.0.5]
### Added
- `CommandParent.prototype.subCommandNotProvided` property to reply to users that do not provide a sub-command... obviously.

###Fixed

- An issue where `CommandParent` would fail if it is a child of another parent, and the user did not provide any args to use as a sub-command.

## [4.0.4] 
### Fixed
- subCommandFail will no longer stringify as an arrow function...

## [4.0.3]
### Fixed
- Fixed `Command` args again... I really should write some tests for this lib.
- Fixed `CommandParent` along with the above

## [4.0.2]
### Fixed

- `args` property now properly converts functions, and will also instantiate constructors.
- `CommandParent` no longer fails when no args are provided, and a default `arg` is also provided.

## [4.0.1]
### Fixed
- I forgot to add a module.exports for CommandParent...

## [4.0.0]
### Added

- This changelog (long overdue since I don't know what I'm doing and keep making changes to this module)
- A fancy new `CommandParent` class! Use this for sub-commands. All you have to do is provide instances of `Command` or `CommandParent` to the constructor in an Array called `children`.
- jsdocs to a bunch of stuff
- `CommandHandler` now has properties for `defaultHelpFormatter` and `defaultHelpFilter`, feel free to use this in conjunction with `CommandHandler.prototype.getHelpStatement`.
- `Command`s now have `examples` and `help` as properties. Both are used in the help statement by default.
- Speaking of the above, `Command` now has a `getHelpStatement()` method. You may want to override this if you're not on discord or slack, since it will look weird. Either way, it'll probably look weird.

### Changed

- Many usages of `let` are now `const` to improve performance slightly.
- `CommandHandler`'s `runCommand` is now static. 
- `CommandHandler`'s `commands` is now a `Collection`, see [the npm page](http://npmjs.com/package/djs-collection) . I don't know if anyone actually uses this module, and if so what their primary use case is, but I will personally have to change a lot of property accessing through square brackets into `.get`.
- `Command`'s constructor allows args to be `CommandArg` instances, strings, or objects. The final `args` property will contain only instances of `CommandArg`, but if the original was an object, the final will have all properties. 
    - For instance, `{ name: 'test', required: true, oranges: 3 }` turns into a `CommandArg` called `test` that is required, and `testArg.oranges === 3`