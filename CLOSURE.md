# Closure Mode

Original fork by @bolinfest <http://bolinfest.com/coffee/features.html> who added Closure Library support.

Forked from @smhanov <https://github.com/smhanov/coffee-script> who removed the need to use the Closure Library.

---

This fork's purpose is to allow developers to **type-check CoffeeScript/Backbone/Underscore projects** with **full backwards compatibility** and **minimal jsdoc annotations**.

This is achevied using Google Closure type-checking jsdoc annotations. [link to it!]

Type information is added through commenting and repurposed syntax.

I use the master branch for CoffeeScript production compilation and use this fork with [jzbuild] for occasional type-checking.

There is no intention to integrate this back into the master branch yet.

## Dev

 * Hack, hack, hack
 * `git checkout lib/*.js && bin/cake build && bin/cake build:parser && ./test-closure.sh`

For interactive testing try: `open closure/demo/index.html`

## Compile

To compile `extras/coffee-script.js` run `MINIFY=false bin/cake build:browser`

(from https://github.com/jashkenas/coffee-script/issues/999)

## Features

### Automatic constructor annotations

`@constructor` and `@extends` annotations automatically added to `class` declarations
 
### Basic type inference

Use `--closure_infer`

Adds inline annotations to optional function parameters based on the type of the default parameter.
 
	class Foo
		constructor: (@bar = '{string=}')

*Generates...*

	/**
	 * @constructor
	 * @param {string=} bar
	 */
	Foo = function(bar) {
		if bar == null {
			bar = '{string=}'
		}
	}

When you really do need a default value use this method:

	# Plain JavaScript function because ~ is wierd in CoffeeScript
	`function ~(val) { if val.startsWith('{') ? return null : return val }`

	class Foo
		constructor: (@bar =~ '{string=}')

## Planned Features

 * Better inline annotations based on identifier not just
 * Allow adding params by annotating the initialize method in Backbone

## Dev Tips

Use `rewriter.coffee` for modifying tokens before they are parsed by the lexer

Modify `grammar.coffee` to accomodate new tokens

Modify `compileNode()` method which actually writes out the code for each node
