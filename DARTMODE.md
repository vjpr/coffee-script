# CoffeeScript - Dart Mode

Compiling CoffeeScript to Google Dart code with full backwards compatability.

This will leverage the work I have done on the [CoffeeScript Closure Mode] (https://github.com/vjpr/coffee-script/blob/master/CLOSURE.md) fork.

Apparently there are plans for a Google Closure to Dart transpiler. This would allow CoffeeScript Closure Mode to be used as it is. Until then, I'm going to give this a crack.

## References

<http://blog.sethladd.com/2012/01/vanilla-dart-ftw.html>
<http://synonym.dartlang.org/>
<http://turbomanage.wordpress.com/2011/12/14/syntax-for-dart/>

## TODO

 * Convert `documentation/js` code examples to `documentation/dart`
 * New flag `--dart`
 * Create test suite to compare `coffee --dart documentation/coffee/*` output with `documentation/dart`.
 * Modify code generation
 * Use Google Closure comments to add type information
 * Create conversion libraries for:
   * Core
   * jQuery
   * Backbone
   * Underscore

## Changes

