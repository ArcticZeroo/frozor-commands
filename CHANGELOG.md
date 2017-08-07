# Changelog

## [4.0.7]
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
- A working version of `CommandHandler.prototype.populate` now exists, so use it!
- `Command`s now have `examples` and `help` as properties. Both are used in the help statement by default.
- Speaking of the above, `Command` now has a `getHelpStatement()` method. You may want to override this if you're not on discord or slack, since it will look weird. Either way, it'll probably look weird.

### Changed

- Many usages of `let` are now `const` to improve performance slightly.
- `CommandHandler`'s `runCommand` is now static. 
- `CommandHandler`'s `commands` is now a `Collection`, see [the npm page](http://npmjs.com/package/djs-collection) . I don't know if anyone actually uses this module, and if so what their primary use case is, but I will personally have to change a lot of property accessing through square brackets into `.get`.
- `Command`'s constructor allows args to be `CommandArg` instances, strings, or objects. The final `args` property will contain only instances of `CommandArg`, but if the original was an object, the final will have all properties. 
    - For instance, `{ name: 'test', required: true, oranges: 3 }` turns into a `CommandArg` called `test` that is required, and `testArg.oranges === 3`