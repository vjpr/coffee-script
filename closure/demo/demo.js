goog.provide('demo');

goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.dom.classes');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.string');
goog.require('goog.style');


// Unfortunately, Closure Lite was generated so long ago, that it predates the
// introduction of goog.scope(), which is why it is not used here.
(function() {


var get = goog.dom.getElement;


/**
 * It is pretty sad that this cannot be done in CSS.
 * @param {goog.events.Event} e
 */
demo.onResize = function(e) {
  // Calculate the remaining window area for the textareas.
  var winSize = goog.dom.getViewportSize();
  var container = get('code-container');
  var position = goog.style.getPosition(container);
  // On Chrome, a textarea has 2px of padding and a 1px border, yet the
  // containing block element is still 3px taller than the textarea.
  // Also, the <body> adds 8px of margin.
  // 8 + 1 + 2 + 2 + 1 + 3 = 17.
  var verticalPadding = 17;
  var height = (winSize.height - position.y - verticalPadding) + 'px';
  if (height < 0) return;

  // Set the height of the textareas.
  var textareas = [get('code-coffee').firstChild, get('code-js').firstChild];
  goog.array.forEach(textareas, function(textarea) {
    textarea.style.height = height;  
  });
};


/**
 * Compile the code in the input pane and print it in the output pane.
 */
demo.compile = function() {
  var input = demo.coffeeEditor.getSession().getValue();
  var checkbox = get('enable-google');
  var options = {
    bare: true,
    google: checkbox.checked ? {includes: [], provides: []} : null
  };

  var value = '';
  var error;
  try {
    value = CoffeeScript.compile(input, options);
    demo.jsEditor.getSession().setValue(value);
  } catch (e) {
    error = e;
    get('error').innerHTML = goog.string.htmlEscape(e.message);
  }

  // Update the UI to reflect whether there is an error. 
  var isError = (error != null);
  get('error').style.visibility = isError ? 'visible' : 'hidden';
  // TOOD(bolinfest): Figure out why the text does not turn red.
  goog.dom.classes.enable(get('code-coffee'), 'error', isError);
};


/** @type {ace.Editor} */
demo.coffeeEditor;


/** @type {ace.Editor} */
demo.jsEditor;


demo.createEditors = function() {
  var coffeeEditor = demo.coffeeEditor =
      ace.edit(get('code-coffee').firstChild);
  var jsEditor = demo.jsEditor =
      ace.edit(get('code-js').firstChild);

  coffeeEditor.getSession().setTabSize(2);
  coffeeEditor.getSession().setUseSoftTabs(false);
  coffeeEditor.renderer.setHScrollBarAlwaysVisible(false);
  var CoffeeMode = require("ace/mode/coffee").Mode;
  coffeeEditor.getSession().setMode(new CoffeeMode());

  var JavaScriptMode = require("ace/mode/javascript").Mode;
  jsEditor.getSession().setMode(new JavaScriptMode());
  jsEditor.setReadOnly(true);
  jsEditor.renderer.setHScrollBarAlwaysVisible(false);
};


demo.init = function() {
  // Make sure the editor div takes up space before
  goog.events.listen(
      window,
      goog.events.EventType.RESIZE,
      demo.onResize);
  demo.onResize();

  demo.createEditors();

  var compileAfterCurrentThread = function() { setTimeout(demo.compile, 0); };

  goog.events.listen(
      get('enable-google'),
      goog.events.EventType.CHANGE,
      compileAfterCurrentThread);
 
  demo.coffeeEditor.getSession().on('change', compileAfterCurrentThread);

  demo.compile();
};


demo.init();

})();
