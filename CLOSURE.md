# Closure Mode

Original fork by @bolinfest <http://bolinfest.com/coffee/features.html> who added Closure Library support.

Forked from @smhanov <https://github.com/smhanov/coffee-script> who removed the need to use the Closure Library.

---

This fork's purpose is to allow developers to **type-check CoffeeScript/Backbone/Underscore projects** with **full backwards compatibility** and **minimal JSDoc annotations**.

Type checking uses the Google Closure Compiler with Advanced Optimizations mode. Type information is added using [Google Closure type-checking JSDoc annotations](https://developers.google.com/closure/compiler/docs/js-for-compiler). *Closure Mode* helps by adding annotations automatically by using CoffeeScript syntax.

I use vanilla CoffeeScript for compiling production/debug code, but use this fork with [jzbuild](https://github.com/vjpr/jzbuild) for occasional type-checking.

There is no intention to integrate this back into the master branch. 

## Usage

### Add a helper function method called `__`

This function allows us to repurpose the *default parameter* CoffeeScript feature to specify type information while not breaking your code when it is compiled with vanilla CoffeeScript.

*Closure Mode* parses the *default parameter* to look for type information. If this fails, this method passes along the default parameter as normal. If there is type information, we return `undefined` unless there is a default parameter specified.

	###* @param {*} a ###
	###* @param {*} [b] ###
	window.__ = (a, b) ->
		return b if b?
		if a.indexOf('{') is 0
		and if a.substr(-1) is '}'
			return undefined
		else
			return a

### Declaring custom types

When you have a custom object like `{foo: 'bar'}` used in a few places you should create an alias for it like so.

	###* @typedef {{ foo: string }} ###
	FooBar;

### Add constructors to Backbone classes

When passing options or other arguments to Backbone you need to provide a constructor.

	class Foo extends Backbone.View
		constructor: (options) ->

### Optional types

You must add type annotations to optional types like this:

	###* @param {*} [name] ###
	foo = (name) ->

*or...*

	###* @param {*=} name ###

*or we pass it to our magic function `__()` that is recognized by *Closure Mode* returns undefined...*

	foo = (name = __('{*=}') ->

*or we infer the type from the value...*

	foo = (name = __('foo'))

### Inline types as default parameters

If a param **does not** have a default value

	foo = (name = '{*=}') ->

otherwise...

	foo = (name = __('{*=}', 'foo'))

### Namespacing

When using something like this at the top of your classes:

	Foo ?= {}
	Foo.Bar ?= {}

Modify it to:

do ->
	Foo ?= {}
	Foo.Bar ?= {}

### Skipping something

If something is continuously giving you warnings/errors use:

	###* @suppress {checkTypes} ###

See [here](http://code.google.com/p/closure-compiler/wiki/Warnings) for different options.

## Features

### Automatic constructor annotations

`@constructor` and `@extends` annotations automatically added to `class` declarations
 
### Basic type inference

Use `--closure_infer`

Adds inline annotations to optional function parameters based on the type of the default parameter.
 
	class Foo
		constructor: (bar = '{string=}')

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

## Possible alternatives for the default parameter function

foo = (name = '{string}'.type()) ->
foo = (name = '{string}'.default('foo')) ->

foo = (name = 'foo'.t('{?string=}')) ->

foo = (name = '{string}'._()) ->
foo = (name = '{string}'._('foo')) ->

foo = (name = string()) ->
foo = (name = 'foo'.string()) ->
foo = (name = (1).number()) ->
foo = (name = 'Foo.Bar'.type()) ->

foo = (name = (__ '{string}')) ->
foo = (name = (__ '{string}', 'foo')) ->

foo = (name = __['{string}']) ->

foo = (name = t('{string}')) ->

foo = name

## Planned Features

 * Better inline annotations based on identifier not just
 * Allow adding params by annotating the initialize method in Backbone

## Dev

 * Hack, hack, hack
 * `git checkout lib/*.js && bin/cake build && bin/cake build:parser && ./test-closure.sh`

For interactive testing try: `open closure/demo/index.html`

## Compile

To compile `extras/coffee-script.js` run `MINIFY=false bin/cake build:browser`

## Dev Tips

Use `rewriter.coffee` for modifying tokens before they are parsed by the lexer

Modify `grammar.coffee` to accomodate new tokens

Modify `compileNode()` method which actually writes out the code for each node
