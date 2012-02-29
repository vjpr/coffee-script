/**
 * CoffeeScript Compiler v1.1.1
 * http://coffeescript.org
 *
 * Copyright 2011, Jeremy Ashkenas
 * Released under the MIT License
 */
this.CoffeeScript = function() {
  function require(path){ return require[path]; }
  require['./helpers'] = new function() {
  var exports = this;
  (function() {
  var extend, flatten;
  exports.starts = function(string, literal, start) {
    return literal === string.substr(start, literal.length);
  };
  exports.ends = function(string, literal, back) {
    var len;
    len = literal.length;
    return literal === string.substr(string.length - len - (back || 0), len);
  };
  exports.compact = function(array) {
    var item, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = array.length; _i < _len; _i++) {
      item = array[_i];
      if (item) {
        _results.push(item);
      }
    }
    return _results;
  };
  exports.count = function(string, substr) {
    var num, pos;
    num = pos = 0;
    if (!substr.length) {
      return 1 / 0;
    }
    while (pos = 1 + string.indexOf(substr, pos)) {
      num++;
    }
    return num;
  };
  exports.merge = function(options, overrides) {
    return extend(extend({}, options), overrides);
  };
  extend = exports.extend = function(object, properties) {
    var key, val;
    for (key in properties) {
      val = properties[key];
      object[key] = val;
    }
    return object;
  };
  exports.flatten = flatten = function(array) {
    var element, flattened, _i, _len;
    flattened = [];
    for (_i = 0, _len = array.length; _i < _len; _i++) {
      element = array[_i];
      if (element instanceof Array) {
        flattened = flattened.concat(flatten(element));
      } else {
        flattened.push(element);
      }
    }
    return flattened;
  };
  exports.del = function(obj, key) {
    var val;
    val = obj[key];
    delete obj[key];
    return val;
  };
  exports.last = function(array, back) {
    return array[array.length - (back || 0) - 1];
  };
}).call(this);


};require['./rewriter'] = new function() {
  var exports = this;
  (function() {
  var BALANCED_PAIRS, EXPRESSION_CLOSE, EXPRESSION_END, EXPRESSION_START, IMPLICIT_BLOCK, IMPLICIT_CALL, IMPLICIT_END, IMPLICIT_FUNC, IMPLICIT_UNSPACED_CALL, INVERSES, LINEBREAKS, SINGLE_CLOSERS, SINGLE_LINERS, left, rite, _i, _len, _ref;
  var __indexOf = Array.prototype.indexOf || function(item) {
    for (var i = 0, l = this.length; i < l; i++) {
      if (this[i] === item) return i;
    }
    return -1;
  }, __slice = Array.prototype.slice;
  exports.Rewriter = (function() {
    function Rewriter() {}
    Rewriter.prototype.rewrite = function(tokens) {
      this.tokens = tokens;
      this.removeLeadingNewlines();
      this.removeMidExpressionNewlines();
      this.closeOpenCalls();
      this.closeOpenIndexes();
      this.addImplicitIndentation();
      this.tagPostfixConditionals();
      this.addImplicitBraces();
      this.addImplicitParentheses();
      this.ensureBalance(BALANCED_PAIRS);
      this.rewriteClosingParens();
      this.comments();
      return this.tokens;
    };
    Rewriter.prototype.comments = function() {
      var i, t, _len, _ref, _ref2;
      _ref = this.tokens;
      for (i = 0, _len = _ref.length; i < _len; i++) {
        t = _ref[i];
        if (t[0] === 'HERECOMMENT' && ((_ref2 = this.tokens[i + 2]) != null ? _ref2[1] : void 0) === 'constructor') {
          t[0] = 'CTORCOMMENT';
        }
      }
      return true;
    };
    Rewriter.prototype.scanTokens = function(block) {
      var i, token, tokens;
      tokens = this.tokens;
      i = 0;
      while (token = tokens[i]) {
        i += block.call(this, token, i, tokens);
      }
      return true;
    };
    Rewriter.prototype.detectEnd = function(i, condition, action) {
      var levels, token, tokens, _ref, _ref2;
      tokens = this.tokens;
      levels = 0;
      while (token = tokens[i]) {
        if (levels === 0 && condition.call(this, token, i)) {
          return action.call(this, token, i);
        }
        if (!token || levels < 0) {
          return action.call(this, token, i - 1);
        }
        if (_ref = token[0], __indexOf.call(EXPRESSION_START, _ref) >= 0) {
          levels += 1;
        } else if (_ref2 = token[0], __indexOf.call(EXPRESSION_END, _ref2) >= 0) {
          levels -= 1;
        }
        i += 1;
      }
      return i - 1;
    };
    Rewriter.prototype.removeLeadingNewlines = function() {
      var i, tag, _len, _ref;
      _ref = this.tokens;
      for (i = 0, _len = _ref.length; i < _len; i++) {
        tag = _ref[i][0];
        if (tag !== 'TERMINATOR') {
          break;
        }
      }
      if (i) {
        return this.tokens.splice(0, i);
      }
    };
    Rewriter.prototype.removeMidExpressionNewlines = function() {
      return this.scanTokens(function(token, i, tokens) {
        var _ref;
        if (!(token[0] === 'TERMINATOR' && (_ref = this.tag(i + 1), __indexOf.call(EXPRESSION_CLOSE, _ref) >= 0))) {
          return 1;
        }
        tokens.splice(i, 1);
        return 0;
      });
    };
    Rewriter.prototype.closeOpenCalls = function() {
      var action, condition;
      condition = function(token, i) {
        var _ref;
        return ((_ref = token[0]) === ')' || _ref === 'CALL_END') || token[0] === 'OUTDENT' && this.tag(i - 1) === ')';
      };
      action = function(token, i) {
        return this.tokens[token[0] === 'OUTDENT' ? i - 1 : i][0] = 'CALL_END';
      };
      return this.scanTokens(function(token, i) {
        if (token[0] === 'CALL_START') {
          this.detectEnd(i + 1, condition, action);
        }
        return 1;
      });
    };
    Rewriter.prototype.closeOpenIndexes = function() {
      var action, condition;
      condition = function(token, i) {
        var _ref;
        return (_ref = token[0]) === ']' || _ref === 'INDEX_END';
      };
      action = function(token, i) {
        return token[0] = 'INDEX_END';
      };
      return this.scanTokens(function(token, i) {
        if (token[0] === 'INDEX_START') {
          this.detectEnd(i + 1, condition, action);
        }
        return 1;
      });
    };
    Rewriter.prototype.addImplicitBraces = function() {
      var action, condition, stack, start, startIndent;
      stack = [];
      start = null;
      startIndent = 0;
      condition = function(token, i) {
        var one, tag, three, two, _ref, _ref2;
        _ref = this.tokens.slice(i + 1, (i + 3 + 1) || 9e9), one = _ref[0], two = _ref[1], three = _ref[2];
        if ('HERECOMMENT' === (one != null ? one[0] : void 0)) {
          return false;
        }
        tag = token[0];
        return ((tag === 'TERMINATOR' || tag === 'OUTDENT') && !((two != null ? two[0] : void 0) === ':' || (one != null ? one[0] : void 0) === '@' && (three != null ? three[0] : void 0) === ':')) || (tag === ',' && one && ((_ref2 = one[0]) !== 'IDENTIFIER' && _ref2 !== 'NUMBER' && _ref2 !== 'STRING' && _ref2 !== '@' && _ref2 !== 'TERMINATOR' && _ref2 !== 'OUTDENT'));
      };
      action = function(token, i) {
        var tok;
        tok = ['}', '}', token[2]];
        tok.generated = true;
        return this.tokens.splice(i, 0, tok);
      };
      return this.scanTokens(function(token, i, tokens) {
        var ago, idx, tag, tok, value, _ref, _ref2;
        if (_ref = (tag = token[0]), __indexOf.call(EXPRESSION_START, _ref) >= 0) {
          stack.push([(tag === 'INDENT' && this.tag(i - 1) === '{' ? '{' : tag), i]);
          return 1;
        }
        if (__indexOf.call(EXPRESSION_END, tag) >= 0) {
          start = stack.pop();
          return 1;
        }
        if (!(tag === ':' && ((ago = this.tag(i - 2)) === ':' || ((_ref2 = stack[stack.length - 1]) != null ? _ref2[0] : void 0) !== '{'))) {
          return 1;
        }
        stack.push(['{']);
        idx = ago === '@' ? i - 2 : i - 1;
        while (this.tag(idx - 2) === 'HERECOMMENT') {
          idx -= 2;
        }
        value = new String('{');
        value.generated = true;
        tok = ['{', value, token[2]];
        tok.generated = true;
        tokens.splice(idx, 0, tok);
        this.detectEnd(i + 2, condition, action);
        return 2;
      });
    };
    Rewriter.prototype.addImplicitParentheses = function() {
      var action, noCall;
      noCall = false;
      action = function(token, i) {
        var idx;
        idx = token[0] === 'OUTDENT' ? i + 1 : i;
        return this.tokens.splice(idx, 0, ['CALL_END', ')', token[2]]);
      };
      return this.scanTokens(function(token, i, tokens) {
        var callObject, current, next, prev, seenControl, seenSingle, tag, _ref, _ref2, _ref3;
        tag = token[0];
        if (tag === 'CLASS' || tag === 'IF') {
          noCall = true;
        }
        _ref = tokens.slice(i - 1, (i + 1 + 1) || 9e9), prev = _ref[0], current = _ref[1], next = _ref[2];
        callObject = !noCall && tag === 'INDENT' && next && next.generated && next[0] === '{' && prev && (_ref2 = prev[0], __indexOf.call(IMPLICIT_FUNC, _ref2) >= 0);
        seenSingle = false;
        seenControl = false;
        if (__indexOf.call(LINEBREAKS, tag) >= 0) {
          noCall = false;
        }
        if (prev && !prev.spaced && tag === '?') {
          token.call = true;
        }
        if (token.fromThen) {
          return 1;
        }
        if (!(callObject || (prev != null ? prev.spaced : void 0) && (prev.call || (_ref3 = prev[0], __indexOf.call(IMPLICIT_FUNC, _ref3) >= 0)) && (__indexOf.call(IMPLICIT_CALL, tag) >= 0 || !(token.spaced || token.newLine) && __indexOf.call(IMPLICIT_UNSPACED_CALL, tag) >= 0))) {
          return 1;
        }
        tokens.splice(i, 0, ['CALL_START', '(', token[2]]);
        this.detectEnd(i + 1, function(token, i) {
          var post, _ref4;
          tag = token[0];
          if (!seenSingle && token.fromThen) {
            return true;
          }
          if (tag === 'IF' || tag === 'ELSE' || tag === 'CATCH' || tag === '->' || tag === '=>') {
            seenSingle = true;
          }
          if (tag === 'IF' || tag === 'ELSE' || tag === 'SWITCH' || tag === 'TRY') {
            seenControl = true;
          }
          if ((tag === '.' || tag === '?.' || tag === '::') && this.tag(i - 1) === 'OUTDENT') {
            return true;
          }
          return !token.generated && this.tag(i - 1) !== ',' && (__indexOf.call(IMPLICIT_END, tag) >= 0 || (tag === 'INDENT' && !seenControl)) && (tag !== 'INDENT' || (this.tag(i - 2) !== 'CLASS' && (_ref4 = this.tag(i - 1), __indexOf.call(IMPLICIT_BLOCK, _ref4) < 0) && !((post = this.tokens[i + 1]) && post.generated && post[0] === '{')));
        }, action);
        if (prev[0] === '?') {
          prev[0] = 'FUNC_EXIST';
        }
        return 2;
      });
    };
    Rewriter.prototype.addImplicitIndentation = function() {
      return this.scanTokens(function(token, i, tokens) {
        var action, condition, indent, outdent, starter, tag, _ref, _ref2;
        tag = token[0];
        if (tag === 'TERMINATOR' && this.tag(i + 1) === 'THEN') {
          tokens.splice(i, 1);
          return 0;
        }
        if (tag === 'ELSE' && this.tag(i - 1) !== 'OUTDENT') {
          tokens.splice.apply(tokens, [i, 0].concat(__slice.call(this.indentation(token))));
          return 2;
        }
        if (tag === 'CATCH' && ((_ref = this.tag(i + 2)) === 'OUTDENT' || _ref === 'TERMINATOR' || _ref === 'FINALLY')) {
          tokens.splice.apply(tokens, [i + 2, 0].concat(__slice.call(this.indentation(token))));
          return 4;
        }
        if (__indexOf.call(SINGLE_LINERS, tag) >= 0 && this.tag(i + 1) !== 'INDENT' && !(tag === 'ELSE' && this.tag(i + 1) === 'IF')) {
          starter = tag;
          _ref2 = this.indentation(token), indent = _ref2[0], outdent = _ref2[1];
          if (starter === 'THEN') {
            indent.fromThen = true;
          }
          indent.generated = outdent.generated = true;
          tokens.splice(i + 1, 0, indent);
          condition = function(token, i) {
            var _ref3;
            return token[1] !== ';' && (_ref3 = token[0], __indexOf.call(SINGLE_CLOSERS, _ref3) >= 0) && !(token[0] === 'ELSE' && (starter !== 'IF' && starter !== 'THEN'));
          };
          action = function(token, i) {
            return this.tokens.splice((this.tag(i - 1) === ',' ? i - 1 : i), 0, outdent);
          };
          this.detectEnd(i + 2, condition, action);
          if (tag === 'THEN') {
            tokens.splice(i, 1);
          }
          return 1;
        }
        return 1;
      });
    };
    Rewriter.prototype.tagPostfixConditionals = function() {
      var condition;
      condition = function(token, i) {
        var _ref;
        return (_ref = token[0]) === 'TERMINATOR' || _ref === 'INDENT';
      };
      return this.scanTokens(function(token, i) {
        var original;
        if (token[0] !== 'IF') {
          return 1;
        }
        original = token;
        this.detectEnd(i + 1, condition, function(token, i) {
          if (token[0] !== 'INDENT') {
            return original[0] = 'POST_' + original[0];
          }
        });
        return 1;
      });
    };
    Rewriter.prototype.ensureBalance = function(pairs) {
      var close, level, levels, open, openLine, tag, token, _i, _j, _len, _len2, _ref, _ref2;
      levels = {};
      openLine = {};
      _ref = this.tokens;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        token = _ref[_i];
        tag = token[0];
        for (_j = 0, _len2 = pairs.length; _j < _len2; _j++) {
          _ref2 = pairs[_j], open = _ref2[0], close = _ref2[1];
          levels[open] |= 0;
          if (tag === open) {
            if (levels[open]++ === 0) {
              openLine[open] = token[2];
            }
          } else if (tag === close && --levels[open] < 0) {
            throw Error("too many " + token[1] + " on line " + (token[2] + 1));
          }
        }
      }
      for (open in levels) {
        level = levels[open];
        if (level > 0) {
          throw Error("unclosed " + open + " on line " + (openLine[open] + 1));
        }
      }
      return this;
    };
    Rewriter.prototype.rewriteClosingParens = function() {
      var debt, key, stack;
      stack = [];
      debt = {};
      for (key in INVERSES) {
        debt[key] = 0;
      }
      return this.scanTokens(function(token, i, tokens) {
        var inv, match, mtag, oppos, tag, val, _ref;
        if (_ref = (tag = token[0]), __indexOf.call(EXPRESSION_START, _ref) >= 0) {
          stack.push(token);
          return 1;
        }
        if (__indexOf.call(EXPRESSION_END, tag) < 0) {
          return 1;
        }
        if (debt[inv = INVERSES[tag]] > 0) {
          debt[inv] -= 1;
          tokens.splice(i, 1);
          return 0;
        }
        match = stack.pop();
        mtag = match[0];
        oppos = INVERSES[mtag];
        if (tag === oppos) {
          return 1;
        }
        debt[mtag] += 1;
        val = [oppos, mtag === 'INDENT' ? match[1] : oppos];
        if (this.tag(i + 2) === mtag) {
          tokens.splice(i + 3, 0, val);
          stack.push(match);
        } else {
          tokens.splice(i, 0, val);
        }
        return 1;
      });
    };
    Rewriter.prototype.indentation = function(token) {
      return [['INDENT', 2, token[2]], ['OUTDENT', 2, token[2]]];
    };
    Rewriter.prototype.tag = function(i) {
      var _ref;
      return (_ref = this.tokens[i]) != null ? _ref[0] : void 0;
    };
    return Rewriter;
  })();
  BALANCED_PAIRS = [['(', ')'], ['[', ']'], ['{', '}'], ['INDENT', 'OUTDENT'], ['CALL_START', 'CALL_END'], ['PARAM_START', 'PARAM_END'], ['INDEX_START', 'INDEX_END']];
  INVERSES = {};
  EXPRESSION_START = [];
  EXPRESSION_END = [];
  for (_i = 0, _len = BALANCED_PAIRS.length; _i < _len; _i++) {
    _ref = BALANCED_PAIRS[_i], left = _ref[0], rite = _ref[1];
    EXPRESSION_START.push(INVERSES[rite] = left);
    EXPRESSION_END.push(INVERSES[left] = rite);
  }
  EXPRESSION_CLOSE = ['CATCH', 'WHEN', 'ELSE', 'FINALLY'].concat(EXPRESSION_END);
  IMPLICIT_FUNC = ['IDENTIFIER', 'SUPER', ')', 'CALL_END', ']', 'INDEX_END', '@', 'THIS'];
  IMPLICIT_CALL = ['IDENTIFIER', 'NUMBER', 'STRING', 'JS', 'REGEX', 'NEW', 'PARAM_START', 'CLASS', 'IF', 'TRY', 'SWITCH', 'THIS', 'BOOL', 'UNARY', 'SUPER', '@', '->', '=>', '[', '(', '{', '--', '++'];
  IMPLICIT_UNSPACED_CALL = ['+', '-'];
  IMPLICIT_BLOCK = ['->', '=>', '{', '[', ','];
  IMPLICIT_END = ['POST_IF', 'FOR', 'WHILE', 'UNTIL', 'WHEN', 'BY', 'LOOP', 'TERMINATOR'];
  SINGLE_LINERS = ['ELSE', '->', '=>', 'TRY', 'FINALLY', 'THEN'];
  SINGLE_CLOSERS = ['TERMINATOR', 'CATCH', 'FINALLY', 'ELSE', 'OUTDENT', 'LEADING_WHEN'];
  LINEBREAKS = ['TERMINATOR', 'INDENT', 'OUTDENT'];
}).call(this);


};require['./lexer'] = new function() {
  var exports = this;
  (function() {
  var ASSIGNED, BOOL, CALLABLE, CODE, COFFEE_ALIASES, COFFEE_ALIAS_MAP, COFFEE_KEYWORDS, COMMENT, COMPARE, COMPOUND_ASSIGN, HEREDOC, HEREDOC_ILLEGAL, HEREDOC_INDENT, HEREGEX, HEREGEX_OMIT, IDENTIFIER, INDEXABLE, JSTOKEN, JS_FORBIDDEN, JS_KEYWORDS, LINE_BREAK, LINE_CONTINUER, LOGIC, Lexer, MATH, MULTILINER, MULTI_DENT, NOT_REGEX, NOT_SPACED_REGEX, NO_NEWLINE, NUMBER, OPERATOR, REGEX, RELATION, RESERVED, Rewriter, SHIFT, SIMPLESTR, TRAILING_SPACES, UNARY, WHITESPACE, compact, count, key, last, starts, _ref;
  var __indexOf = Array.prototype.indexOf || function(item) {
    for (var i = 0, l = this.length; i < l; i++) {
      if (this[i] === item) return i;
    }
    return -1;
  };
  Rewriter = require('./rewriter').Rewriter;
  _ref = require('./helpers'), count = _ref.count, starts = _ref.starts, compact = _ref.compact, last = _ref.last;
  exports.Lexer = Lexer = (function() {
    function Lexer() {}
    Lexer.prototype.tokenize = function(code, opts) {
      var i;
      if (opts == null) {
        opts = {};
      }
      if (WHITESPACE.test(code)) {
        code = "\n" + code;
      }
      code = code.replace(/\r/g, '').replace(TRAILING_SPACES, '');
      this.code = code;
      this.line = opts.line || 0;
      this.indent = 0;
      this.indebt = 0;
      this.outdebt = 0;
      this.indents = [];
      this.tokens = [];
      i = 0;
      while (this.chunk = code.slice(i)) {
        i += this.identifierToken() || this.commentToken() || this.whitespaceToken() || this.lineToken() || this.heredocToken() || this.stringToken() || this.numberToken() || this.regexToken() || this.jsToken() || this.literalToken();
      }
      this.closeIndentation();
      if (opts.rewrite === false) {
        return this.tokens;
      }
      return (new Rewriter).rewrite(this.tokens);
    };
    Lexer.prototype.identifierToken = function() {
      var colon, forcedIdentifier, id, input, match, prev, tag, _ref2, _ref3;
      if (!(match = IDENTIFIER.exec(this.chunk))) {
        return 0;
      }
      input = match[0], id = match[1], colon = match[2];
      if (id === 'own' && this.tag() === 'FOR') {
        this.token('OWN', id);
        return id.length;
      }
      forcedIdentifier = colon || (prev = last(this.tokens)) && (((_ref2 = prev[0]) === '.' || _ref2 === '?.' || _ref2 === '::') || !prev.spaced && prev[0] === '@');
      tag = 'IDENTIFIER';
      if (!forcedIdentifier && (__indexOf.call(JS_KEYWORDS, id) >= 0 || __indexOf.call(COFFEE_KEYWORDS, id) >= 0)) {
        tag = id.toUpperCase();
        if (tag === 'WHEN' && (_ref3 = this.tag(), __indexOf.call(LINE_BREAK, _ref3) >= 0)) {
          tag = 'LEADING_WHEN';
        } else if (tag === 'FOR') {
          this.seenFor = true;
        } else if (tag === 'UNLESS') {
          tag = 'IF';
        } else if (__indexOf.call(UNARY, tag) >= 0) {
          tag = 'UNARY';
        } else if (__indexOf.call(RELATION, tag) >= 0) {
          if (tag !== 'INSTANCEOF' && this.seenFor) {
            tag = 'FOR' + tag;
            this.seenFor = false;
          } else {
            tag = 'RELATION';
            if (this.value() === '!') {
              this.tokens.pop();
              id = '!' + id;
            }
          }
        }
      }
      if (__indexOf.call(JS_FORBIDDEN, id) >= 0) {
        if (forcedIdentifier) {
          tag = 'IDENTIFIER';
          id = new String(id);
          id.reserved = true;
        } else if (__indexOf.call(RESERVED, id) >= 0) {
          this.identifierError(id);
        }
      }
      if (!forcedIdentifier) {
        if (__indexOf.call(COFFEE_ALIASES, id) >= 0) {
          id = COFFEE_ALIAS_MAP[id];
        }
        tag = (function() {
          switch (id) {
            case '!':
              return 'UNARY';
            case '==':
            case '!=':
              return 'COMPARE';
            case '&&':
            case '||':
              return 'LOGIC';
            case 'true':
            case 'false':
            case 'null':
            case 'undefined':
              return 'BOOL';
            case 'break':
            case 'continue':
            case 'debugger':
              return 'STATEMENT';
            default:
              return tag;
          }
        })();
      }
      this.token(tag, id);
      if (colon) {
        this.token(':', ':');
      }
      return input.length;
    };
    Lexer.prototype.numberToken = function() {
      var match, number;
      if (!(match = NUMBER.exec(this.chunk))) {
        return 0;
      }
      number = match[0];
      this.token('NUMBER', number);
      return number.length;
    };
    Lexer.prototype.stringToken = function() {
      var match, string;
      switch (this.chunk.charAt(0)) {
        case "'":
          if (!(match = SIMPLESTR.exec(this.chunk))) {
            return 0;
          }
          this.token('STRING', (string = match[0]).replace(MULTILINER, '\\\n'));
          break;
        case '"':
          if (!(string = this.balancedString(this.chunk, '"'))) {
            return 0;
          }
          if (0 < string.indexOf('#{', 1)) {
            this.interpolateString(string.slice(1, -1));
          } else {
            this.token('STRING', this.escapeLines(string));
          }
          break;
        default:
          return 0;
      }
      this.line += count(string, '\n');
      return string.length;
    };
    Lexer.prototype.heredocToken = function() {
      var doc, heredoc, match, quote;
      if (!(match = HEREDOC.exec(this.chunk))) {
        return 0;
      }
      heredoc = match[0];
      quote = heredoc.charAt(0);
      doc = this.sanitizeHeredoc(match[2], {
        quote: quote,
        indent: null
      });
      if (quote === '"' && 0 <= doc.indexOf('#{')) {
        this.interpolateString(doc, {
          heredoc: true
        });
      } else {
        this.token('STRING', this.makeString(doc, quote, true));
      }
      this.line += count(heredoc, '\n');
      return heredoc.length;
    };
    Lexer.prototype.commentToken = function() {
      var comment, here, match;
      if (!(match = this.chunk.match(COMMENT))) {
        return 0;
      }
      comment = match[0], here = match[1];
      if (here) {
        this.token('HERECOMMENT', this.sanitizeHeredoc(here, {
          herecomment: true,
          indent: Array(this.indent + 1).join(' ')
        }));
        this.token('TERMINATOR', '\n');
      }
      this.line += count(comment, '\n');
      return comment.length;
    };
    Lexer.prototype.jsToken = function() {
      var match, script;
      if (!(this.chunk.charAt(0) === '`' && (match = JSTOKEN.exec(this.chunk)))) {
        return 0;
      }
      this.token('JS', (script = match[0]).slice(1, -1));
      return script.length;
    };
    Lexer.prototype.regexToken = function() {
      var length, match, prev, regex, _ref2;
      if (this.chunk.charAt(0) !== '/') {
        return 0;
      }
      if (match = HEREGEX.exec(this.chunk)) {
        length = this.heregexToken(match);
        this.line += count(match[0], '\n');
        return length;
      }
      prev = last(this.tokens);
      if (prev && (_ref2 = prev[0], __indexOf.call((prev.spaced ? NOT_REGEX : NOT_SPACED_REGEX), _ref2) >= 0)) {
        return 0;
      }
      if (!(match = REGEX.exec(this.chunk))) {
        return 0;
      }
      regex = match[0];
      this.token('REGEX', regex === '//' ? '/(?:)/' : regex);
      return regex.length;
    };
    Lexer.prototype.heregexToken = function(match) {
      var body, flags, heregex, re, tag, tokens, value, _i, _len, _ref2, _ref3, _ref4, _ref5;
      heregex = match[0], body = match[1], flags = match[2];
      if (0 > body.indexOf('#{')) {
        re = body.replace(HEREGEX_OMIT, '').replace(/\//g, '\\/');
        this.token('REGEX', "/" + (re || '(?:)') + "/" + flags);
        return heregex.length;
      }
      this.token('IDENTIFIER', 'RegExp');
      this.tokens.push(['CALL_START', '(']);
      tokens = [];
      _ref2 = this.interpolateString(body, {
        regex: true
      });
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        _ref3 = _ref2[_i], tag = _ref3[0], value = _ref3[1];
        if (tag === 'TOKENS') {
          tokens.push.apply(tokens, value);
        } else {
          if (!(value = value.replace(HEREGEX_OMIT, ''))) {
            continue;
          }
          value = value.replace(/\\/g, '\\\\');
          tokens.push(['STRING', this.makeString(value, '"', true)]);
        }
        tokens.push(['+', '+']);
      }
      tokens.pop();
      if (((_ref4 = tokens[0]) != null ? _ref4[0] : void 0) !== 'STRING') {
        this.tokens.push(['STRING', '""'], ['+', '+']);
      }
      (_ref5 = this.tokens).push.apply(_ref5, tokens);
      if (flags) {
        this.tokens.push([',', ','], ['STRING', '"' + flags + '"']);
      }
      this.token(')', ')');
      return heregex.length;
    };
    Lexer.prototype.lineToken = function() {
      var diff, indent, match, noNewlines, prev, size;
      if (!(match = MULTI_DENT.exec(this.chunk))) {
        return 0;
      }
      indent = match[0];
      this.line += count(indent, '\n');
      prev = last(this.tokens, 1);
      size = indent.length - 1 - indent.lastIndexOf('\n');
      noNewlines = this.unfinished();
      if (size - this.indebt === this.indent) {
        if (noNewlines) {
          this.suppressNewlines();
        } else {
          this.newlineToken();
        }
        return indent.length;
      }
      if (size > this.indent) {
        if (noNewlines) {
          this.indebt = size - this.indent;
          this.suppressNewlines();
          return indent.length;
        }
        diff = size - this.indent + this.outdebt;
        this.token('INDENT', diff);
        this.indents.push(diff);
        this.outdebt = this.indebt = 0;
      } else {
        this.indebt = 0;
        this.outdentToken(this.indent - size, noNewlines);
      }
      this.indent = size;
      return indent.length;
    };
    Lexer.prototype.outdentToken = function(moveOut, noNewlines, close) {
      var dent, len;
      while (moveOut > 0) {
        len = this.indents.length - 1;
        if (this.indents[len] === void 0) {
          moveOut = 0;
        } else if (this.indents[len] === this.outdebt) {
          moveOut -= this.outdebt;
          this.outdebt = 0;
        } else if (this.indents[len] < this.outdebt) {
          this.outdebt -= this.indents[len];
          moveOut -= this.indents[len];
        } else {
          dent = this.indents.pop() - this.outdebt;
          moveOut -= dent;
          this.outdebt = 0;
          this.token('OUTDENT', dent);
        }
      }
      if (dent) {
        this.outdebt -= moveOut;
      }
      if (!(this.tag() === 'TERMINATOR' || noNewlines)) {
        this.token('TERMINATOR', '\n');
      }
      return this;
    };
    Lexer.prototype.whitespaceToken = function() {
      var match, nline, prev;
      if (!((match = WHITESPACE.exec(this.chunk)) || (nline = this.chunk.charAt(0) === '\n'))) {
        return 0;
      }
      prev = last(this.tokens);
      if (prev) {
        prev[match ? 'spaced' : 'newLine'] = true;
      }
      if (match) {
        return match[0].length;
      } else {
        return 0;
      }
    };
    Lexer.prototype.newlineToken = function() {
      if (this.tag() !== 'TERMINATOR') {
        this.token('TERMINATOR', '\n');
      }
      return this;
    };
    Lexer.prototype.suppressNewlines = function() {
      if (this.value() === '\\') {
        this.tokens.pop();
      }
      return this;
    };
    Lexer.prototype.literalToken = function() {
      var match, prev, tag, value, _ref2, _ref3, _ref4, _ref5;
      if (match = OPERATOR.exec(this.chunk)) {
        value = match[0];
        if (CODE.test(value)) {
          this.tagParameters();
        }
      } else {
        value = this.chunk.charAt(0);
      }
      tag = value;
      prev = last(this.tokens);
      if (value === '=' && prev) {
        if (!prev[1].reserved && (_ref2 = prev[1], __indexOf.call(JS_FORBIDDEN, _ref2) >= 0)) {
          this.assignmentError();
        }
        if ((_ref3 = prev[1]) === '||' || _ref3 === '&&') {
          prev[0] = 'COMPOUND_ASSIGN';
          prev[1] += '=';
          return value.length;
        }
      }
      if (value === ';') {
        tag = 'TERMINATOR';
      } else if (__indexOf.call(MATH, value) >= 0) {
        tag = 'MATH';
      } else if (__indexOf.call(COMPARE, value) >= 0) {
        tag = 'COMPARE';
      } else if (__indexOf.call(COMPOUND_ASSIGN, value) >= 0) {
        tag = 'COMPOUND_ASSIGN';
      } else if (__indexOf.call(UNARY, value) >= 0) {
        tag = 'UNARY';
      } else if (__indexOf.call(SHIFT, value) >= 0) {
        tag = 'SHIFT';
      } else if (__indexOf.call(LOGIC, value) >= 0 || value === '?' && (prev != null ? prev.spaced : void 0)) {
        tag = 'LOGIC';
      } else if (prev && !prev.spaced) {
        if (value === '(' && (_ref4 = prev[0], __indexOf.call(CALLABLE, _ref4) >= 0)) {
          if (prev[0] === '?') {
            prev[0] = 'FUNC_EXIST';
          }
          tag = 'CALL_START';
        } else if (value === '[' && (_ref5 = prev[0], __indexOf.call(INDEXABLE, _ref5) >= 0)) {
          tag = 'INDEX_START';
          switch (prev[0]) {
            case '?':
              prev[0] = 'INDEX_SOAK';
              break;
            case '::':
              prev[0] = 'INDEX_PROTO';
          }
        }
      }
      this.token(tag, value);
      return value.length;
    };
    Lexer.prototype.sanitizeHeredoc = function(doc, options) {
      var attempt, herecomment, indent, match, _ref2;
      indent = options.indent, herecomment = options.herecomment;
      if (herecomment) {
        if (HEREDOC_ILLEGAL.test(doc)) {
          throw new Error("block comment cannot contain \"*/\", starting on line " + (this.line + 1));
        }
        if (doc.indexOf('\n') <= 0) {
          return doc;
        }
      } else {
        while (match = HEREDOC_INDENT.exec(doc)) {
          attempt = match[1];
          if (indent === null || (0 < (_ref2 = attempt.length) && _ref2 < indent.length)) {
            indent = attempt;
          }
        }
      }
      if (indent) {
        doc = doc.replace(RegExp("\\n" + indent, "g"), '\n');
      }
      if (!herecomment) {
        doc = doc.replace(/^\n/, '');
      }
      return doc;
    };
    Lexer.prototype.tagParameters = function() {
      var i, stack, tok, tokens;
      if (this.tag() !== ')') {
        return this;
      }
      stack = [];
      tokens = this.tokens;
      i = tokens.length;
      tokens[--i][0] = 'PARAM_END';
      while (tok = tokens[--i]) {
        switch (tok[0]) {
          case ')':
            stack.push(tok);
            break;
          case '(':
          case 'CALL_START':
            if (stack.length) {
              stack.pop();
            } else if (tok[0] === '(') {
              tok[0] = 'PARAM_START';
              return this;
            } else {
              return this;
            }
        }
      }
      return this;
    };
    Lexer.prototype.closeIndentation = function() {
      return this.outdentToken(this.indent);
    };
    Lexer.prototype.identifierError = function(word) {
      throw SyntaxError("Reserved word \"" + word + "\" on line " + (this.line + 1));
    };
    Lexer.prototype.assignmentError = function() {
      throw SyntaxError("Reserved word \"" + (this.value()) + "\" on line " + (this.line + 1) + " can't be assigned");
    };
    Lexer.prototype.balancedString = function(str, end) {
      var i, letter, match, prev, stack, _ref2;
      stack = [end];
      for (i = 1, _ref2 = str.length; 1 <= _ref2 ? i < _ref2 : i > _ref2; 1 <= _ref2 ? i++ : i--) {
        switch (letter = str.charAt(i)) {
          case '\\':
            i++;
            continue;
          case end:
            stack.pop();
            if (!stack.length) {
              return str.slice(0, i + 1);
            }
            end = stack[stack.length - 1];
            continue;
        }
        if (end === '}' && (letter === '"' || letter === "'")) {
          stack.push(end = letter);
        } else if (end === '}' && letter === '/' && (match = HEREGEX.exec(str.slice(i)) || REGEX.exec(str.slice(i)))) {
          i += match[0].length - 1;
        } else if (end === '}' && letter === '{') {
          stack.push(end = '}');
        } else if (end === '"' && prev === '#' && letter === '{') {
          stack.push(end = '}');
        }
        prev = letter;
      }
      throw new Error("missing " + (stack.pop()) + ", starting on line " + (this.line + 1));
    };
    Lexer.prototype.interpolateString = function(str, options) {
      var expr, heredoc, i, inner, interpolated, len, letter, nested, pi, regex, tag, tokens, value, _len, _ref2, _ref3, _ref4;
      if (options == null) {
        options = {};
      }
      heredoc = options.heredoc, regex = options.regex;
      tokens = [];
      pi = 0;
      i = -1;
      while (letter = str.charAt(i += 1)) {
        if (letter === '\\') {
          i += 1;
          continue;
        }
        if (!(letter === '#' && str.charAt(i + 1) === '{' && (expr = this.balancedString(str.slice(i + 1), '}')))) {
          continue;
        }
        if (pi < i) {
          tokens.push(['NEOSTRING', str.slice(pi, i)]);
        }
        inner = expr.slice(1, -1);
        if (inner.length) {
          nested = new Lexer().tokenize(inner, {
            line: this.line,
            rewrite: false
          });
          nested.pop();
          if (((_ref2 = nested[0]) != null ? _ref2[0] : void 0) === 'TERMINATOR') {
            nested.shift();
          }
          if (len = nested.length) {
            if (len > 1) {
              nested.unshift(['(', '(']);
              nested.push([')', ')']);
            }
            tokens.push(['TOKENS', nested]);
          }
        }
        i += expr.length;
        pi = i + 1;
      }
      if ((i > pi && pi < str.length)) {
        tokens.push(['NEOSTRING', str.slice(pi)]);
      }
      if (regex) {
        return tokens;
      }
      if (!tokens.length) {
        return this.token('STRING', '""');
      }
      if (tokens[0][0] !== 'NEOSTRING') {
        tokens.unshift(['', '']);
      }
      if (interpolated = tokens.length > 1) {
        this.token('(', '(');
      }
      for (i = 0, _len = tokens.length; i < _len; i++) {
        _ref3 = tokens[i], tag = _ref3[0], value = _ref3[1];
        if (i) {
          this.token('+', '+');
        }
        if (tag === 'TOKENS') {
          (_ref4 = this.tokens).push.apply(_ref4, value);
        } else {
          this.token('STRING', this.makeString(value, '"', heredoc));
        }
      }
      if (interpolated) {
        this.token(')', ')');
      }
      return tokens;
    };
    Lexer.prototype.token = function(tag, value) {
      return this.tokens.push([tag, value, this.line]);
    };
    Lexer.prototype.tag = function(index, tag) {
      var tok;
      return (tok = last(this.tokens, index)) && (tag ? tok[0] = tag : tok[0]);
    };
    Lexer.prototype.value = function(index, val) {
      var tok;
      return (tok = last(this.tokens, index)) && (val ? tok[1] = val : tok[1]);
    };
    Lexer.prototype.unfinished = function() {
      var prev, value;
      return LINE_CONTINUER.test(this.chunk) || (prev = last(this.tokens, 1)) && prev[0] !== '.' && (value = this.value()) && !value.reserved && NO_NEWLINE.test(value) && !CODE.test(value) && !ASSIGNED.test(this.chunk);
    };
    Lexer.prototype.escapeLines = function(str, heredoc) {
      return str.replace(MULTILINER, heredoc ? '\\n' : '');
    };
    Lexer.prototype.makeString = function(body, quote, heredoc) {
      if (!body) {
        return quote + quote;
      }
      body = body.replace(/\\([\s\S])/g, function(match, contents) {
        if (contents === '\n' || contents === quote) {
          return contents;
        } else {
          return match;
        }
      });
      body = body.replace(RegExp("" + quote, "g"), '\\$&');
      return quote + this.escapeLines(body, heredoc) + quote;
    };
    return Lexer;
  })();
  JS_KEYWORDS = ['true', 'false', 'null', 'this', 'new', 'delete', 'typeof', 'in', 'instanceof', 'return', 'throw', 'break', 'continue', 'debugger', 'if', 'else', 'switch', 'for', 'while', 'do', 'try', 'catch', 'finally', 'class', 'extends', 'super'];
  COFFEE_KEYWORDS = ['undefined', 'then', 'unless', 'until', 'loop', 'of', 'by', 'when', 'include', 'as'];
  COFFEE_ALIAS_MAP = {
    and: '&&',
    or: '||',
    is: '==',
    isnt: '!=',
    not: '!',
    yes: 'true',
    no: 'false',
    on: 'true',
    off: 'false'
  };
  COFFEE_ALIASES = (function() {
    var _results;
    _results = [];
    for (key in COFFEE_ALIAS_MAP) {
      _results.push(key);
    }
    return _results;
  })();
  COFFEE_KEYWORDS = COFFEE_KEYWORDS.concat(COFFEE_ALIASES);
  RESERVED = ['case', 'default', 'function', 'var', 'void', 'with', 'const', 'let', 'enum', 'export', 'import', 'native', '__hasProp', '__extends', '__slice', '__bind', '__indexOf'];
  JS_FORBIDDEN = JS_KEYWORDS.concat(RESERVED);
  exports.RESERVED = RESERVED.concat(JS_KEYWORDS).concat(COFFEE_KEYWORDS);
  IDENTIFIER = /^([$A-Za-z_\x7f-\uffff][$\w\x7f-\uffff]*)([^\n\S]*:(?!:))?/;
  NUMBER = /^0x[\da-f]+|^\d*\.?\d+(?:e[+-]?\d+)?/i;
  HEREDOC = /^("""|''')([\s\S]*?)(?:\n[^\n\S]*)?\1/;
  OPERATOR = /^(?:[-=]>|[-+*\/%<>&|^!?=]=|>>>=?|([-+:])\1|([&|<>])\2=?|\?\.|\.{2,3})/;
  WHITESPACE = /^[^\n\S]+/;
  COMMENT = /^###([^#][\s\S]*?)(?:###[^\n\S]*|(?:###)?$)|^(?:\s*#(?!##[^#]).*)+/;
  CODE = /^[-=]>/;
  MULTI_DENT = /^(?:\n[^\n\S]*)+/;
  SIMPLESTR = /^'[^\\']*(?:\\.[^\\']*)*'/;
  JSTOKEN = /^`[^\\`]*(?:\\.[^\\`]*)*`/;
  REGEX = /^\/(?![\s=])[^[\/\n\\]*(?:(?:\\[\s\S]|\[[^\]\n\\]*(?:\\[\s\S][^\]\n\\]*)*])[^[\/\n\\]*)*\/[imgy]{0,4}(?!\w)/;
  HEREGEX = /^\/{3}([\s\S]+?)\/{3}([imgy]{0,4})(?!\w)/;
  HEREGEX_OMIT = /\s+(?:#.*)?/g;
  MULTILINER = /\n/g;
  HEREDOC_INDENT = /\n+([^\n\S]*)/g;
  HEREDOC_ILLEGAL = /\*\//;
  ASSIGNED = /^\s*@?([$A-Za-z_][$\w\x7f-\uffff]*|['"].*['"])[^\n\S]*?[:=][^:=>]/;
  LINE_CONTINUER = /^\s*(?:,|\??\.(?![.\d])|::)/;
  TRAILING_SPACES = /\s+$/;
  NO_NEWLINE = /^(?:[-+*&|\/%=<>!.\\][<>=&|]*|and|or|is(?:nt)?|n(?:ot|ew)|delete|typeof|instanceof)$/;
  COMPOUND_ASSIGN = ['-=', '+=', '/=', '*=', '%=', '||=', '&&=', '?=', '<<=', '>>=', '>>>=', '&=', '^=', '|='];
  UNARY = ['!', '~', 'NEW', 'TYPEOF', 'DELETE', 'DO'];
  LOGIC = ['&&', '||', '&', '|', '^'];
  SHIFT = ['<<', '>>', '>>>'];
  COMPARE = ['==', '!=', '<', '>', '<=', '>='];
  MATH = ['*', '/', '%'];
  RELATION = ['IN', 'OF', 'INSTANCEOF'];
  BOOL = ['TRUE', 'FALSE', 'NULL', 'UNDEFINED'];
  NOT_REGEX = ['NUMBER', 'REGEX', 'BOOL', '++', '--', ']'];
  NOT_SPACED_REGEX = NOT_REGEX.concat(')', '}', 'THIS', 'IDENTIFIER', 'STRING');
  CALLABLE = ['IDENTIFIER', 'STRING', 'REGEX', ')', ']', '}', '?', '::', '@', 'THIS', 'SUPER'];
  INDEXABLE = CALLABLE.concat('NUMBER', 'BOOL');
  LINE_BREAK = ['INDENT', 'OUTDENT', 'TERMINATOR'];
}).call(this);


};require['./parser'] = new function() {
  var exports = this;
  /* Jison generated parser */
var parser = (function(){
var parser = {trace: function trace() { },
yy: {},
symbols_: {"error":2,"Root":3,"Body":4,"Block":5,"TERMINATOR":6,"Line":7,"Expression":8,"Statement":9,"Return":10,"Throw":11,"Comment":12,"STATEMENT":13,"Value":14,"Invocation":15,"Code":16,"Operation":17,"Assign":18,"If":19,"Try":20,"Include":21,"While":22,"For":23,"Switch":24,"Class":25,"INDENT":26,"OUTDENT":27,"Identifier":28,"IDENTIFIER":29,"AlphaNumeric":30,"NUMBER":31,"STRING":32,"Literal":33,"JS":34,"REGEX":35,"BOOL":36,"Assignable":37,"=":38,"AssignObj":39,"ObjAssignable":40,":":41,"ThisProperty":42,"RETURN":43,"HERECOMMENT":44,"CTORCOMMENT":45,"PARAM_START":46,"ParamList":47,"PARAM_END":48,"FuncGlyph":49,"->":50,"=>":51,"OptComma":52,",":53,"Param":54,"ParamVar":55,"...":56,"Array":57,"Object":58,"Splat":59,"SimpleAssignable":60,"Accessor":61,"Parenthetical":62,"Range":63,"This":64,".":65,"?.":66,"::":67,"Index":68,"INDEX_START":69,"IndexValue":70,"INDEX_END":71,"INDEX_SOAK":72,"INDEX_PROTO":73,"Slice":74,"{":75,"AssignList":76,"}":77,"CLASS":78,"EXTENDS":79,"OptFuncExist":80,"Arguments":81,"SUPER":82,"FUNC_EXIST":83,"CALL_START":84,"CALL_END":85,"ArgList":86,"THIS":87,"@":88,"[":89,"]":90,"RangeDots":91,"..":92,"Arg":93,"SimpleArgs":94,"TRY":95,"Catch":96,"FINALLY":97,"CATCH":98,"THROW":99,"INCLUDE":100,"Namespace":101,"AS":102,"(":103,")":104,"WhileSource":105,"WHILE":106,"WHEN":107,"UNTIL":108,"Loop":109,"LOOP":110,"ForBody":111,"FOR":112,"ForStart":113,"ForSource":114,"ForVariables":115,"OWN":116,"ForValue":117,"FORIN":118,"FOROF":119,"BY":120,"SWITCH":121,"Whens":122,"ELSE":123,"When":124,"LEADING_WHEN":125,"IfBlock":126,"IF":127,"POST_IF":128,"UNARY":129,"-":130,"+":131,"--":132,"++":133,"?":134,"MATH":135,"SHIFT":136,"COMPARE":137,"LOGIC":138,"RELATION":139,"COMPOUND_ASSIGN":140,"$accept":0,"$end":1},
terminals_: {2:"error",6:"TERMINATOR",13:"STATEMENT",26:"INDENT",27:"OUTDENT",29:"IDENTIFIER",31:"NUMBER",32:"STRING",34:"JS",35:"REGEX",36:"BOOL",38:"=",41:":",43:"RETURN",44:"HERECOMMENT",45:"CTORCOMMENT",46:"PARAM_START",48:"PARAM_END",50:"->",51:"=>",53:",",56:"...",65:".",66:"?.",67:"::",69:"INDEX_START",71:"INDEX_END",72:"INDEX_SOAK",73:"INDEX_PROTO",75:"{",77:"}",78:"CLASS",79:"EXTENDS",82:"SUPER",83:"FUNC_EXIST",84:"CALL_START",85:"CALL_END",87:"THIS",88:"@",89:"[",90:"]",92:"..",95:"TRY",97:"FINALLY",98:"CATCH",99:"THROW",100:"INCLUDE",102:"AS",103:"(",104:")",106:"WHILE",107:"WHEN",108:"UNTIL",110:"LOOP",112:"FOR",116:"OWN",118:"FORIN",119:"FOROF",120:"BY",121:"SWITCH",123:"ELSE",125:"LEADING_WHEN",127:"IF",128:"POST_IF",129:"UNARY",130:"-",131:"+",132:"--",133:"++",134:"?",135:"MATH",136:"SHIFT",137:"COMPARE",138:"LOGIC",139:"RELATION",140:"COMPOUND_ASSIGN"},
productions_: [0,[3,0],[3,1],[3,2],[4,1],[4,3],[4,2],[7,1],[7,1],[9,1],[9,1],[9,1],[9,1],[8,1],[8,1],[8,1],[8,1],[8,1],[8,1],[8,1],[8,1],[8,1],[8,1],[8,1],[8,1],[5,2],[5,3],[28,1],[30,1],[30,1],[33,1],[33,1],[33,1],[33,1],[18,3],[18,5],[39,1],[39,3],[39,5],[39,1],[40,1],[40,1],[40,1],[10,2],[10,1],[12,1],[12,1],[16,5],[16,2],[49,1],[49,1],[52,0],[52,1],[47,0],[47,1],[47,3],[54,1],[54,2],[54,3],[55,1],[55,1],[55,1],[55,1],[59,2],[60,1],[60,2],[60,2],[60,1],[37,1],[37,1],[37,1],[14,1],[14,1],[14,1],[14,1],[14,1],[61,2],[61,2],[61,2],[61,1],[61,1],[68,3],[68,2],[68,2],[70,1],[70,1],[58,4],[76,0],[76,1],[76,3],[76,4],[76,6],[25,1],[25,2],[25,3],[25,4],[25,2],[25,3],[25,4],[25,5],[15,3],[15,3],[15,1],[15,2],[80,0],[80,1],[81,2],[81,4],[64,1],[64,1],[42,2],[57,2],[57,4],[91,1],[91,1],[63,5],[74,3],[74,2],[74,2],[86,1],[86,3],[86,4],[86,4],[86,6],[93,1],[93,1],[94,1],[94,3],[20,2],[20,3],[20,4],[20,5],[96,3],[11,2],[21,2],[21,4],[101,1],[101,3],[62,3],[62,5],[105,2],[105,4],[105,2],[105,4],[22,2],[22,2],[22,2],[22,1],[109,2],[109,2],[23,2],[23,2],[23,2],[111,2],[111,2],[113,2],[113,3],[117,1],[117,1],[117,1],[115,1],[115,3],[114,2],[114,2],[114,4],[114,4],[114,4],[114,6],[114,6],[24,5],[24,7],[24,4],[24,6],[122,1],[122,2],[124,3],[124,4],[126,3],[126,5],[19,1],[19,3],[19,3],[19,3],[17,2],[17,2],[17,2],[17,2],[17,2],[17,2],[17,2],[17,2],[17,3],[17,3],[17,3],[17,3],[17,3],[17,3],[17,3],[17,3],[17,5],[17,3]],
performAction: function anonymous(yytext,yyleng,yylineno,yy,yystate,$$,_$) {

var $0 = $$.length - 1;
switch (yystate) {
case 1:return this.$ = new yy.Block;
break;
case 2:return this.$ = $$[$0];
break;
case 3:return this.$ = $$[$0-1];
break;
case 4:this.$ = yy.Block.wrap([$$[$0]]);
break;
case 5:this.$ = $$[$0-2].push($$[$0]);
break;
case 6:this.$ = $$[$0-1];
break;
case 7:this.$ = $$[$0];
break;
case 8:this.$ = $$[$0];
break;
case 9:this.$ = $$[$0];
break;
case 10:this.$ = $$[$0];
break;
case 11:this.$ = $$[$0];
break;
case 12:this.$ = new yy.Literal($$[$0]);
break;
case 13:this.$ = $$[$0];
break;
case 14:this.$ = $$[$0];
break;
case 15:this.$ = $$[$0];
break;
case 16:this.$ = $$[$0];
break;
case 17:this.$ = $$[$0];
break;
case 18:this.$ = $$[$0];
break;
case 19:this.$ = $$[$0];
break;
case 20:this.$ = $$[$0];
break;
case 21:this.$ = $$[$0];
break;
case 22:this.$ = $$[$0];
break;
case 23:this.$ = $$[$0];
break;
case 24:this.$ = $$[$0];
break;
case 25:this.$ = new yy.Block;
break;
case 26:this.$ = $$[$0-1];
break;
case 27:this.$ = new yy.Literal($$[$0]);
break;
case 28:this.$ = new yy.Literal($$[$0]);
break;
case 29:this.$ = new yy.Literal($$[$0]);
break;
case 30:this.$ = $$[$0];
break;
case 31:this.$ = new yy.Literal($$[$0]);
break;
case 32:this.$ = new yy.Literal($$[$0]);
break;
case 33:this.$ = (function () {
        var val;
        val = new yy.Literal($$[$0]);
        if ($$[$0] === 'undefined') {
          val.isUndefined = true;
        }
        return val;
      }());
break;
case 34:this.$ = new yy.Assign($$[$0-2], $$[$0]);
break;
case 35:this.$ = new yy.Assign($$[$0-4], $$[$0-1]);
break;
case 36:this.$ = new yy.Value($$[$0]);
break;
case 37:this.$ = new yy.Assign(new yy.Value($$[$0-2]), $$[$0], 'object');
break;
case 38:this.$ = new yy.Assign(new yy.Value($$[$0-4]), $$[$0-1], 'object');
break;
case 39:this.$ = $$[$0];
break;
case 40:this.$ = $$[$0];
break;
case 41:this.$ = $$[$0];
break;
case 42:this.$ = $$[$0];
break;
case 43:this.$ = new yy.Return($$[$0]);
break;
case 44:this.$ = new yy.Return;
break;
case 45:this.$ = new yy.Comment($$[$0]);
break;
case 46:this.$ = new yy.Comment($$[$0], true);
break;
case 47:this.$ = new yy.Code($$[$0-3], $$[$0], $$[$0-1]);
break;
case 48:this.$ = new yy.Code([], $$[$0], $$[$0-1]);
break;
case 49:this.$ = 'func';
break;
case 50:this.$ = 'boundfunc';
break;
case 51:this.$ = $$[$0];
break;
case 52:this.$ = $$[$0];
break;
case 53:this.$ = [];
break;
case 54:this.$ = [$$[$0]];
break;
case 55:this.$ = $$[$0-2].concat($$[$0]);
break;
case 56:this.$ = new yy.Param($$[$0]);
break;
case 57:this.$ = new yy.Param($$[$0-1], null, true);
break;
case 58:this.$ = new yy.Param($$[$0-2], $$[$0]);
break;
case 59:this.$ = $$[$0];
break;
case 60:this.$ = $$[$0];
break;
case 61:this.$ = $$[$0];
break;
case 62:this.$ = $$[$0];
break;
case 63:this.$ = new yy.Splat($$[$0-1]);
break;
case 64:this.$ = new yy.Value($$[$0]);
break;
case 65:this.$ = $$[$0-1].push($$[$0]);
break;
case 66:this.$ = new yy.Value($$[$0-1], [$$[$0]]);
break;
case 67:this.$ = $$[$0];
break;
case 68:this.$ = $$[$0];
break;
case 69:this.$ = new yy.Value($$[$0]);
break;
case 70:this.$ = new yy.Value($$[$0]);
break;
case 71:this.$ = $$[$0];
break;
case 72:this.$ = new yy.Value($$[$0]);
break;
case 73:this.$ = new yy.Value($$[$0]);
break;
case 74:this.$ = new yy.Value($$[$0]);
break;
case 75:this.$ = $$[$0];
break;
case 76:this.$ = new yy.Access($$[$0]);
break;
case 77:this.$ = new yy.Access($$[$0], 'soak');
break;
case 78:this.$ = new yy.Access($$[$0], 'proto');
break;
case 79:this.$ = new yy.Access(new yy.Literal('prototype'));
break;
case 80:this.$ = $$[$0];
break;
case 81:this.$ = $$[$0-1];
break;
case 82:this.$ = yy.extend($$[$0], {
          soak: true
        });
break;
case 83:this.$ = yy.extend($$[$0], {
          proto: true
        });
break;
case 84:this.$ = new yy.Index($$[$0]);
break;
case 85:this.$ = new yy.Slice($$[$0]);
break;
case 86:this.$ = new yy.Obj($$[$0-2], $$[$0-3].generated);
break;
case 87:this.$ = [];
break;
case 88:this.$ = [$$[$0]];
break;
case 89:this.$ = $$[$0-2].concat($$[$0]);
break;
case 90:this.$ = $$[$0-3].concat($$[$0]);
break;
case 91:this.$ = $$[$0-5].concat($$[$0-2]);
break;
case 92:this.$ = new yy.Class;
break;
case 93:this.$ = new yy.Class(null, null, $$[$0]);
break;
case 94:this.$ = new yy.Class(null, $$[$0]);
break;
case 95:this.$ = new yy.Class(null, $$[$0-1], $$[$0]);
break;
case 96:this.$ = new yy.Class($$[$0]);
break;
case 97:this.$ = new yy.Class($$[$0-1], null, $$[$0]);
break;
case 98:this.$ = new yy.Class($$[$0-2], $$[$0]);
break;
case 99:this.$ = new yy.Class($$[$0-3], $$[$0-1], $$[$0]);
break;
case 100:this.$ = new yy.Call($$[$0-2], $$[$0], $$[$0-1]);
break;
case 101:this.$ = new yy.Call($$[$0-2], $$[$0], $$[$0-1]);
break;
case 102:this.$ = new yy.Call('super', [new yy.Splat(new yy.Literal('arguments'))]);
break;
case 103:this.$ = new yy.Call('super', $$[$0]);
break;
case 104:this.$ = false;
break;
case 105:this.$ = true;
break;
case 106:this.$ = [];
break;
case 107:this.$ = $$[$0-2];
break;
case 108:this.$ = new yy.Value(new yy.Literal('this'));
break;
case 109:this.$ = new yy.Value(new yy.Literal('this'));
break;
case 110:this.$ = new yy.Value(new yy.Literal('this'), [new yy.Access($$[$0])], 'this');
break;
case 111:this.$ = new yy.Arr([]);
break;
case 112:this.$ = new yy.Arr($$[$0-2]);
break;
case 113:this.$ = 'inclusive';
break;
case 114:this.$ = 'exclusive';
break;
case 115:this.$ = new yy.Range($$[$0-3], $$[$0-1], $$[$0-2]);
break;
case 116:this.$ = new yy.Range($$[$0-2], $$[$0], $$[$0-1]);
break;
case 117:this.$ = new yy.Range($$[$0-1], null, $$[$0]);
break;
case 118:this.$ = new yy.Range(null, $$[$0], $$[$0-1]);
break;
case 119:this.$ = [$$[$0]];
break;
case 120:this.$ = $$[$0-2].concat($$[$0]);
break;
case 121:this.$ = $$[$0-3].concat($$[$0]);
break;
case 122:this.$ = $$[$0-2];
break;
case 123:this.$ = $$[$0-5].concat($$[$0-2]);
break;
case 124:this.$ = $$[$0];
break;
case 125:this.$ = $$[$0];
break;
case 126:this.$ = $$[$0];
break;
case 127:this.$ = [].concat($$[$0-2], $$[$0]);
break;
case 128:this.$ = new yy.Try($$[$0]);
break;
case 129:this.$ = new yy.Try($$[$0-1], $$[$0][0], $$[$0][1]);
break;
case 130:this.$ = new yy.Try($$[$0-2], null, null, $$[$0]);
break;
case 131:this.$ = new yy.Try($$[$0-3], $$[$0-2][0], $$[$0-2][1], $$[$0]);
break;
case 132:this.$ = [$$[$0-1], $$[$0]];
break;
case 133:this.$ = new yy.Throw($$[$0]);
break;
case 134:this.$ = new yy.Include($$[$0]);
break;
case 135:this.$ = new yy.Include($$[$0-2], $$[$0]);
break;
case 136:this.$ = new yy.Namespace($$[$0]);
break;
case 137:this.$ = new yy.Namespace($$[$0], $$[$0-2]);
break;
case 138:this.$ = new yy.Parens($$[$0-1]);
break;
case 139:this.$ = new yy.Parens($$[$0-2]);
break;
case 140:this.$ = new yy.While($$[$0]);
break;
case 141:this.$ = new yy.While($$[$0-2], {
          guard: $$[$0]
        });
break;
case 142:this.$ = new yy.While($$[$0], {
          invert: true
        });
break;
case 143:this.$ = new yy.While($$[$0-2], {
          invert: true,
          guard: $$[$0]
        });
break;
case 144:this.$ = $$[$0-1].addBody($$[$0]);
break;
case 145:this.$ = $$[$0].addBody(yy.Block.wrap([$$[$0-1]]));
break;
case 146:this.$ = $$[$0].addBody(yy.Block.wrap([$$[$0-1]]));
break;
case 147:this.$ = $$[$0];
break;
case 148:this.$ = new yy.While(new yy.Literal('true')).addBody($$[$0]);
break;
case 149:this.$ = new yy.While(new yy.Literal('true')).addBody(yy.Block.wrap([$$[$0]]));
break;
case 150:this.$ = new yy.For($$[$0-1], $$[$0]);
break;
case 151:this.$ = new yy.For($$[$0-1], $$[$0]);
break;
case 152:this.$ = new yy.For($$[$0], $$[$0-1]);
break;
case 153:this.$ = {
          source: new yy.Value($$[$0])
        };
break;
case 154:this.$ = (function () {
        $$[$0].own = $$[$0-1].own;
        $$[$0].name = $$[$0-1][0];
        $$[$0].index = $$[$0-1][1];
        return $$[$0];
      }());
break;
case 155:this.$ = $$[$0];
break;
case 156:this.$ = (function () {
        $$[$0].own = true;
        return $$[$0];
      }());
break;
case 157:this.$ = $$[$0];
break;
case 158:this.$ = new yy.Value($$[$0]);
break;
case 159:this.$ = new yy.Value($$[$0]);
break;
case 160:this.$ = [$$[$0]];
break;
case 161:this.$ = [$$[$0-2], $$[$0]];
break;
case 162:this.$ = {
          source: $$[$0]
        };
break;
case 163:this.$ = {
          source: $$[$0],
          object: true
        };
break;
case 164:this.$ = {
          source: $$[$0-2],
          guard: $$[$0]
        };
break;
case 165:this.$ = {
          source: $$[$0-2],
          guard: $$[$0],
          object: true
        };
break;
case 166:this.$ = {
          source: $$[$0-2],
          step: $$[$0]
        };
break;
case 167:this.$ = {
          source: $$[$0-4],
          guard: $$[$0-2],
          step: $$[$0]
        };
break;
case 168:this.$ = {
          source: $$[$0-4],
          step: $$[$0-2],
          guard: $$[$0]
        };
break;
case 169:this.$ = new yy.Switch($$[$0-3], $$[$0-1]);
break;
case 170:this.$ = new yy.Switch($$[$0-5], $$[$0-3], $$[$0-1]);
break;
case 171:this.$ = new yy.Switch(null, $$[$0-1]);
break;
case 172:this.$ = new yy.Switch(null, $$[$0-3], $$[$0-1]);
break;
case 173:this.$ = $$[$0];
break;
case 174:this.$ = $$[$0-1].concat($$[$0]);
break;
case 175:this.$ = [[$$[$0-1], $$[$0]]];
break;
case 176:this.$ = [[$$[$0-2], $$[$0-1]]];
break;
case 177:this.$ = new yy.If($$[$0-1], $$[$0], {
          type: $$[$0-2]
        });
break;
case 178:this.$ = $$[$0-4].addElse(new yy.If($$[$0-1], $$[$0], {
          type: $$[$0-2]
        }));
break;
case 179:this.$ = $$[$0];
break;
case 180:this.$ = $$[$0-2].addElse($$[$0]);
break;
case 181:this.$ = new yy.If($$[$0], yy.Block.wrap([$$[$0-2]]), {
          type: $$[$0-1],
          statement: true
        });
break;
case 182:this.$ = new yy.If($$[$0], yy.Block.wrap([$$[$0-2]]), {
          type: $$[$0-1],
          statement: true
        });
break;
case 183:this.$ = new yy.Op($$[$0-1], $$[$0]);
break;
case 184:this.$ = new yy.Op('-', $$[$0]);
break;
case 185:this.$ = new yy.Op('+', $$[$0]);
break;
case 186:this.$ = new yy.Op('--', $$[$0]);
break;
case 187:this.$ = new yy.Op('++', $$[$0]);
break;
case 188:this.$ = new yy.Op('--', $$[$0-1], null, true);
break;
case 189:this.$ = new yy.Op('++', $$[$0-1], null, true);
break;
case 190:this.$ = new yy.Existence($$[$0-1]);
break;
case 191:this.$ = new yy.Op('+', $$[$0-2], $$[$0]);
break;
case 192:this.$ = new yy.Op('-', $$[$0-2], $$[$0]);
break;
case 193:this.$ = new yy.Op($$[$0-1], $$[$0-2], $$[$0]);
break;
case 194:this.$ = new yy.Op($$[$0-1], $$[$0-2], $$[$0]);
break;
case 195:this.$ = new yy.Op($$[$0-1], $$[$0-2], $$[$0]);
break;
case 196:this.$ = new yy.Op($$[$0-1], $$[$0-2], $$[$0]);
break;
case 197:this.$ = (function () {
        if ($$[$0-1].charAt(0) === '!') {
          return new yy.Op($$[$0-1].slice(1), $$[$0-2], $$[$0]).invert();
        } else {
          return new yy.Op($$[$0-1], $$[$0-2], $$[$0]);
        }
      }());
break;
case 198:this.$ = new yy.Assign($$[$0-2], $$[$0], $$[$0-1]);
break;
case 199:this.$ = new yy.Assign($$[$0-4], $$[$0-1], $$[$0-3]);
break;
case 200:this.$ = new yy.Extends($$[$0-2], $$[$0]);
break;
}
},
table: [{1:[2,1],3:1,4:2,5:3,7:4,8:6,9:7,10:20,11:21,12:22,13:[1,23],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:19,26:[1,5],28:62,29:[1,73],30:52,31:[1,71],32:[1,72],33:25,34:[1,53],35:[1,54],36:[1,55],37:24,42:63,43:[1,46],44:[1,48],45:[1,49],46:[1,30],49:31,50:[1,60],51:[1,61],57:50,58:51,60:37,62:26,63:27,64:28,75:[1,70],78:[1,45],82:[1,29],87:[1,58],88:[1,59],89:[1,57],95:[1,39],99:[1,47],100:[1,40],103:[1,56],105:41,106:[1,65],108:[1,66],109:42,110:[1,67],111:43,112:[1,68],113:69,121:[1,44],126:38,127:[1,64],129:[1,32],130:[1,33],131:[1,34],132:[1,35],133:[1,36]},{1:[3]},{1:[2,2],6:[1,74]},{6:[1,75]},{1:[2,4],6:[2,4],27:[2,4],104:[2,4]},{4:77,7:4,8:6,9:7,10:20,11:21,12:22,13:[1,23],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:19,27:[1,76],28:62,29:[1,73],30:52,31:[1,71],32:[1,72],33:25,34:[1,53],35:[1,54],36:[1,55],37:24,42:63,43:[1,46],44:[1,48],45:[1,49],46:[1,30],49:31,50:[1,60],51:[1,61],57:50,58:51,60:37,62:26,63:27,64:28,75:[1,70],78:[1,45],82:[1,29],87:[1,58],88:[1,59],89:[1,57],95:[1,39],99:[1,47],100:[1,40],103:[1,56],105:41,106:[1,65],108:[1,66],109:42,110:[1,67],111:43,112:[1,68],113:69,121:[1,44],126:38,127:[1,64],129:[1,32],130:[1,33],131:[1,34],132:[1,35],133:[1,36]},{1:[2,7],6:[2,7],27:[2,7],104:[2,7],105:87,106:[1,65],108:[1,66],111:88,112:[1,68],113:69,128:[1,86],130:[1,80],131:[1,79],134:[1,78],135:[1,81],136:[1,82],137:[1,83],138:[1,84],139:[1,85]},{1:[2,8],6:[2,8],27:[2,8],104:[2,8],105:90,106:[1,65],108:[1,66],111:91,112:[1,68],113:69,128:[1,89]},{1:[2,13],6:[2,13],26:[2,13],27:[2,13],48:[2,13],53:[2,13],56:[2,13],61:93,65:[1,95],66:[1,96],67:[1,97],68:98,69:[1,99],71:[2,13],72:[1,100],73:[1,101],77:[2,13],80:92,83:[1,94],84:[2,104],85:[2,13],90:[2,13],92:[2,13],104:[2,13],106:[2,13],107:[2,13],108:[2,13],112:[2,13],120:[2,13],128:[2,13],130:[2,13],131:[2,13],134:[2,13],135:[2,13],136:[2,13],137:[2,13],138:[2,13],139:[2,13]},{1:[2,14],6:[2,14],26:[2,14],27:[2,14],48:[2,14],53:[2,14],56:[2,14],61:103,65:[1,95],66:[1,96],67:[1,97],68:98,69:[1,99],71:[2,14],72:[1,100],73:[1,101],77:[2,14],80:102,83:[1,94],84:[2,104],85:[2,14],90:[2,14],92:[2,14],104:[2,14],106:[2,14],107:[2,14],108:[2,14],112:[2,14],120:[2,14],128:[2,14],130:[2,14],131:[2,14],134:[2,14],135:[2,14],136:[2,14],137:[2,14],138:[2,14],139:[2,14]},{1:[2,15],6:[2,15],26:[2,15],27:[2,15],48:[2,15],53:[2,15],56:[2,15],71:[2,15],77:[2,15],85:[2,15],90:[2,15],92:[2,15],104:[2,15],106:[2,15],107:[2,15],108:[2,15],112:[2,15],120:[2,15],128:[2,15],130:[2,15],131:[2,15],134:[2,15],135:[2,15],136:[2,15],137:[2,15],138:[2,15],139:[2,15]},{1:[2,16],6:[2,16],26:[2,16],27:[2,16],48:[2,16],53:[2,16],56:[2,16],71:[2,16],77:[2,16],85:[2,16],90:[2,16],92:[2,16],104:[2,16],106:[2,16],107:[2,16],108:[2,16],112:[2,16],120:[2,16],128:[2,16],130:[2,16],131:[2,16],134:[2,16],135:[2,16],136:[2,16],137:[2,16],138:[2,16],139:[2,16]},{1:[2,17],6:[2,17],26:[2,17],27:[2,17],48:[2,17],53:[2,17],56:[2,17],71:[2,17],77:[2,17],85:[2,17],90:[2,17],92:[2,17],104:[2,17],106:[2,17],107:[2,17],108:[2,17],112:[2,17],120:[2,17],128:[2,17],130:[2,17],131:[2,17],134:[2,17],135:[2,17],136:[2,17],137:[2,17],138:[2,17],139:[2,17]},{1:[2,18],6:[2,18],26:[2,18],27:[2,18],48:[2,18],53:[2,18],56:[2,18],71:[2,18],77:[2,18],85:[2,18],90:[2,18],92:[2,18],104:[2,18],106:[2,18],107:[2,18],108:[2,18],112:[2,18],120:[2,18],128:[2,18],130:[2,18],131:[2,18],134:[2,18],135:[2,18],136:[2,18],137:[2,18],138:[2,18],139:[2,18]},{1:[2,19],6:[2,19],26:[2,19],27:[2,19],48:[2,19],53:[2,19],56:[2,19],71:[2,19],77:[2,19],85:[2,19],90:[2,19],92:[2,19],104:[2,19],106:[2,19],107:[2,19],108:[2,19],112:[2,19],120:[2,19],128:[2,19],130:[2,19],131:[2,19],134:[2,19],135:[2,19],136:[2,19],137:[2,19],138:[2,19],139:[2,19]},{1:[2,20],6:[2,20],26:[2,20],27:[2,20],48:[2,20],53:[2,20],56:[2,20],71:[2,20],77:[2,20],85:[2,20],90:[2,20],92:[2,20],104:[2,20],106:[2,20],107:[2,20],108:[2,20],112:[2,20],120:[2,20],128:[2,20],130:[2,20],131:[2,20],134:[2,20],135:[2,20],136:[2,20],137:[2,20],138:[2,20],139:[2,20]},{1:[2,21],6:[2,21],26:[2,21],27:[2,21],48:[2,21],53:[2,21],56:[2,21],71:[2,21],77:[2,21],85:[2,21],90:[2,21],92:[2,21],104:[2,21],106:[2,21],107:[2,21],108:[2,21],112:[2,21],120:[2,21],128:[2,21],130:[2,21],131:[2,21],134:[2,21],135:[2,21],136:[2,21],137:[2,21],138:[2,21],139:[2,21]},{1:[2,22],6:[2,22],26:[2,22],27:[2,22],48:[2,22],53:[2,22],56:[2,22],71:[2,22],77:[2,22],85:[2,22],90:[2,22],92:[2,22],104:[2,22],106:[2,22],107:[2,22],108:[2,22],112:[2,22],120:[2,22],128:[2,22],130:[2,22],131:[2,22],134:[2,22],135:[2,22],136:[2,22],137:[2,22],138:[2,22],139:[2,22]},{1:[2,23],6:[2,23],26:[2,23],27:[2,23],48:[2,23],53:[2,23],56:[2,23],71:[2,23],77:[2,23],85:[2,23],90:[2,23],92:[2,23],104:[2,23],106:[2,23],107:[2,23],108:[2,23],112:[2,23],120:[2,23],128:[2,23],130:[2,23],131:[2,23],134:[2,23],135:[2,23],136:[2,23],137:[2,23],138:[2,23],139:[2,23]},{1:[2,24],6:[2,24],26:[2,24],27:[2,24],48:[2,24],53:[2,24],56:[2,24],71:[2,24],77:[2,24],85:[2,24],90:[2,24],92:[2,24],104:[2,24],106:[2,24],107:[2,24],108:[2,24],112:[2,24],120:[2,24],128:[2,24],130:[2,24],131:[2,24],134:[2,24],135:[2,24],136:[2,24],137:[2,24],138:[2,24],139:[2,24]},{1:[2,9],6:[2,9],27:[2,9],104:[2,9],106:[2,9],108:[2,9],112:[2,9],128:[2,9]},{1:[2,10],6:[2,10],27:[2,10],104:[2,10],106:[2,10],108:[2,10],112:[2,10],128:[2,10]},{1:[2,11],6:[2,11],27:[2,11],104:[2,11],106:[2,11],108:[2,11],112:[2,11],128:[2,11]},{1:[2,12],6:[2,12],27:[2,12],104:[2,12],106:[2,12],108:[2,12],112:[2,12],128:[2,12]},{1:[2,71],6:[2,71],26:[2,71],27:[2,71],38:[1,104],48:[2,71],53:[2,71],56:[2,71],65:[2,71],66:[2,71],67:[2,71],69:[2,71],71:[2,71],72:[2,71],73:[2,71],77:[2,71],83:[2,71],84:[2,71],85:[2,71],90:[2,71],92:[2,71],104:[2,71],106:[2,71],107:[2,71],108:[2,71],112:[2,71],120:[2,71],128:[2,71],130:[2,71],131:[2,71],134:[2,71],135:[2,71],136:[2,71],137:[2,71],138:[2,71],139:[2,71]},{1:[2,72],6:[2,72],26:[2,72],27:[2,72],48:[2,72],53:[2,72],56:[2,72],65:[2,72],66:[2,72],67:[2,72],69:[2,72],71:[2,72],72:[2,72],73:[2,72],77:[2,72],83:[2,72],84:[2,72],85:[2,72],90:[2,72],92:[2,72],104:[2,72],106:[2,72],107:[2,72],108:[2,72],112:[2,72],120:[2,72],128:[2,72],130:[2,72],131:[2,72],134:[2,72],135:[2,72],136:[2,72],137:[2,72],138:[2,72],139:[2,72]},{1:[2,73],6:[2,73],26:[2,73],27:[2,73],48:[2,73],53:[2,73],56:[2,73],65:[2,73],66:[2,73],67:[2,73],69:[2,73],71:[2,73],72:[2,73],73:[2,73],77:[2,73],83:[2,73],84:[2,73],85:[2,73],90:[2,73],92:[2,73],104:[2,73],106:[2,73],107:[2,73],108:[2,73],112:[2,73],120:[2,73],128:[2,73],130:[2,73],131:[2,73],134:[2,73],135:[2,73],136:[2,73],137:[2,73],138:[2,73],139:[2,73]},{1:[2,74],6:[2,74],26:[2,74],27:[2,74],48:[2,74],53:[2,74],56:[2,74],65:[2,74],66:[2,74],67:[2,74],69:[2,74],71:[2,74],72:[2,74],73:[2,74],77:[2,74],83:[2,74],84:[2,74],85:[2,74],90:[2,74],92:[2,74],104:[2,74],106:[2,74],107:[2,74],108:[2,74],112:[2,74],120:[2,74],128:[2,74],130:[2,74],131:[2,74],134:[2,74],135:[2,74],136:[2,74],137:[2,74],138:[2,74],139:[2,74]},{1:[2,75],6:[2,75],26:[2,75],27:[2,75],48:[2,75],53:[2,75],56:[2,75],65:[2,75],66:[2,75],67:[2,75],69:[2,75],71:[2,75],72:[2,75],73:[2,75],77:[2,75],83:[2,75],84:[2,75],85:[2,75],90:[2,75],92:[2,75],104:[2,75],106:[2,75],107:[2,75],108:[2,75],112:[2,75],120:[2,75],128:[2,75],130:[2,75],131:[2,75],134:[2,75],135:[2,75],136:[2,75],137:[2,75],138:[2,75],139:[2,75]},{1:[2,102],6:[2,102],26:[2,102],27:[2,102],48:[2,102],53:[2,102],56:[2,102],65:[2,102],66:[2,102],67:[2,102],69:[2,102],71:[2,102],72:[2,102],73:[2,102],77:[2,102],81:105,83:[2,102],84:[1,106],85:[2,102],90:[2,102],92:[2,102],104:[2,102],106:[2,102],107:[2,102],108:[2,102],112:[2,102],120:[2,102],128:[2,102],130:[2,102],131:[2,102],134:[2,102],135:[2,102],136:[2,102],137:[2,102],138:[2,102],139:[2,102]},{28:110,29:[1,73],42:111,47:107,48:[2,53],53:[2,53],54:108,55:109,57:112,58:113,75:[1,70],88:[1,114],89:[1,115]},{5:116,26:[1,5]},{8:117,9:118,10:20,11:21,12:22,13:[1,23],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:19,28:62,29:[1,73],30:52,31:[1,71],32:[1,72],33:25,34:[1,53],35:[1,54],36:[1,55],37:24,42:63,43:[1,46],44:[1,48],45:[1,49],46:[1,30],49:31,50:[1,60],51:[1,61],57:50,58:51,60:37,62:26,63:27,64:28,75:[1,70],78:[1,45],82:[1,29],87:[1,58],88:[1,59],89:[1,57],95:[1,39],99:[1,47],100:[1,40],103:[1,56],105:41,106:[1,65],108:[1,66],109:42,110:[1,67],111:43,112:[1,68],113:69,121:[1,44],126:38,127:[1,64],129:[1,32],130:[1,33],131:[1,34],132:[1,35],133:[1,36]},{8:119,9:118,10:20,11:21,12:22,13:[1,23],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:19,28:62,29:[1,73],30:52,31:[1,71],32:[1,72],33:25,34:[1,53],35:[1,54],36:[1,55],37:24,42:63,43:[1,46],44:[1,48],45:[1,49],46:[1,30],49:31,50:[1,60],51:[1,61],57:50,58:51,60:37,62:26,63:27,64:28,75:[1,70],78:[1,45],82:[1,29],87:[1,58],88:[1,59],89:[1,57],95:[1,39],99:[1,47],100:[1,40],103:[1,56],105:41,106:[1,65],108:[1,66],109:42,110:[1,67],111:43,112:[1,68],113:69,121:[1,44],126:38,127:[1,64],129:[1,32],130:[1,33],131:[1,34],132:[1,35],133:[1,36]},{8:120,9:118,10:20,11:21,12:22,13:[1,23],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:19,28:62,29:[1,73],30:52,31:[1,71],32:[1,72],33:25,34:[1,53],35:[1,54],36:[1,55],37:24,42:63,43:[1,46],44:[1,48],45:[1,49],46:[1,30],49:31,50:[1,60],51:[1,61],57:50,58:51,60:37,62:26,63:27,64:28,75:[1,70],78:[1,45],82:[1,29],87:[1,58],88:[1,59],89:[1,57],95:[1,39],99:[1,47],100:[1,40],103:[1,56],105:41,106:[1,65],108:[1,66],109:42,110:[1,67],111:43,112:[1,68],113:69,121:[1,44],126:38,127:[1,64],129:[1,32],130:[1,33],131:[1,34],132:[1,35],133:[1,36]},{14:122,15:123,28:62,29:[1,73],30:52,31:[1,71],32:[1,72],33:25,34:[1,53],35:[1,54],36:[1,55],37:124,42:63,57:50,58:51,60:121,62:26,63:27,64:28,75:[1,70],82:[1,29],87:[1,58],88:[1,59],89:[1,57],103:[1,56]},{14:122,15:123,28:62,29:[1,73],30:52,31:[1,71],32:[1,72],33:25,34:[1,53],35:[1,54],36:[1,55],37:124,42:63,57:50,58:51,60:125,62:26,63:27,64:28,75:[1,70],82:[1,29],87:[1,58],88:[1,59],89:[1,57],103:[1,56]},{1:[2,68],6:[2,68],26:[2,68],27:[2,68],38:[2,68],48:[2,68],53:[2,68],56:[2,68],65:[2,68],66:[2,68],67:[2,68],69:[2,68],71:[2,68],72:[2,68],73:[2,68],77:[2,68],79:[1,129],83:[2,68],84:[2,68],85:[2,68],90:[2,68],92:[2,68],104:[2,68],106:[2,68],107:[2,68],108:[2,68],112:[2,68],120:[2,68],128:[2,68],130:[2,68],131:[2,68],132:[1,126],133:[1,127],134:[2,68],135:[2,68],136:[2,68],137:[2,68],138:[2,68],139:[2,68],140:[1,128]},{1:[2,179],6:[2,179],26:[2,179],27:[2,179],48:[2,179],53:[2,179],56:[2,179],71:[2,179],77:[2,179],85:[2,179],90:[2,179],92:[2,179],104:[2,179],106:[2,179],107:[2,179],108:[2,179],112:[2,179],120:[2,179],123:[1,130],128:[2,179],130:[2,179],131:[2,179],134:[2,179],135:[2,179],136:[2,179],137:[2,179],138:[2,179],139:[2,179]},{5:131,26:[1,5]},{29:[1,133],101:132},{5:134,26:[1,5]},{1:[2,147],6:[2,147],26:[2,147],27:[2,147],48:[2,147],53:[2,147],56:[2,147],71:[2,147],77:[2,147],85:[2,147],90:[2,147],92:[2,147],104:[2,147],106:[2,147],107:[2,147],108:[2,147],112:[2,147],120:[2,147],128:[2,147],130:[2,147],131:[2,147],134:[2,147],135:[2,147],136:[2,147],137:[2,147],138:[2,147],139:[2,147]},{5:135,26:[1,5]},{8:136,9:118,10:20,11:21,12:22,13:[1,23],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:19,26:[1,137],28:62,29:[1,73],30:52,31:[1,71],32:[1,72],33:25,34:[1,53],35:[1,54],36:[1,55],37:24,42:63,43:[1,46],44:[1,48],45:[1,49],46:[1,30],49:31,50:[1,60],51:[1,61],57:50,58:51,60:37,62:26,63:27,64:28,75:[1,70],78:[1,45],82:[1,29],87:[1,58],88:[1,59],89:[1,57],95:[1,39],99:[1,47],100:[1,40],103:[1,56],105:41,106:[1,65],108:[1,66],109:42,110:[1,67],111:43,112:[1,68],113:69,121:[1,44],126:38,127:[1,64],129:[1,32],130:[1,33],131:[1,34],132:[1,35],133:[1,36]},{1:[2,92],5:138,6:[2,92],14:122,15:123,26:[1,5],27:[2,92],28:62,29:[1,73],30:52,31:[1,71],32:[1,72],33:25,34:[1,53],35:[1,54],36:[1,55],37:124,42:63,48:[2,92],53:[2,92],56:[2,92],57:50,58:51,60:140,62:26,63:27,64:28,71:[2,92],75:[1,70],77:[2,92],79:[1,139],82:[1,29],85:[2,92],87:[1,58],88:[1,59],89:[1,57],90:[2,92],92:[2,92],103:[1,56],104:[2,92],106:[2,92],107:[2,92],108:[2,92],112:[2,92],120:[2,92],128:[2,92],130:[2,92],131:[2,92],134:[2,92],135:[2,92],136:[2,92],137:[2,92],138:[2,92],139:[2,92]},{1:[2,44],6:[2,44],8:141,9:118,10:20,11:21,12:22,13:[1,23],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:19,27:[2,44],28:62,29:[1,73],30:52,31:[1,71],32:[1,72],33:25,34:[1,53],35:[1,54],36:[1,55],37:24,42:63,43:[1,46],44:[1,48],45:[1,49],46:[1,30],49:31,50:[1,60],51:[1,61],57:50,58:51,60:37,62:26,63:27,64:28,75:[1,70],78:[1,45],82:[1,29],87:[1,58],88:[1,59],89:[1,57],95:[1,39],99:[1,47],100:[1,40],103:[1,56],104:[2,44],105:41,106:[2,44],108:[2,44],109:42,110:[1,67],111:43,112:[2,44],113:69,121:[1,44],126:38,127:[1,64],128:[2,44],129:[1,32],130:[1,33],131:[1,34],132:[1,35],133:[1,36]},{8:142,9:118,10:20,11:21,12:22,13:[1,23],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:19,28:62,29:[1,73],30:52,31:[1,71],32:[1,72],33:25,34:[1,53],35:[1,54],36:[1,55],37:24,42:63,43:[1,46],44:[1,48],45:[1,49],46:[1,30],49:31,50:[1,60],51:[1,61],57:50,58:51,60:37,62:26,63:27,64:28,75:[1,70],78:[1,45],82:[1,29],87:[1,58],88:[1,59],89:[1,57],95:[1,39],99:[1,47],100:[1,40],103:[1,56],105:41,106:[1,65],108:[1,66],109:42,110:[1,67],111:43,112:[1,68],113:69,121:[1,44],126:38,127:[1,64],129:[1,32],130:[1,33],131:[1,34],132:[1,35],133:[1,36]},{1:[2,45],6:[2,45],26:[2,45],27:[2,45],53:[2,45],77:[2,45],104:[2,45],106:[2,45],108:[2,45],112:[2,45],128:[2,45]},{1:[2,46],6:[2,46],26:[2,46],27:[2,46],53:[2,46],77:[2,46],104:[2,46],106:[2,46],108:[2,46],112:[2,46],128:[2,46]},{1:[2,69],6:[2,69],26:[2,69],27:[2,69],38:[2,69],48:[2,69],53:[2,69],56:[2,69],65:[2,69],66:[2,69],67:[2,69],69:[2,69],71:[2,69],72:[2,69],73:[2,69],77:[2,69],83:[2,69],84:[2,69],85:[2,69],90:[2,69],92:[2,69],104:[2,69],106:[2,69],107:[2,69],108:[2,69],112:[2,69],120:[2,69],128:[2,69],130:[2,69],131:[2,69],134:[2,69],135:[2,69],136:[2,69],137:[2,69],138:[2,69],139:[2,69]},{1:[2,70],6:[2,70],26:[2,70],27:[2,70],38:[2,70],48:[2,70],53:[2,70],56:[2,70],65:[2,70],66:[2,70],67:[2,70],69:[2,70],71:[2,70],72:[2,70],73:[2,70],77:[2,70],83:[2,70],84:[2,70],85:[2,70],90:[2,70],92:[2,70],104:[2,70],106:[2,70],107:[2,70],108:[2,70],112:[2,70],120:[2,70],128:[2,70],130:[2,70],131:[2,70],134:[2,70],135:[2,70],136:[2,70],137:[2,70],138:[2,70],139:[2,70]},{1:[2,30],6:[2,30],26:[2,30],27:[2,30],48:[2,30],53:[2,30],56:[2,30],65:[2,30],66:[2,30],67:[2,30],69:[2,30],71:[2,30],72:[2,30],73:[2,30],77:[2,30],83:[2,30],84:[2,30],85:[2,30],90:[2,30],92:[2,30],104:[2,30],106:[2,30],107:[2,30],108:[2,30],112:[2,30],120:[2,30],128:[2,30],130:[2,30],131:[2,30],134:[2,30],135:[2,30],136:[2,30],137:[2,30],138:[2,30],139:[2,30]},{1:[2,31],6:[2,31],26:[2,31],27:[2,31],48:[2,31],53:[2,31],56:[2,31],65:[2,31],66:[2,31],67:[2,31],69:[2,31],71:[2,31],72:[2,31],73:[2,31],77:[2,31],83:[2,31],84:[2,31],85:[2,31],90:[2,31],92:[2,31],104:[2,31],106:[2,31],107:[2,31],108:[2,31],112:[2,31],120:[2,31],128:[2,31],130:[2,31],131:[2,31],134:[2,31],135:[2,31],136:[2,31],137:[2,31],138:[2,31],139:[2,31]},{1:[2,32],6:[2,32],26:[2,32],27:[2,32],48:[2,32],53:[2,32],56:[2,32],65:[2,32],66:[2,32],67:[2,32],69:[2,32],71:[2,32],72:[2,32],73:[2,32],77:[2,32],83:[2,32],84:[2,32],85:[2,32],90:[2,32],92:[2,32],104:[2,32],106:[2,32],107:[2,32],108:[2,32],112:[2,32],120:[2,32],128:[2,32],130:[2,32],131:[2,32],134:[2,32],135:[2,32],136:[2,32],137:[2,32],138:[2,32],139:[2,32]},{1:[2,33],6:[2,33],26:[2,33],27:[2,33],48:[2,33],53:[2,33],56:[2,33],65:[2,33],66:[2,33],67:[2,33],69:[2,33],71:[2,33],72:[2,33],73:[2,33],77:[2,33],83:[2,33],84:[2,33],85:[2,33],90:[2,33],92:[2,33],104:[2,33],106:[2,33],107:[2,33],108:[2,33],112:[2,33],120:[2,33],128:[2,33],130:[2,33],131:[2,33],134:[2,33],135:[2,33],136:[2,33],137:[2,33],138:[2,33],139:[2,33]},{4:143,7:4,8:6,9:7,10:20,11:21,12:22,13:[1,23],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:19,26:[1,144],28:62,29:[1,73],30:52,31:[1,71],32:[1,72],33:25,34:[1,53],35:[1,54],36:[1,55],37:24,42:63,43:[1,46],44:[1,48],45:[1,49],46:[1,30],49:31,50:[1,60],51:[1,61],57:50,58:51,60:37,62:26,63:27,64:28,75:[1,70],78:[1,45],82:[1,29],87:[1,58],88:[1,59],89:[1,57],95:[1,39],99:[1,47],100:[1,40],103:[1,56],105:41,106:[1,65],108:[1,66],109:42,110:[1,67],111:43,112:[1,68],113:69,121:[1,44],126:38,127:[1,64],129:[1,32],130:[1,33],131:[1,34],132:[1,35],133:[1,36]},{8:145,9:118,10:20,11:21,12:22,13:[1,23],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:19,26:[1,149],28:62,29:[1,73],30:52,31:[1,71],32:[1,72],33:25,34:[1,53],35:[1,54],36:[1,55],37:24,42:63,43:[1,46],44:[1,48],45:[1,49],46:[1,30],49:31,50:[1,60],51:[1,61],57:50,58:51,59:150,60:37,62:26,63:27,64:28,75:[1,70],78:[1,45],82:[1,29],86:147,87:[1,58],88:[1,59],89:[1,57],90:[1,146],93:148,95:[1,39],99:[1,47],100:[1,40],103:[1,56],105:41,106:[1,65],108:[1,66],109:42,110:[1,67],111:43,112:[1,68],113:69,121:[1,44],126:38,127:[1,64],129:[1,32],130:[1,33],131:[1,34],132:[1,35],133:[1,36]},{1:[2,108],6:[2,108],26:[2,108],27:[2,108],48:[2,108],53:[2,108],56:[2,108],65:[2,108],66:[2,108],67:[2,108],69:[2,108],71:[2,108],72:[2,108],73:[2,108],77:[2,108],83:[2,108],84:[2,108],85:[2,108],90:[2,108],92:[2,108],104:[2,108],106:[2,108],107:[2,108],108:[2,108],112:[2,108],120:[2,108],128:[2,108],130:[2,108],131:[2,108],134:[2,108],135:[2,108],136:[2,108],137:[2,108],138:[2,108],139:[2,108]},{1:[2,109],6:[2,109],26:[2,109],27:[2,109],28:151,29:[1,73],48:[2,109],53:[2,109],56:[2,109],65:[2,109],66:[2,109],67:[2,109],69:[2,109],71:[2,109],72:[2,109],73:[2,109],77:[2,109],83:[2,109],84:[2,109],85:[2,109],90:[2,109],92:[2,109],104:[2,109],106:[2,109],107:[2,109],108:[2,109],112:[2,109],120:[2,109],128:[2,109],130:[2,109],131:[2,109],134:[2,109],135:[2,109],136:[2,109],137:[2,109],138:[2,109],139:[2,109]},{26:[2,49]},{26:[2,50]},{1:[2,64],6:[2,64],26:[2,64],27:[2,64],38:[2,64],48:[2,64],53:[2,64],56:[2,64],65:[2,64],66:[2,64],67:[2,64],69:[2,64],71:[2,64],72:[2,64],73:[2,64],77:[2,64],79:[2,64],83:[2,64],84:[2,64],85:[2,64],90:[2,64],92:[2,64],104:[2,64],106:[2,64],107:[2,64],108:[2,64],112:[2,64],120:[2,64],128:[2,64],130:[2,64],131:[2,64],132:[2,64],133:[2,64],134:[2,64],135:[2,64],136:[2,64],137:[2,64],138:[2,64],139:[2,64],140:[2,64]},{1:[2,67],6:[2,67],26:[2,67],27:[2,67],38:[2,67],48:[2,67],53:[2,67],56:[2,67],65:[2,67],66:[2,67],67:[2,67],69:[2,67],71:[2,67],72:[2,67],73:[2,67],77:[2,67],79:[2,67],83:[2,67],84:[2,67],85:[2,67],90:[2,67],92:[2,67],104:[2,67],106:[2,67],107:[2,67],108:[2,67],112:[2,67],120:[2,67],128:[2,67],130:[2,67],131:[2,67],132:[2,67],133:[2,67],134:[2,67],135:[2,67],136:[2,67],137:[2,67],138:[2,67],139:[2,67],140:[2,67]},{8:152,9:118,10:20,11:21,12:22,13:[1,23],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:19,28:62,29:[1,73],30:52,31:[1,71],32:[1,72],33:25,34:[1,53],35:[1,54],36:[1,55],37:24,42:63,43:[1,46],44:[1,48],45:[1,49],46:[1,30],49:31,50:[1,60],51:[1,61],57:50,58:51,60:37,62:26,63:27,64:28,75:[1,70],78:[1,45],82:[1,29],87:[1,58],88:[1,59],89:[1,57],95:[1,39],99:[1,47],100:[1,40],103:[1,56],105:41,106:[1,65],108:[1,66],109:42,110:[1,67],111:43,112:[1,68],113:69,121:[1,44],126:38,127:[1,64],129:[1,32],130:[1,33],131:[1,34],132:[1,35],133:[1,36]},{8:153,9:118,10:20,11:21,12:22,13:[1,23],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:19,28:62,29:[1,73],30:52,31:[1,71],32:[1,72],33:25,34:[1,53],35:[1,54],36:[1,55],37:24,42:63,43:[1,46],44:[1,48],45:[1,49],46:[1,30],49:31,50:[1,60],51:[1,61],57:50,58:51,60:37,62:26,63:27,64:28,75:[1,70],78:[1,45],82:[1,29],87:[1,58],88:[1,59],89:[1,57],95:[1,39],99:[1,47],100:[1,40],103:[1,56],105:41,106:[1,65],108:[1,66],109:42,110:[1,67],111:43,112:[1,68],113:69,121:[1,44],126:38,127:[1,64],129:[1,32],130:[1,33],131:[1,34],132:[1,35],133:[1,36]},{8:154,9:118,10:20,11:21,12:22,13:[1,23],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:19,28:62,29:[1,73],30:52,31:[1,71],32:[1,72],33:25,34:[1,53],35:[1,54],36:[1,55],37:24,42:63,43:[1,46],44:[1,48],45:[1,49],46:[1,30],49:31,50:[1,60],51:[1,61],57:50,58:51,60:37,62:26,63:27,64:28,75:[1,70],78:[1,45],82:[1,29],87:[1,58],88:[1,59],89:[1,57],95:[1,39],99:[1,47],100:[1,40],103:[1,56],105:41,106:[1,65],108:[1,66],109:42,110:[1,67],111:43,112:[1,68],113:69,121:[1,44],126:38,127:[1,64],129:[1,32],130:[1,33],131:[1,34],132:[1,35],133:[1,36]},{5:155,8:156,9:118,10:20,11:21,12:22,13:[1,23],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:19,26:[1,5],28:62,29:[1,73],30:52,31:[1,71],32:[1,72],33:25,34:[1,53],35:[1,54],36:[1,55],37:24,42:63,43:[1,46],44:[1,48],45:[1,49],46:[1,30],49:31,50:[1,60],51:[1,61],57:50,58:51,60:37,62:26,63:27,64:28,75:[1,70],78:[1,45],82:[1,29],87:[1,58],88:[1,59],89:[1,57],95:[1,39],99:[1,47],100:[1,40],103:[1,56],105:41,106:[1,65],108:[1,66],109:42,110:[1,67],111:43,112:[1,68],113:69,121:[1,44],126:38,127:[1,64],129:[1,32],130:[1,33],131:[1,34],132:[1,35],133:[1,36]},{28:161,29:[1,73],57:162,58:163,63:157,75:[1,70],89:[1,57],115:158,116:[1,159],117:160},{114:164,118:[1,165],119:[1,166]},{6:[2,87],12:170,26:[2,87],28:171,29:[1,73],30:172,31:[1,71],32:[1,72],39:168,40:169,42:173,44:[1,48],45:[1,49],53:[2,87],76:167,77:[2,87],88:[1,114]},{1:[2,28],6:[2,28],26:[2,28],27:[2,28],41:[2,28],48:[2,28],53:[2,28],56:[2,28],65:[2,28],66:[2,28],67:[2,28],69:[2,28],71:[2,28],72:[2,28],73:[2,28],77:[2,28],83:[2,28],84:[2,28],85:[2,28],90:[2,28],92:[2,28],104:[2,28],106:[2,28],107:[2,28],108:[2,28],112:[2,28],120:[2,28],128:[2,28],130:[2,28],131:[2,28],134:[2,28],135:[2,28],136:[2,28],137:[2,28],138:[2,28],139:[2,28]},{1:[2,29],6:[2,29],26:[2,29],27:[2,29],41:[2,29],48:[2,29],53:[2,29],56:[2,29],65:[2,29],66:[2,29],67:[2,29],69:[2,29],71:[2,29],72:[2,29],73:[2,29],77:[2,29],83:[2,29],84:[2,29],85:[2,29],90:[2,29],92:[2,29],104:[2,29],106:[2,29],107:[2,29],108:[2,29],112:[2,29],120:[2,29],128:[2,29],130:[2,29],131:[2,29],134:[2,29],135:[2,29],136:[2,29],137:[2,29],138:[2,29],139:[2,29]},{1:[2,27],6:[2,27],26:[2,27],27:[2,27],38:[2,27],41:[2,27],48:[2,27],53:[2,27],56:[2,27],65:[2,27],66:[2,27],67:[2,27],69:[2,27],71:[2,27],72:[2,27],73:[2,27],77:[2,27],79:[2,27],83:[2,27],84:[2,27],85:[2,27],90:[2,27],92:[2,27],104:[2,27],106:[2,27],107:[2,27],108:[2,27],112:[2,27],118:[2,27],119:[2,27],120:[2,27],128:[2,27],130:[2,27],131:[2,27],132:[2,27],133:[2,27],134:[2,27],135:[2,27],136:[2,27],137:[2,27],138:[2,27],139:[2,27],140:[2,27]},{1:[2,6],6:[2,6],7:174,8:6,9:7,10:20,11:21,12:22,13:[1,23],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:19,27:[2,6],28:62,29:[1,73],30:52,31:[1,71],32:[1,72],33:25,34:[1,53],35:[1,54],36:[1,55],37:24,42:63,43:[1,46],44:[1,48],45:[1,49],46:[1,30],49:31,50:[1,60],51:[1,61],57:50,58:51,60:37,62:26,63:27,64:28,75:[1,70],78:[1,45],82:[1,29],87:[1,58],88:[1,59],89:[1,57],95:[1,39],99:[1,47],100:[1,40],103:[1,56],104:[2,6],105:41,106:[1,65],108:[1,66],109:42,110:[1,67],111:43,112:[1,68],113:69,121:[1,44],126:38,127:[1,64],129:[1,32],130:[1,33],131:[1,34],132:[1,35],133:[1,36]},{1:[2,3]},{1:[2,25],6:[2,25],26:[2,25],27:[2,25],48:[2,25],53:[2,25],56:[2,25],71:[2,25],77:[2,25],85:[2,25],90:[2,25],92:[2,25],97:[2,25],98:[2,25],104:[2,25],106:[2,25],107:[2,25],108:[2,25],112:[2,25],120:[2,25],123:[2,25],125:[2,25],128:[2,25],130:[2,25],131:[2,25],134:[2,25],135:[2,25],136:[2,25],137:[2,25],138:[2,25],139:[2,25]},{6:[1,74],27:[1,175]},{1:[2,190],6:[2,190],26:[2,190],27:[2,190],48:[2,190],53:[2,190],56:[2,190],71:[2,190],77:[2,190],85:[2,190],90:[2,190],92:[2,190],104:[2,190],106:[2,190],107:[2,190],108:[2,190],112:[2,190],120:[2,190],128:[2,190],130:[2,190],131:[2,190],134:[2,190],135:[2,190],136:[2,190],137:[2,190],138:[2,190],139:[2,190]},{8:176,9:118,10:20,11:21,12:22,13:[1,23],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:19,28:62,29:[1,73],30:52,31:[1,71],32:[1,72],33:25,34:[1,53],35:[1,54],36:[1,55],37:24,42:63,43:[1,46],44:[1,48],45:[1,49],46:[1,30],49:31,50:[1,60],51:[1,61],57:50,58:51,60:37,62:26,63:27,64:28,75:[1,70],78:[1,45],82:[1,29],87:[1,58],88:[1,59],89:[1,57],95:[1,39],99:[1,47],100:[1,40],103:[1,56],105:41,106:[1,65],108:[1,66],109:42,110:[1,67],111:43,112:[1,68],113:69,121:[1,44],126:38,127:[1,64],129:[1,32],130:[1,33],131:[1,34],132:[1,35],133:[1,36]},{8:177,9:118,10:20,11:21,12:22,13:[1,23],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:19,28:62,29:[1,73],30:52,31:[1,71],32:[1,72],33:25,34:[1,53],35:[1,54],36:[1,55],37:24,42:63,43:[1,46],44:[1,48],45:[1,49],46:[1,30],49:31,50:[1,60],51:[1,61],57:50,58:51,60:37,62:26,63:27,64:28,75:[1,70],78:[1,45],82:[1,29],87:[1,58],88:[1,59],89:[1,57],95:[1,39],99:[1,47],100:[1,40],103:[1,56],105:41,106:[1,65],108:[1,66],109:42,110:[1,67],111:43,112:[1,68],113:69,121:[1,44],126:38,127:[1,64],129:[1,32],130:[1,33],131:[1,34],132:[1,35],133:[1,36]},{8:178,9:118,10:20,11:21,12:22,13:[1,23],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:19,28:62,29:[1,73],30:52,31:[1,71],32:[1,72],33:25,34:[1,53],35:[1,54],36:[1,55],37:24,42:63,43:[1,46],44:[1,48],45:[1,49],46:[1,30],49:31,50:[1,60],51:[1,61],57:50,58:51,60:37,62:26,63:27,64:28,75:[1,70],78:[1,45],82:[1,29],87:[1,58],88:[1,59],89:[1,57],95:[1,39],99:[1,47],100:[1,40],103:[1,56],105:41,106:[1,65],108:[1,66],109:42,110:[1,67],111:43,112:[1,68],113:69,121:[1,44],126:38,127:[1,64],129:[1,32],130:[1,33],131:[1,34],132:[1,35],133:[1,36]},{8:179,9:118,10:20,11:21,12:22,13:[1,23],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:19,28:62,29:[1,73],30:52,31:[1,71],32:[1,72],33:25,34:[1,53],35:[1,54],36:[1,55],37:24,42:63,43:[1,46],44:[1,48],45:[1,49],46:[1,30],49:31,50:[1,60],51:[1,61],57:50,58:51,60:37,62:26,63:27,64:28,75:[1,70],78:[1,45],82:[1,29],87:[1,58],88:[1,59],89:[1,57],95:[1,39],99:[1,47],100:[1,40],103:[1,56],105:41,106:[1,65],108:[1,66],109:42,110:[1,67],111:43,112:[1,68],113:69,121:[1,44],126:38,127:[1,64],129:[1,32],130:[1,33],131:[1,34],132:[1,35],133:[1,36]},{8:180,9:118,10:20,11:21,12:22,13:[1,23],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:19,28:62,29:[1,73],30:52,31:[1,71],32:[1,72],33:25,34:[1,53],35:[1,54],36:[1,55],37:24,42:63,43:[1,46],44:[1,48],45:[1,49],46:[1,30],49:31,50:[1,60],51:[1,61],57:50,58:51,60:37,62:26,63:27,64:28,75:[1,70],78:[1,45],82:[1,29],87:[1,58],88:[1,59],89:[1,57],95:[1,39],99:[1,47],100:[1,40],103:[1,56],105:41,106:[1,65],108:[1,66],109:42,110:[1,67],111:43,112:[1,68],113:69,121:[1,44],126:38,127:[1,64],129:[1,32],130:[1,33],131:[1,34],132:[1,35],133:[1,36]},{8:181,9:118,10:20,11:21,12:22,13:[1,23],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:19,28:62,29:[1,73],30:52,31:[1,71],32:[1,72],33:25,34:[1,53],35:[1,54],36:[1,55],37:24,42:63,43:[1,46],44:[1,48],45:[1,49],46:[1,30],49:31,50:[1,60],51:[1,61],57:50,58:51,60:37,62:26,63:27,64:28,75:[1,70],78:[1,45],82:[1,29],87:[1,58],88:[1,59],89:[1,57],95:[1,39],99:[1,47],100:[1,40],103:[1,56],105:41,106:[1,65],108:[1,66],109:42,110:[1,67],111:43,112:[1,68],113:69,121:[1,44],126:38,127:[1,64],129:[1,32],130:[1,33],131:[1,34],132:[1,35],133:[1,36]},{8:182,9:118,10:20,11:21,12:22,13:[1,23],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:19,28:62,29:[1,73],30:52,31:[1,71],32:[1,72],33:25,34:[1,53],35:[1,54],36:[1,55],37:24,42:63,43:[1,46],44:[1,48],45:[1,49],46:[1,30],49:31,50:[1,60],51:[1,61],57:50,58:51,60:37,62:26,63:27,64:28,75:[1,70],78:[1,45],82:[1,29],87:[1,58],88:[1,59],89:[1,57],95:[1,39],99:[1,47],100:[1,40],103:[1,56],105:41,106:[1,65],108:[1,66],109:42,110:[1,67],111:43,112:[1,68],113:69,121:[1,44],126:38,127:[1,64],129:[1,32],130:[1,33],131:[1,34],132:[1,35],133:[1,36]},{8:183,9:118,10:20,11:21,12:22,13:[1,23],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:19,28:62,29:[1,73],30:52,31:[1,71],32:[1,72],33:25,34:[1,53],35:[1,54],36:[1,55],37:24,42:63,43:[1,46],44:[1,48],45:[1,49],46:[1,30],49:31,50:[1,60],51:[1,61],57:50,58:51,60:37,62:26,63:27,64:28,75:[1,70],78:[1,45],82:[1,29],87:[1,58],88:[1,59],89:[1,57],95:[1,39],99:[1,47],100:[1,40],103:[1,56],105:41,106:[1,65],108:[1,66],109:42,110:[1,67],111:43,112:[1,68],113:69,121:[1,44],126:38,127:[1,64],129:[1,32],130:[1,33],131:[1,34],132:[1,35],133:[1,36]},{1:[2,146],6:[2,146],26:[2,146],27:[2,146],48:[2,146],53:[2,146],56:[2,146],71:[2,146],77:[2,146],85:[2,146],90:[2,146],92:[2,146],104:[2,146],106:[2,146],107:[2,146],108:[2,146],112:[2,146],120:[2,146],128:[2,146],130:[2,146],131:[2,146],134:[2,146],135:[2,146],136:[2,146],137:[2,146],138:[2,146],139:[2,146]},{1:[2,151],6:[2,151],26:[2,151],27:[2,151],48:[2,151],53:[2,151],56:[2,151],71:[2,151],77:[2,151],85:[2,151],90:[2,151],92:[2,151],104:[2,151],106:[2,151],107:[2,151],108:[2,151],112:[2,151],120:[2,151],128:[2,151],130:[2,151],131:[2,151],134:[2,151],135:[2,151],136:[2,151],137:[2,151],138:[2,151],139:[2,151]},{8:184,9:118,10:20,11:21,12:22,13:[1,23],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:19,28:62,29:[1,73],30:52,31:[1,71],32:[1,72],33:25,34:[1,53],35:[1,54],36:[1,55],37:24,42:63,43:[1,46],44:[1,48],45:[1,49],46:[1,30],49:31,50:[1,60],51:[1,61],57:50,58:51,60:37,62:26,63:27,64:28,75:[1,70],78:[1,45],82:[1,29],87:[1,58],88:[1,59],89:[1,57],95:[1,39],99:[1,47],100:[1,40],103:[1,56],105:41,106:[1,65],108:[1,66],109:42,110:[1,67],111:43,112:[1,68],113:69,121:[1,44],126:38,127:[1,64],129:[1,32],130:[1,33],131:[1,34],132:[1,35],133:[1,36]},{1:[2,145],6:[2,145],26:[2,145],27:[2,145],48:[2,145],53:[2,145],56:[2,145],71:[2,145],77:[2,145],85:[2,145],90:[2,145],92:[2,145],104:[2,145],106:[2,145],107:[2,145],108:[2,145],112:[2,145],120:[2,145],128:[2,145],130:[2,145],131:[2,145],134:[2,145],135:[2,145],136:[2,145],137:[2,145],138:[2,145],139:[2,145]},{1:[2,150],6:[2,150],26:[2,150],27:[2,150],48:[2,150],53:[2,150],56:[2,150],71:[2,150],77:[2,150],85:[2,150],90:[2,150],92:[2,150],104:[2,150],106:[2,150],107:[2,150],108:[2,150],112:[2,150],120:[2,150],128:[2,150],130:[2,150],131:[2,150],134:[2,150],135:[2,150],136:[2,150],137:[2,150],138:[2,150],139:[2,150]},{81:185,84:[1,106]},{1:[2,65],6:[2,65],26:[2,65],27:[2,65],38:[2,65],48:[2,65],53:[2,65],56:[2,65],65:[2,65],66:[2,65],67:[2,65],69:[2,65],71:[2,65],72:[2,65],73:[2,65],77:[2,65],79:[2,65],83:[2,65],84:[2,65],85:[2,65],90:[2,65],92:[2,65],104:[2,65],106:[2,65],107:[2,65],108:[2,65],112:[2,65],120:[2,65],128:[2,65],130:[2,65],131:[2,65],132:[2,65],133:[2,65],134:[2,65],135:[2,65],136:[2,65],137:[2,65],138:[2,65],139:[2,65],140:[2,65]},{84:[2,105]},{28:186,29:[1,73]},{28:187,29:[1,73]},{1:[2,79],6:[2,79],26:[2,79],27:[2,79],28:188,29:[1,73],38:[2,79],48:[2,79],53:[2,79],56:[2,79],65:[2,79],66:[2,79],67:[2,79],69:[2,79],71:[2,79],72:[2,79],73:[2,79],77:[2,79],79:[2,79],83:[2,79],84:[2,79],85:[2,79],90:[2,79],92:[2,79],104:[2,79],106:[2,79],107:[2,79],108:[2,79],112:[2,79],120:[2,79],128:[2,79],130:[2,79],131:[2,79],132:[2,79],133:[2,79],134:[2,79],135:[2,79],136:[2,79],137:[2,79],138:[2,79],139:[2,79],140:[2,79]},{1:[2,80],6:[2,80],26:[2,80],27:[2,80],38:[2,80],48:[2,80],53:[2,80],56:[2,80],65:[2,80],66:[2,80],67:[2,80],69:[2,80],71:[2,80],72:[2,80],73:[2,80],77:[2,80],79:[2,80],83:[2,80],84:[2,80],85:[2,80],90:[2,80],92:[2,80],104:[2,80],106:[2,80],107:[2,80],108:[2,80],112:[2,80],120:[2,80],128:[2,80],130:[2,80],131:[2,80],132:[2,80],133:[2,80],134:[2,80],135:[2,80],136:[2,80],137:[2,80],138:[2,80],139:[2,80],140:[2,80]},{8:190,9:118,10:20,11:21,12:22,13:[1,23],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:19,28:62,29:[1,73],30:52,31:[1,71],32:[1,72],33:25,34:[1,53],35:[1,54],36:[1,55],37:24,42:63,43:[1,46],44:[1,48],45:[1,49],46:[1,30],49:31,50:[1,60],51:[1,61],56:[1,194],57:50,58:51,60:37,62:26,63:27,64:28,70:189,74:191,75:[1,70],78:[1,45],82:[1,29],87:[1,58],88:[1,59],89:[1,57],91:192,92:[1,193],95:[1,39],99:[1,47],100:[1,40],103:[1,56],105:41,106:[1,65],108:[1,66],109:42,110:[1,67],111:43,112:[1,68],113:69,121:[1,44],126:38,127:[1,64],129:[1,32],130:[1,33],131:[1,34],132:[1,35],133:[1,36]},{68:195,69:[1,99],72:[1,100],73:[1,101]},{68:196,69:[1,99],72:[1,100],73:[1,101]},{81:197,84:[1,106]},{1:[2,66],6:[2,66],26:[2,66],27:[2,66],38:[2,66],48:[2,66],53:[2,66],56:[2,66],65:[2,66],66:[2,66],67:[2,66],69:[2,66],71:[2,66],72:[2,66],73:[2,66],77:[2,66],79:[2,66],83:[2,66],84:[2,66],85:[2,66],90:[2,66],92:[2,66],104:[2,66],106:[2,66],107:[2,66],108:[2,66],112:[2,66],120:[2,66],128:[2,66],130:[2,66],131:[2,66],132:[2,66],133:[2,66],134:[2,66],135:[2,66],136:[2,66],137:[2,66],138:[2,66],139:[2,66],140:[2,66]},{8:198,9:118,10:20,11:21,12:22,13:[1,23],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:19,26:[1,199],28:62,29:[1,73],30:52,31:[1,71],32:[1,72],33:25,34:[1,53],35:[1,54],36:[1,55],37:24,42:63,43:[1,46],44:[1,48],45:[1,49],46:[1,30],49:31,50:[1,60],51:[1,61],57:50,58:51,60:37,62:26,63:27,64:28,75:[1,70],78:[1,45],82:[1,29],87:[1,58],88:[1,59],89:[1,57],95:[1,39],99:[1,47],100:[1,40],103:[1,56],105:41,106:[1,65],108:[1,66],109:42,110:[1,67],111:43,112:[1,68],113:69,121:[1,44],126:38,127:[1,64],129:[1,32],130:[1,33],131:[1,34],132:[1,35],133:[1,36]},{1:[2,103],6:[2,103],26:[2,103],27:[2,103],48:[2,103],53:[2,103],56:[2,103],65:[2,103],66:[2,103],67:[2,103],69:[2,103],71:[2,103],72:[2,103],73:[2,103],77:[2,103],83:[2,103],84:[2,103],85:[2,103],90:[2,103],92:[2,103],104:[2,103],106:[2,103],107:[2,103],108:[2,103],112:[2,103],120:[2,103],128:[2,103],130:[2,103],131:[2,103],134:[2,103],135:[2,103],136:[2,103],137:[2,103],138:[2,103],139:[2,103]},{8:202,9:118,10:20,11:21,12:22,13:[1,23],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:19,26:[1,149],28:62,29:[1,73],30:52,31:[1,71],32:[1,72],33:25,34:[1,53],35:[1,54],36:[1,55],37:24,42:63,43:[1,46],44:[1,48],45:[1,49],46:[1,30],49:31,50:[1,60],51:[1,61],57:50,58:51,59:150,60:37,62:26,63:27,64:28,75:[1,70],78:[1,45],82:[1,29],85:[1,200],86:201,87:[1,58],88:[1,59],89:[1,57],93:148,95:[1,39],99:[1,47],100:[1,40],103:[1,56],105:41,106:[1,65],108:[1,66],109:42,110:[1,67],111:43,112:[1,68],113:69,121:[1,44],126:38,127:[1,64],129:[1,32],130:[1,33],131:[1,34],132:[1,35],133:[1,36]},{48:[1,203],53:[1,204]},{48:[2,54],53:[2,54]},{38:[1,206],48:[2,56],53:[2,56],56:[1,205]},{38:[2,59],48:[2,59],53:[2,59],56:[2,59]},{38:[2,60],48:[2,60],53:[2,60],56:[2,60]},{38:[2,61],48:[2,61],53:[2,61],56:[2,61]},{38:[2,62],48:[2,62],53:[2,62],56:[2,62]},{28:151,29:[1,73]},{8:202,9:118,10:20,11:21,12:22,13:[1,23],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:19,26:[1,149],28:62,29:[1,73],30:52,31:[1,71],32:[1,72],33:25,34:[1,53],35:[1,54],36:[1,55],37:24,42:63,43:[1,46],44:[1,48],45:[1,49],46:[1,30],49:31,50:[1,60],51:[1,61],57:50,58:51,59:150,60:37,62:26,63:27,64:28,75:[1,70],78:[1,45],82:[1,29],86:147,87:[1,58],88:[1,59],89:[1,57],90:[1,146],93:148,95:[1,39],99:[1,47],100:[1,40],103:[1,56],105:41,106:[1,65],108:[1,66],109:42,110:[1,67],111:43,112:[1,68],113:69,121:[1,44],126:38,127:[1,64],129:[1,32],130:[1,33],131:[1,34],132:[1,35],133:[1,36]},{1:[2,48],6:[2,48],26:[2,48],27:[2,48],48:[2,48],53:[2,48],56:[2,48],71:[2,48],77:[2,48],85:[2,48],90:[2,48],92:[2,48],104:[2,48],106:[2,48],107:[2,48],108:[2,48],112:[2,48],120:[2,48],128:[2,48],130:[2,48],131:[2,48],134:[2,48],135:[2,48],136:[2,48],137:[2,48],138:[2,48],139:[2,48]},{1:[2,183],6:[2,183],26:[2,183],27:[2,183],48:[2,183],53:[2,183],56:[2,183],71:[2,183],77:[2,183],85:[2,183],90:[2,183],92:[2,183],104:[2,183],105:87,106:[2,183],107:[2,183],108:[2,183],111:88,112:[2,183],113:69,120:[2,183],128:[2,183],130:[2,183],131:[2,183],134:[1,78],135:[2,183],136:[2,183],137:[2,183],138:[2,183],139:[2,183]},{105:90,106:[1,65],108:[1,66],111:91,112:[1,68],113:69,128:[1,89]},{1:[2,184],6:[2,184],26:[2,184],27:[2,184],48:[2,184],53:[2,184],56:[2,184],71:[2,184],77:[2,184],85:[2,184],90:[2,184],92:[2,184],104:[2,184],105:87,106:[2,184],107:[2,184],108:[2,184],111:88,112:[2,184],113:69,120:[2,184],128:[2,184],130:[2,184],131:[2,184],134:[1,78],135:[2,184],136:[2,184],137:[2,184],138:[2,184],139:[2,184]},{1:[2,185],6:[2,185],26:[2,185],27:[2,185],48:[2,185],53:[2,185],56:[2,185],71:[2,185],77:[2,185],85:[2,185],90:[2,185],92:[2,185],104:[2,185],105:87,106:[2,185],107:[2,185],108:[2,185],111:88,112:[2,185],113:69,120:[2,185],128:[2,185],130:[2,185],131:[2,185],134:[1,78],135:[2,185],136:[2,185],137:[2,185],138:[2,185],139:[2,185]},{1:[2,186],6:[2,186],26:[2,186],27:[2,186],48:[2,186],53:[2,186],56:[2,186],65:[2,68],66:[2,68],67:[2,68],69:[2,68],71:[2,186],72:[2,68],73:[2,68],77:[2,186],83:[2,68],84:[2,68],85:[2,186],90:[2,186],92:[2,186],104:[2,186],106:[2,186],107:[2,186],108:[2,186],112:[2,186],120:[2,186],128:[2,186],130:[2,186],131:[2,186],134:[2,186],135:[2,186],136:[2,186],137:[2,186],138:[2,186],139:[2,186]},{61:93,65:[1,95],66:[1,96],67:[1,97],68:98,69:[1,99],72:[1,100],73:[1,101],80:92,83:[1,94],84:[2,104]},{61:103,65:[1,95],66:[1,96],67:[1,97],68:98,69:[1,99],72:[1,100],73:[1,101],80:102,83:[1,94],84:[2,104]},{1:[2,71],6:[2,71],26:[2,71],27:[2,71],48:[2,71],53:[2,71],56:[2,71],65:[2,71],66:[2,71],67:[2,71],69:[2,71],71:[2,71],72:[2,71],73:[2,71],77:[2,71],83:[2,71],84:[2,71],85:[2,71],90:[2,71],92:[2,71],104:[2,71],106:[2,71],107:[2,71],108:[2,71],112:[2,71],120:[2,71],128:[2,71],130:[2,71],131:[2,71],134:[2,71],135:[2,71],136:[2,71],137:[2,71],138:[2,71],139:[2,71]},{1:[2,187],6:[2,187],26:[2,187],27:[2,187],48:[2,187],53:[2,187],56:[2,187],65:[2,68],66:[2,68],67:[2,68],69:[2,68],71:[2,187],72:[2,68],73:[2,68],77:[2,187],83:[2,68],84:[2,68],85:[2,187],90:[2,187],92:[2,187],104:[2,187],106:[2,187],107:[2,187],108:[2,187],112:[2,187],120:[2,187],128:[2,187],130:[2,187],131:[2,187],134:[2,187],135:[2,187],136:[2,187],137:[2,187],138:[2,187],139:[2,187]},{1:[2,188],6:[2,188],26:[2,188],27:[2,188],48:[2,188],53:[2,188],56:[2,188],71:[2,188],77:[2,188],85:[2,188],90:[2,188],92:[2,188],104:[2,188],106:[2,188],107:[2,188],108:[2,188],112:[2,188],120:[2,188],128:[2,188],130:[2,188],131:[2,188],134:[2,188],135:[2,188],136:[2,188],137:[2,188],138:[2,188],139:[2,188]},{1:[2,189],6:[2,189],26:[2,189],27:[2,189],48:[2,189],53:[2,189],56:[2,189],71:[2,189],77:[2,189],85:[2,189],90:[2,189],92:[2,189],104:[2,189],106:[2,189],107:[2,189],108:[2,189],112:[2,189],120:[2,189],128:[2,189],130:[2,189],131:[2,189],134:[2,189],135:[2,189],136:[2,189],137:[2,189],138:[2,189],139:[2,189]},{8:207,9:118,10:20,11:21,12:22,13:[1,23],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:19,26:[1,208],28:62,29:[1,73],30:52,31:[1,71],32:[1,72],33:25,34:[1,53],35:[1,54],36:[1,55],37:24,42:63,43:[1,46],44:[1,48],45:[1,49],46:[1,30],49:31,50:[1,60],51:[1,61],57:50,58:51,60:37,62:26,63:27,64:28,75:[1,70],78:[1,45],82:[1,29],87:[1,58],88:[1,59],89:[1,57],95:[1,39],99:[1,47],100:[1,40],103:[1,56],105:41,106:[1,65],108:[1,66],109:42,110:[1,67],111:43,112:[1,68],113:69,121:[1,44],126:38,127:[1,64],129:[1,32],130:[1,33],131:[1,34],132:[1,35],133:[1,36]},{8:209,9:118,10:20,11:21,12:22,13:[1,23],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:19,28:62,29:[1,73],30:52,31:[1,71],32:[1,72],33:25,34:[1,53],35:[1,54],36:[1,55],37:24,42:63,43:[1,46],44:[1,48],45:[1,49],46:[1,30],49:31,50:[1,60],51:[1,61],57:50,58:51,60:37,62:26,63:27,64:28,75:[1,70],78:[1,45],82:[1,29],87:[1,58],88:[1,59],89:[1,57],95:[1,39],99:[1,47],100:[1,40],103:[1,56],105:41,106:[1,65],108:[1,66],109:42,110:[1,67],111:43,112:[1,68],113:69,121:[1,44],126:38,127:[1,64],129:[1,32],130:[1,33],131:[1,34],132:[1,35],133:[1,36]},{5:210,26:[1,5],127:[1,211]},{1:[2,128],6:[2,128],26:[2,128],27:[2,128],48:[2,128],53:[2,128],56:[2,128],71:[2,128],77:[2,128],85:[2,128],90:[2,128],92:[2,128],96:212,97:[1,213],98:[1,214],104:[2,128],106:[2,128],107:[2,128],108:[2,128],112:[2,128],120:[2,128],128:[2,128],130:[2,128],131:[2,128],134:[2,128],135:[2,128],136:[2,128],137:[2,128],138:[2,128],139:[2,128]},{1:[2,134],6:[2,134],26:[2,134],27:[2,134],48:[2,134],53:[2,134],56:[2,134],65:[1,216],71:[2,134],77:[2,134],85:[2,134],90:[2,134],92:[2,134],102:[1,215],104:[2,134],106:[2,134],107:[2,134],108:[2,134],112:[2,134],120:[2,134],128:[2,134],130:[2,134],131:[2,134],134:[2,134],135:[2,134],136:[2,134],137:[2,134],138:[2,134],139:[2,134]},{1:[2,136],6:[2,136],26:[2,136],27:[2,136],48:[2,136],53:[2,136],56:[2,136],65:[2,136],71:[2,136],77:[2,136],85:[2,136],90:[2,136],92:[2,136],102:[2,136],104:[2,136],106:[2,136],107:[2,136],108:[2,136],112:[2,136],120:[2,136],128:[2,136],130:[2,136],131:[2,136],134:[2,136],135:[2,136],136:[2,136],137:[2,136],138:[2,136],139:[2,136]},{1:[2,144],6:[2,144],26:[2,144],27:[2,144],48:[2,144],53:[2,144],56:[2,144],71:[2,144],77:[2,144],85:[2,144],90:[2,144],92:[2,144],104:[2,144],106:[2,144],107:[2,144],108:[2,144],112:[2,144],120:[2,144],128:[2,144],130:[2,144],131:[2,144],134:[2,144],135:[2,144],136:[2,144],137:[2,144],138:[2,144],139:[2,144]},{1:[2,152],6:[2,152],26:[2,152],27:[2,152],48:[2,152],53:[2,152],56:[2,152],71:[2,152],77:[2,152],85:[2,152],90:[2,152],92:[2,152],104:[2,152],106:[2,152],107:[2,152],108:[2,152],112:[2,152],120:[2,152],128:[2,152],130:[2,152],131:[2,152],134:[2,152],135:[2,152],136:[2,152],137:[2,152],138:[2,152],139:[2,152]},{26:[1,217],105:87,106:[1,65],108:[1,66],111:88,112:[1,68],113:69,128:[1,86],130:[1,80],131:[1,79],134:[1,78],135:[1,81],136:[1,82],137:[1,83],138:[1,84],139:[1,85]},{122:218,124:219,125:[1,220]},{1:[2,93],6:[2,93],26:[2,93],27:[2,93],48:[2,93],53:[2,93],56:[2,93],71:[2,93],77:[2,93],85:[2,93],90:[2,93],92:[2,93],104:[2,93],106:[2,93],107:[2,93],108:[2,93],112:[2,93],120:[2,93],128:[2,93],130:[2,93],131:[2,93],134:[2,93],135:[2,93],136:[2,93],137:[2,93],138:[2,93],139:[2,93]},{14:221,15:123,28:62,29:[1,73],30:52,31:[1,71],32:[1,72],33:25,34:[1,53],35:[1,54],36:[1,55],37:124,42:63,57:50,58:51,60:222,62:26,63:27,64:28,75:[1,70],82:[1,29],87:[1,58],88:[1,59],89:[1,57],103:[1,56]},{1:[2,96],5:223,6:[2,96],26:[1,5],27:[2,96],48:[2,96],53:[2,96],56:[2,96],65:[2,68],66:[2,68],67:[2,68],69:[2,68],71:[2,96],72:[2,68],73:[2,68],77:[2,96],79:[1,224],83:[2,68],84:[2,68],85:[2,96],90:[2,96],92:[2,96],104:[2,96],106:[2,96],107:[2,96],108:[2,96],112:[2,96],120:[2,96],128:[2,96],130:[2,96],131:[2,96],134:[2,96],135:[2,96],136:[2,96],137:[2,96],138:[2,96],139:[2,96]},{1:[2,43],6:[2,43],27:[2,43],104:[2,43],105:87,106:[2,43],108:[2,43],111:88,112:[2,43],113:69,128:[2,43],130:[1,80],131:[1,79],134:[1,78],135:[1,81],136:[1,82],137:[1,83],138:[1,84],139:[1,85]},{1:[2,133],6:[2,133],27:[2,133],104:[2,133],105:87,106:[2,133],108:[2,133],111:88,112:[2,133],113:69,128:[2,133],130:[1,80],131:[1,79],134:[1,78],135:[1,81],136:[1,82],137:[1,83],138:[1,84],139:[1,85]},{6:[1,74],104:[1,225]},{4:226,7:4,8:6,9:7,10:20,11:21,12:22,13:[1,23],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:19,28:62,29:[1,73],30:52,31:[1,71],32:[1,72],33:25,34:[1,53],35:[1,54],36:[1,55],37:24,42:63,43:[1,46],44:[1,48],45:[1,49],46:[1,30],49:31,50:[1,60],51:[1,61],57:50,58:51,60:37,62:26,63:27,64:28,75:[1,70],78:[1,45],82:[1,29],87:[1,58],88:[1,59],89:[1,57],95:[1,39],99:[1,47],100:[1,40],103:[1,56],105:41,106:[1,65],108:[1,66],109:42,110:[1,67],111:43,112:[1,68],113:69,121:[1,44],126:38,127:[1,64],129:[1,32],130:[1,33],131:[1,34],132:[1,35],133:[1,36]},{6:[2,124],26:[2,124],53:[2,124],56:[1,228],90:[2,124],91:227,92:[1,193],105:87,106:[1,65],108:[1,66],111:88,112:[1,68],113:69,128:[1,86],130:[1,80],131:[1,79],134:[1,78],135:[1,81],136:[1,82],137:[1,83],138:[1,84],139:[1,85]},{1:[2,111],6:[2,111],26:[2,111],27:[2,111],38:[2,111],48:[2,111],53:[2,111],56:[2,111],65:[2,111],66:[2,111],67:[2,111],69:[2,111],71:[2,111],72:[2,111],73:[2,111],77:[2,111],83:[2,111],84:[2,111],85:[2,111],90:[2,111],92:[2,111],104:[2,111],106:[2,111],107:[2,111],108:[2,111],112:[2,111],118:[2,111],119:[2,111],120:[2,111],128:[2,111],130:[2,111],131:[2,111],134:[2,111],135:[2,111],136:[2,111],137:[2,111],138:[2,111],139:[2,111]},{6:[2,51],26:[2,51],52:229,53:[1,230],90:[2,51]},{6:[2,119],26:[2,119],27:[2,119],53:[2,119],85:[2,119],90:[2,119]},{8:202,9:118,10:20,11:21,12:22,13:[1,23],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:19,26:[1,149],28:62,29:[1,73],30:52,31:[1,71],32:[1,72],33:25,34:[1,53],35:[1,54],36:[1,55],37:24,42:63,43:[1,46],44:[1,48],45:[1,49],46:[1,30],49:31,50:[1,60],51:[1,61],57:50,58:51,59:150,60:37,62:26,63:27,64:28,75:[1,70],78:[1,45],82:[1,29],86:231,87:[1,58],88:[1,59],89:[1,57],93:148,95:[1,39],99:[1,47],100:[1,40],103:[1,56],105:41,106:[1,65],108:[1,66],109:42,110:[1,67],111:43,112:[1,68],113:69,121:[1,44],126:38,127:[1,64],129:[1,32],130:[1,33],131:[1,34],132:[1,35],133:[1,36]},{6:[2,125],26:[2,125],27:[2,125],53:[2,125],85:[2,125],90:[2,125]},{1:[2,110],6:[2,110],26:[2,110],27:[2,110],38:[2,110],41:[2,110],48:[2,110],53:[2,110],56:[2,110],65:[2,110],66:[2,110],67:[2,110],69:[2,110],71:[2,110],72:[2,110],73:[2,110],77:[2,110],79:[2,110],83:[2,110],84:[2,110],85:[2,110],90:[2,110],92:[2,110],104:[2,110],106:[2,110],107:[2,110],108:[2,110],112:[2,110],120:[2,110],128:[2,110],130:[2,110],131:[2,110],132:[2,110],133:[2,110],134:[2,110],135:[2,110],136:[2,110],137:[2,110],138:[2,110],139:[2,110],140:[2,110]},{5:232,26:[1,5],105:87,106:[1,65],108:[1,66],111:88,112:[1,68],113:69,128:[1,86],130:[1,80],131:[1,79],134:[1,78],135:[1,81],136:[1,82],137:[1,83],138:[1,84],139:[1,85]},{1:[2,140],6:[2,140],26:[2,140],27:[2,140],48:[2,140],53:[2,140],56:[2,140],71:[2,140],77:[2,140],85:[2,140],90:[2,140],92:[2,140],104:[2,140],105:87,106:[1,65],107:[1,233],108:[1,66],111:88,112:[1,68],113:69,120:[2,140],128:[2,140],130:[1,80],131:[1,79],134:[1,78],135:[1,81],136:[1,82],137:[1,83],138:[1,84],139:[1,85]},{1:[2,142],6:[2,142],26:[2,142],27:[2,142],48:[2,142],53:[2,142],56:[2,142],71:[2,142],77:[2,142],85:[2,142],90:[2,142],92:[2,142],104:[2,142],105:87,106:[1,65],107:[1,234],108:[1,66],111:88,112:[1,68],113:69,120:[2,142],128:[2,142],130:[1,80],131:[1,79],134:[1,78],135:[1,81],136:[1,82],137:[1,83],138:[1,84],139:[1,85]},{1:[2,148],6:[2,148],26:[2,148],27:[2,148],48:[2,148],53:[2,148],56:[2,148],71:[2,148],77:[2,148],85:[2,148],90:[2,148],92:[2,148],104:[2,148],106:[2,148],107:[2,148],108:[2,148],112:[2,148],120:[2,148],128:[2,148],130:[2,148],131:[2,148],134:[2,148],135:[2,148],136:[2,148],137:[2,148],138:[2,148],139:[2,148]},{1:[2,149],6:[2,149],26:[2,149],27:[2,149],48:[2,149],53:[2,149],56:[2,149],71:[2,149],77:[2,149],85:[2,149],90:[2,149],92:[2,149],104:[2,149],105:87,106:[1,65],107:[2,149],108:[1,66],111:88,112:[1,68],113:69,120:[2,149],128:[2,149],130:[1,80],131:[1,79],134:[1,78],135:[1,81],136:[1,82],137:[1,83],138:[1,84],139:[1,85]},{1:[2,153],6:[2,153],26:[2,153],27:[2,153],48:[2,153],53:[2,153],56:[2,153],71:[2,153],77:[2,153],85:[2,153],90:[2,153],92:[2,153],104:[2,153],106:[2,153],107:[2,153],108:[2,153],112:[2,153],120:[2,153],128:[2,153],130:[2,153],131:[2,153],134:[2,153],135:[2,153],136:[2,153],137:[2,153],138:[2,153],139:[2,153]},{118:[2,155],119:[2,155]},{28:161,29:[1,73],57:162,58:163,75:[1,70],89:[1,115],115:235,117:160},{53:[1,236],118:[2,160],119:[2,160]},{53:[2,157],118:[2,157],119:[2,157]},{53:[2,158],118:[2,158],119:[2,158]},{53:[2,159],118:[2,159],119:[2,159]},{1:[2,154],6:[2,154],26:[2,154],27:[2,154],48:[2,154],53:[2,154],56:[2,154],71:[2,154],77:[2,154],85:[2,154],90:[2,154],92:[2,154],104:[2,154],106:[2,154],107:[2,154],108:[2,154],112:[2,154],120:[2,154],128:[2,154],130:[2,154],131:[2,154],134:[2,154],135:[2,154],136:[2,154],137:[2,154],138:[2,154],139:[2,154]},{8:237,9:118,10:20,11:21,12:22,13:[1,23],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:19,28:62,29:[1,73],30:52,31:[1,71],32:[1,72],33:25,34:[1,53],35:[1,54],36:[1,55],37:24,42:63,43:[1,46],44:[1,48],45:[1,49],46:[1,30],49:31,50:[1,60],51:[1,61],57:50,58:51,60:37,62:26,63:27,64:28,75:[1,70],78:[1,45],82:[1,29],87:[1,58],88:[1,59],89:[1,57],95:[1,39],99:[1,47],100:[1,40],103:[1,56],105:41,106:[1,65],108:[1,66],109:42,110:[1,67],111:43,112:[1,68],113:69,121:[1,44],126:38,127:[1,64],129:[1,32],130:[1,33],131:[1,34],132:[1,35],133:[1,36]},{8:238,9:118,10:20,11:21,12:22,13:[1,23],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:19,28:62,29:[1,73],30:52,31:[1,71],32:[1,72],33:25,34:[1,53],35:[1,54],36:[1,55],37:24,42:63,43:[1,46],44:[1,48],45:[1,49],46:[1,30],49:31,50:[1,60],51:[1,61],57:50,58:51,60:37,62:26,63:27,64:28,75:[1,70],78:[1,45],82:[1,29],87:[1,58],88:[1,59],89:[1,57],95:[1,39],99:[1,47],100:[1,40],103:[1,56],105:41,106:[1,65],108:[1,66],109:42,110:[1,67],111:43,112:[1,68],113:69,121:[1,44],126:38,127:[1,64],129:[1,32],130:[1,33],131:[1,34],132:[1,35],133:[1,36]},{6:[2,51],26:[2,51],52:239,53:[1,240],77:[2,51]},{6:[2,88],26:[2,88],27:[2,88],53:[2,88],77:[2,88]},{6:[2,36],26:[2,36],27:[2,36],41:[1,241],53:[2,36],77:[2,36]},{6:[2,39],26:[2,39],27:[2,39],53:[2,39],77:[2,39]},{6:[2,40],26:[2,40],27:[2,40],41:[2,40],53:[2,40],77:[2,40]},{6:[2,41],26:[2,41],27:[2,41],41:[2,41],53:[2,41],77:[2,41]},{6:[2,42],26:[2,42],27:[2,42],41:[2,42],53:[2,42],77:[2,42]},{1:[2,5],6:[2,5],27:[2,5],104:[2,5]},{1:[2,26],6:[2,26],26:[2,26],27:[2,26],48:[2,26],53:[2,26],56:[2,26],71:[2,26],77:[2,26],85:[2,26],90:[2,26],92:[2,26],97:[2,26],98:[2,26],104:[2,26],106:[2,26],107:[2,26],108:[2,26],112:[2,26],120:[2,26],123:[2,26],125:[2,26],128:[2,26],130:[2,26],131:[2,26],134:[2,26],135:[2,26],136:[2,26],137:[2,26],138:[2,26],139:[2,26]},{1:[2,191],6:[2,191],26:[2,191],27:[2,191],48:[2,191],53:[2,191],56:[2,191],71:[2,191],77:[2,191],85:[2,191],90:[2,191],92:[2,191],104:[2,191],105:87,106:[2,191],107:[2,191],108:[2,191],111:88,112:[2,191],113:69,120:[2,191],128:[2,191],130:[2,191],131:[2,191],134:[1,78],135:[1,81],136:[2,191],137:[2,191],138:[2,191],139:[2,191]},{1:[2,192],6:[2,192],26:[2,192],27:[2,192],48:[2,192],53:[2,192],56:[2,192],71:[2,192],77:[2,192],85:[2,192],90:[2,192],92:[2,192],104:[2,192],105:87,106:[2,192],107:[2,192],108:[2,192],111:88,112:[2,192],113:69,120:[2,192],128:[2,192],130:[2,192],131:[2,192],134:[1,78],135:[1,81],136:[2,192],137:[2,192],138:[2,192],139:[2,192]},{1:[2,193],6:[2,193],26:[2,193],27:[2,193],48:[2,193],53:[2,193],56:[2,193],71:[2,193],77:[2,193],85:[2,193],90:[2,193],92:[2,193],104:[2,193],105:87,106:[2,193],107:[2,193],108:[2,193],111:88,112:[2,193],113:69,120:[2,193],128:[2,193],130:[2,193],131:[2,193],134:[1,78],135:[2,193],136:[2,193],137:[2,193],138:[2,193],139:[2,193]},{1:[2,194],6:[2,194],26:[2,194],27:[2,194],48:[2,194],53:[2,194],56:[2,194],71:[2,194],77:[2,194],85:[2,194],90:[2,194],92:[2,194],104:[2,194],105:87,106:[2,194],107:[2,194],108:[2,194],111:88,112:[2,194],113:69,120:[2,194],128:[2,194],130:[1,80],131:[1,79],134:[1,78],135:[1,81],136:[2,194],137:[2,194],138:[2,194],139:[2,194]},{1:[2,195],6:[2,195],26:[2,195],27:[2,195],48:[2,195],53:[2,195],56:[2,195],71:[2,195],77:[2,195],85:[2,195],90:[2,195],92:[2,195],104:[2,195],105:87,106:[2,195],107:[2,195],108:[2,195],111:88,112:[2,195],113:69,120:[2,195],128:[2,195],130:[1,80],131:[1,79],134:[1,78],135:[1,81],136:[1,82],137:[2,195],138:[2,195],139:[1,85]},{1:[2,196],6:[2,196],26:[2,196],27:[2,196],48:[2,196],53:[2,196],56:[2,196],71:[2,196],77:[2,196],85:[2,196],90:[2,196],92:[2,196],104:[2,196],105:87,106:[2,196],107:[2,196],108:[2,196],111:88,112:[2,196],113:69,120:[2,196],128:[2,196],130:[1,80],131:[1,79],134:[1,78],135:[1,81],136:[1,82],137:[1,83],138:[2,196],139:[1,85]},{1:[2,197],6:[2,197],26:[2,197],27:[2,197],48:[2,197],53:[2,197],56:[2,197],71:[2,197],77:[2,197],85:[2,197],90:[2,197],92:[2,197],104:[2,197],105:87,106:[2,197],107:[2,197],108:[2,197],111:88,112:[2,197],113:69,120:[2,197],128:[2,197],130:[1,80],131:[1,79],134:[1,78],135:[1,81],136:[1,82],137:[2,197],138:[2,197],139:[2,197]},{1:[2,182],6:[2,182],26:[2,182],27:[2,182],48:[2,182],53:[2,182],56:[2,182],71:[2,182],77:[2,182],85:[2,182],90:[2,182],92:[2,182],104:[2,182],105:87,106:[1,65],107:[2,182],108:[1,66],111:88,112:[1,68],113:69,120:[2,182],128:[1,86],130:[1,80],131:[1,79],134:[1,78],135:[1,81],136:[1,82],137:[1,83],138:[1,84],139:[1,85]},{1:[2,181],6:[2,181],26:[2,181],27:[2,181],48:[2,181],53:[2,181],56:[2,181],71:[2,181],77:[2,181],85:[2,181],90:[2,181],92:[2,181],104:[2,181],105:87,106:[1,65],107:[2,181],108:[1,66],111:88,112:[1,68],113:69,120:[2,181],128:[1,86],130:[1,80],131:[1,79],134:[1,78],135:[1,81],136:[1,82],137:[1,83],138:[1,84],139:[1,85]},{1:[2,100],6:[2,100],26:[2,100],27:[2,100],48:[2,100],53:[2,100],56:[2,100],65:[2,100],66:[2,100],67:[2,100],69:[2,100],71:[2,100],72:[2,100],73:[2,100],77:[2,100],83:[2,100],84:[2,100],85:[2,100],90:[2,100],92:[2,100],104:[2,100],106:[2,100],107:[2,100],108:[2,100],112:[2,100],120:[2,100],128:[2,100],130:[2,100],131:[2,100],134:[2,100],135:[2,100],136:[2,100],137:[2,100],138:[2,100],139:[2,100]},{1:[2,76],6:[2,76],26:[2,76],27:[2,76],38:[2,76],48:[2,76],53:[2,76],56:[2,76],65:[2,76],66:[2,76],67:[2,76],69:[2,76],71:[2,76],72:[2,76],73:[2,76],77:[2,76],79:[2,76],83:[2,76],84:[2,76],85:[2,76],90:[2,76],92:[2,76],104:[2,76],106:[2,76],107:[2,76],108:[2,76],112:[2,76],120:[2,76],128:[2,76],130:[2,76],131:[2,76],132:[2,76],133:[2,76],134:[2,76],135:[2,76],136:[2,76],137:[2,76],138:[2,76],139:[2,76],140:[2,76]},{1:[2,77],6:[2,77],26:[2,77],27:[2,77],38:[2,77],48:[2,77],53:[2,77],56:[2,77],65:[2,77],66:[2,77],67:[2,77],69:[2,77],71:[2,77],72:[2,77],73:[2,77],77:[2,77],79:[2,77],83:[2,77],84:[2,77],85:[2,77],90:[2,77],92:[2,77],104:[2,77],106:[2,77],107:[2,77],108:[2,77],112:[2,77],120:[2,77],128:[2,77],130:[2,77],131:[2,77],132:[2,77],133:[2,77],134:[2,77],135:[2,77],136:[2,77],137:[2,77],138:[2,77],139:[2,77],140:[2,77]},{1:[2,78],6:[2,78],26:[2,78],27:[2,78],38:[2,78],48:[2,78],53:[2,78],56:[2,78],65:[2,78],66:[2,78],67:[2,78],69:[2,78],71:[2,78],72:[2,78],73:[2,78],77:[2,78],79:[2,78],83:[2,78],84:[2,78],85:[2,78],90:[2,78],92:[2,78],104:[2,78],106:[2,78],107:[2,78],108:[2,78],112:[2,78],120:[2,78],128:[2,78],130:[2,78],131:[2,78],132:[2,78],133:[2,78],134:[2,78],135:[2,78],136:[2,78],137:[2,78],138:[2,78],139:[2,78],140:[2,78]},{71:[1,242]},{56:[1,194],71:[2,84],91:243,92:[1,193],105:87,106:[1,65],108:[1,66],111:88,112:[1,68],113:69,128:[1,86],130:[1,80],131:[1,79],134:[1,78],135:[1,81],136:[1,82],137:[1,83],138:[1,84],139:[1,85]},{71:[2,85]},{8:244,9:118,10:20,11:21,12:22,13:[1,23],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:19,28:62,29:[1,73],30:52,31:[1,71],32:[1,72],33:25,34:[1,53],35:[1,54],36:[1,55],37:24,42:63,43:[1,46],44:[1,48],45:[1,49],46:[1,30],49:31,50:[1,60],51:[1,61],57:50,58:51,60:37,62:26,63:27,64:28,75:[1,70],78:[1,45],82:[1,29],87:[1,58],88:[1,59],89:[1,57],95:[1,39],99:[1,47],100:[1,40],103:[1,56],105:41,106:[1,65],108:[1,66],109:42,110:[1,67],111:43,112:[1,68],113:69,121:[1,44],126:38,127:[1,64],129:[1,32],130:[1,33],131:[1,34],132:[1,35],133:[1,36]},{13:[2,113],29:[2,113],31:[2,113],32:[2,113],34:[2,113],35:[2,113],36:[2,113],43:[2,113],44:[2,113],45:[2,113],46:[2,113],50:[2,113],51:[2,113],71:[2,113],75:[2,113],78:[2,113],82:[2,113],87:[2,113],88:[2,113],89:[2,113],95:[2,113],99:[2,113],100:[2,113],103:[2,113],106:[2,113],108:[2,113],110:[2,113],112:[2,113],121:[2,113],127:[2,113],129:[2,113],130:[2,113],131:[2,113],132:[2,113],133:[2,113]},{13:[2,114],29:[2,114],31:[2,114],32:[2,114],34:[2,114],35:[2,114],36:[2,114],43:[2,114],44:[2,114],45:[2,114],46:[2,114],50:[2,114],51:[2,114],71:[2,114],75:[2,114],78:[2,114],82:[2,114],87:[2,114],88:[2,114],89:[2,114],95:[2,114],99:[2,114],100:[2,114],103:[2,114],106:[2,114],108:[2,114],110:[2,114],112:[2,114],121:[2,114],127:[2,114],129:[2,114],130:[2,114],131:[2,114],132:[2,114],133:[2,114]},{1:[2,82],6:[2,82],26:[2,82],27:[2,82],38:[2,82],48:[2,82],53:[2,82],56:[2,82],65:[2,82],66:[2,82],67:[2,82],69:[2,82],71:[2,82],72:[2,82],73:[2,82],77:[2,82],79:[2,82],83:[2,82],84:[2,82],85:[2,82],90:[2,82],92:[2,82],104:[2,82],106:[2,82],107:[2,82],108:[2,82],112:[2,82],120:[2,82],128:[2,82],130:[2,82],131:[2,82],132:[2,82],133:[2,82],134:[2,82],135:[2,82],136:[2,82],137:[2,82],138:[2,82],139:[2,82],140:[2,82]},{1:[2,83],6:[2,83],26:[2,83],27:[2,83],38:[2,83],48:[2,83],53:[2,83],56:[2,83],65:[2,83],66:[2,83],67:[2,83],69:[2,83],71:[2,83],72:[2,83],73:[2,83],77:[2,83],79:[2,83],83:[2,83],84:[2,83],85:[2,83],90:[2,83],92:[2,83],104:[2,83],106:[2,83],107:[2,83],108:[2,83],112:[2,83],120:[2,83],128:[2,83],130:[2,83],131:[2,83],132:[2,83],133:[2,83],134:[2,83],135:[2,83],136:[2,83],137:[2,83],138:[2,83],139:[2,83],140:[2,83]},{1:[2,101],6:[2,101],26:[2,101],27:[2,101],48:[2,101],53:[2,101],56:[2,101],65:[2,101],66:[2,101],67:[2,101],69:[2,101],71:[2,101],72:[2,101],73:[2,101],77:[2,101],83:[2,101],84:[2,101],85:[2,101],90:[2,101],92:[2,101],104:[2,101],106:[2,101],107:[2,101],108:[2,101],112:[2,101],120:[2,101],128:[2,101],130:[2,101],131:[2,101],134:[2,101],135:[2,101],136:[2,101],137:[2,101],138:[2,101],139:[2,101]},{1:[2,34],6:[2,34],26:[2,34],27:[2,34],48:[2,34],53:[2,34],56:[2,34],71:[2,34],77:[2,34],85:[2,34],90:[2,34],92:[2,34],104:[2,34],105:87,106:[2,34],107:[2,34],108:[2,34],111:88,112:[2,34],113:69,120:[2,34],128:[2,34],130:[1,80],131:[1,79],134:[1,78],135:[1,81],136:[1,82],137:[1,83],138:[1,84],139:[1,85]},{8:245,9:118,10:20,11:21,12:22,13:[1,23],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:19,28:62,29:[1,73],30:52,31:[1,71],32:[1,72],33:25,34:[1,53],35:[1,54],36:[1,55],37:24,42:63,43:[1,46],44:[1,48],45:[1,49],46:[1,30],49:31,50:[1,60],51:[1,61],57:50,58:51,60:37,62:26,63:27,64:28,75:[1,70],78:[1,45],82:[1,29],87:[1,58],88:[1,59],89:[1,57],95:[1,39],99:[1,47],100:[1,40],103:[1,56],105:41,106:[1,65],108:[1,66],109:42,110:[1,67],111:43,112:[1,68],113:69,121:[1,44],126:38,127:[1,64],129:[1,32],130:[1,33],131:[1,34],132:[1,35],133:[1,36]},{1:[2,106],6:[2,106],26:[2,106],27:[2,106],48:[2,106],53:[2,106],56:[2,106],65:[2,106],66:[2,106],67:[2,106],69:[2,106],71:[2,106],72:[2,106],73:[2,106],77:[2,106],83:[2,106],84:[2,106],85:[2,106],90:[2,106],92:[2,106],104:[2,106],106:[2,106],107:[2,106],108:[2,106],112:[2,106],120:[2,106],128:[2,106],130:[2,106],131:[2,106],134:[2,106],135:[2,106],136:[2,106],137:[2,106],138:[2,106],139:[2,106]},{6:[2,51],26:[2,51],52:246,53:[1,230],85:[2,51]},{6:[2,124],26:[2,124],27:[2,124],53:[2,124],56:[1,247],85:[2,124],90:[2,124],105:87,106:[1,65],108:[1,66],111:88,112:[1,68],113:69,128:[1,86],130:[1,80],131:[1,79],134:[1,78],135:[1,81],136:[1,82],137:[1,83],138:[1,84],139:[1,85]},{49:248,50:[1,60],51:[1,61]},{28:110,29:[1,73],42:111,54:249,55:109,57:112,58:113,75:[1,70],88:[1,114],89:[1,115]},{48:[2,57],53:[2,57]},{8:250,9:118,10:20,11:21,12:22,13:[1,23],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:19,28:62,29:[1,73],30:52,31:[1,71],32:[1,72],33:25,34:[1,53],35:[1,54],36:[1,55],37:24,42:63,43:[1,46],44:[1,48],45:[1,49],46:[1,30],49:31,50:[1,60],51:[1,61],57:50,58:51,60:37,62:26,63:27,64:28,75:[1,70],78:[1,45],82:[1,29],87:[1,58],88:[1,59],89:[1,57],95:[1,39],99:[1,47],100:[1,40],103:[1,56],105:41,106:[1,65],108:[1,66],109:42,110:[1,67],111:43,112:[1,68],113:69,121:[1,44],126:38,127:[1,64],129:[1,32],130:[1,33],131:[1,34],132:[1,35],133:[1,36]},{1:[2,198],6:[2,198],26:[2,198],27:[2,198],48:[2,198],53:[2,198],56:[2,198],71:[2,198],77:[2,198],85:[2,198],90:[2,198],92:[2,198],104:[2,198],105:87,106:[2,198],107:[2,198],108:[2,198],111:88,112:[2,198],113:69,120:[2,198],128:[2,198],130:[1,80],131:[1,79],134:[1,78],135:[1,81],136:[1,82],137:[1,83],138:[1,84],139:[1,85]},{8:251,9:118,10:20,11:21,12:22,13:[1,23],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:19,28:62,29:[1,73],30:52,31:[1,71],32:[1,72],33:25,34:[1,53],35:[1,54],36:[1,55],37:24,42:63,43:[1,46],44:[1,48],45:[1,49],46:[1,30],49:31,50:[1,60],51:[1,61],57:50,58:51,60:37,62:26,63:27,64:28,75:[1,70],78:[1,45],82:[1,29],87:[1,58],88:[1,59],89:[1,57],95:[1,39],99:[1,47],100:[1,40],103:[1,56],105:41,106:[1,65],108:[1,66],109:42,110:[1,67],111:43,112:[1,68],113:69,121:[1,44],126:38,127:[1,64],129:[1,32],130:[1,33],131:[1,34],132:[1,35],133:[1,36]},{1:[2,200],6:[2,200],26:[2,200],27:[2,200],48:[2,200],53:[2,200],56:[2,200],71:[2,200],77:[2,200],85:[2,200],90:[2,200],92:[2,200],104:[2,200],105:87,106:[2,200],107:[2,200],108:[2,200],111:88,112:[2,200],113:69,120:[2,200],128:[2,200],130:[1,80],131:[1,79],134:[1,78],135:[1,81],136:[1,82],137:[1,83],138:[1,84],139:[1,85]},{1:[2,180],6:[2,180],26:[2,180],27:[2,180],48:[2,180],53:[2,180],56:[2,180],71:[2,180],77:[2,180],85:[2,180],90:[2,180],92:[2,180],104:[2,180],106:[2,180],107:[2,180],108:[2,180],112:[2,180],120:[2,180],128:[2,180],130:[2,180],131:[2,180],134:[2,180],135:[2,180],136:[2,180],137:[2,180],138:[2,180],139:[2,180]},{8:252,9:118,10:20,11:21,12:22,13:[1,23],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:19,28:62,29:[1,73],30:52,31:[1,71],32:[1,72],33:25,34:[1,53],35:[1,54],36:[1,55],37:24,42:63,43:[1,46],44:[1,48],45:[1,49],46:[1,30],49:31,50:[1,60],51:[1,61],57:50,58:51,60:37,62:26,63:27,64:28,75:[1,70],78:[1,45],82:[1,29],87:[1,58],88:[1,59],89:[1,57],95:[1,39],99:[1,47],100:[1,40],103:[1,56],105:41,106:[1,65],108:[1,66],109:42,110:[1,67],111:43,112:[1,68],113:69,121:[1,44],126:38,127:[1,64],129:[1,32],130:[1,33],131:[1,34],132:[1,35],133:[1,36]},{1:[2,129],6:[2,129],26:[2,129],27:[2,129],48:[2,129],53:[2,129],56:[2,129],71:[2,129],77:[2,129],85:[2,129],90:[2,129],92:[2,129],97:[1,253],104:[2,129],106:[2,129],107:[2,129],108:[2,129],112:[2,129],120:[2,129],128:[2,129],130:[2,129],131:[2,129],134:[2,129],135:[2,129],136:[2,129],137:[2,129],138:[2,129],139:[2,129]},{5:254,26:[1,5]},{28:255,29:[1,73]},{29:[1,256]},{29:[1,257]},{122:258,124:219,125:[1,220]},{27:[1,259],123:[1,260],124:261,125:[1,220]},{27:[2,173],123:[2,173],125:[2,173]},{8:263,9:118,10:20,11:21,12:22,13:[1,23],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:19,28:62,29:[1,73],30:52,31:[1,71],32:[1,72],33:25,34:[1,53],35:[1,54],36:[1,55],37:24,42:63,43:[1,46],44:[1,48],45:[1,49],46:[1,30],49:31,50:[1,60],51:[1,61],57:50,58:51,60:37,62:26,63:27,64:28,75:[1,70],78:[1,45],82:[1,29],87:[1,58],88:[1,59],89:[1,57],94:262,95:[1,39],99:[1,47],100:[1,40],103:[1,56],105:41,106:[1,65],108:[1,66],109:42,110:[1,67],111:43,112:[1,68],113:69,121:[1,44],126:38,127:[1,64],129:[1,32],130:[1,33],131:[1,34],132:[1,35],133:[1,36]},{1:[2,94],5:264,6:[2,94],26:[1,5],27:[2,94],48:[2,94],53:[2,94],56:[2,94],61:93,65:[1,95],66:[1,96],67:[1,97],68:98,69:[1,99],71:[2,94],72:[1,100],73:[1,101],77:[2,94],80:92,83:[1,94],84:[2,104],85:[2,94],90:[2,94],92:[2,94],104:[2,94],106:[2,94],107:[2,94],108:[2,94],112:[2,94],120:[2,94],128:[2,94],130:[2,94],131:[2,94],134:[2,94],135:[2,94],136:[2,94],137:[2,94],138:[2,94],139:[2,94]},{1:[2,68],6:[2,68],26:[2,68],27:[2,68],48:[2,68],53:[2,68],56:[2,68],65:[2,68],66:[2,68],67:[2,68],69:[2,68],71:[2,68],72:[2,68],73:[2,68],77:[2,68],83:[2,68],84:[2,68],85:[2,68],90:[2,68],92:[2,68],104:[2,68],106:[2,68],107:[2,68],108:[2,68],112:[2,68],120:[2,68],128:[2,68],130:[2,68],131:[2,68],134:[2,68],135:[2,68],136:[2,68],137:[2,68],138:[2,68],139:[2,68]},{1:[2,97],6:[2,97],26:[2,97],27:[2,97],48:[2,97],53:[2,97],56:[2,97],71:[2,97],77:[2,97],85:[2,97],90:[2,97],92:[2,97],104:[2,97],106:[2,97],107:[2,97],108:[2,97],112:[2,97],120:[2,97],128:[2,97],130:[2,97],131:[2,97],134:[2,97],135:[2,97],136:[2,97],137:[2,97],138:[2,97],139:[2,97]},{14:265,15:123,28:62,29:[1,73],30:52,31:[1,71],32:[1,72],33:25,34:[1,53],35:[1,54],36:[1,55],37:124,42:63,57:50,58:51,60:222,62:26,63:27,64:28,75:[1,70],82:[1,29],87:[1,58],88:[1,59],89:[1,57],103:[1,56]},{1:[2,138],6:[2,138],26:[2,138],27:[2,138],48:[2,138],53:[2,138],56:[2,138],65:[2,138],66:[2,138],67:[2,138],69:[2,138],71:[2,138],72:[2,138],73:[2,138],77:[2,138],83:[2,138],84:[2,138],85:[2,138],90:[2,138],92:[2,138],104:[2,138],106:[2,138],107:[2,138],108:[2,138],112:[2,138],120:[2,138],128:[2,138],130:[2,138],131:[2,138],134:[2,138],135:[2,138],136:[2,138],137:[2,138],138:[2,138],139:[2,138]},{6:[1,74],27:[1,266]},{8:267,9:118,10:20,11:21,12:22,13:[1,23],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:19,28:62,29:[1,73],30:52,31:[1,71],32:[1,72],33:25,34:[1,53],35:[1,54],36:[1,55],37:24,42:63,43:[1,46],44:[1,48],45:[1,49],46:[1,30],49:31,50:[1,60],51:[1,61],57:50,58:51,60:37,62:26,63:27,64:28,75:[1,70],78:[1,45],82:[1,29],87:[1,58],88:[1,59],89:[1,57],95:[1,39],99:[1,47],100:[1,40],103:[1,56],105:41,106:[1,65],108:[1,66],109:42,110:[1,67],111:43,112:[1,68],113:69,121:[1,44],126:38,127:[1,64],129:[1,32],130:[1,33],131:[1,34],132:[1,35],133:[1,36]},{6:[2,63],13:[2,114],26:[2,63],29:[2,114],31:[2,114],32:[2,114],34:[2,114],35:[2,114],36:[2,114],43:[2,114],44:[2,114],45:[2,114],46:[2,114],50:[2,114],51:[2,114],53:[2,63],75:[2,114],78:[2,114],82:[2,114],87:[2,114],88:[2,114],89:[2,114],90:[2,63],95:[2,114],99:[2,114],100:[2,114],103:[2,114],106:[2,114],108:[2,114],110:[2,114],112:[2,114],121:[2,114],127:[2,114],129:[2,114],130:[2,114],131:[2,114],132:[2,114],133:[2,114]},{6:[1,269],26:[1,270],90:[1,268]},{6:[2,52],8:202,9:118,10:20,11:21,12:22,13:[1,23],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:19,26:[2,52],27:[2,52],28:62,29:[1,73],30:52,31:[1,71],32:[1,72],33:25,34:[1,53],35:[1,54],36:[1,55],37:24,42:63,43:[1,46],44:[1,48],45:[1,49],46:[1,30],49:31,50:[1,60],51:[1,61],57:50,58:51,59:150,60:37,62:26,63:27,64:28,75:[1,70],78:[1,45],82:[1,29],85:[2,52],87:[1,58],88:[1,59],89:[1,57],90:[2,52],93:271,95:[1,39],99:[1,47],100:[1,40],103:[1,56],105:41,106:[1,65],108:[1,66],109:42,110:[1,67],111:43,112:[1,68],113:69,121:[1,44],126:38,127:[1,64],129:[1,32],130:[1,33],131:[1,34],132:[1,35],133:[1,36]},{6:[2,51],26:[2,51],27:[2,51],52:272,53:[1,230]},{1:[2,177],6:[2,177],26:[2,177],27:[2,177],48:[2,177],53:[2,177],56:[2,177],71:[2,177],77:[2,177],85:[2,177],90:[2,177],92:[2,177],104:[2,177],106:[2,177],107:[2,177],108:[2,177],112:[2,177],120:[2,177],123:[2,177],128:[2,177],130:[2,177],131:[2,177],134:[2,177],135:[2,177],136:[2,177],137:[2,177],138:[2,177],139:[2,177]},{8:273,9:118,10:20,11:21,12:22,13:[1,23],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:19,28:62,29:[1,73],30:52,31:[1,71],32:[1,72],33:25,34:[1,53],35:[1,54],36:[1,55],37:24,42:63,43:[1,46],44:[1,48],45:[1,49],46:[1,30],49:31,50:[1,60],51:[1,61],57:50,58:51,60:37,62:26,63:27,64:28,75:[1,70],78:[1,45],82:[1,29],87:[1,58],88:[1,59],89:[1,57],95:[1,39],99:[1,47],100:[1,40],103:[1,56],105:41,106:[1,65],108:[1,66],109:42,110:[1,67],111:43,112:[1,68],113:69,121:[1,44],126:38,127:[1,64],129:[1,32],130:[1,33],131:[1,34],132:[1,35],133:[1,36]},{8:274,9:118,10:20,11:21,12:22,13:[1,23],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:19,28:62,29:[1,73],30:52,31:[1,71],32:[1,72],33:25,34:[1,53],35:[1,54],36:[1,55],37:24,42:63,43:[1,46],44:[1,48],45:[1,49],46:[1,30],49:31,50:[1,60],51:[1,61],57:50,58:51,60:37,62:26,63:27,64:28,75:[1,70],78:[1,45],82:[1,29],87:[1,58],88:[1,59],89:[1,57],95:[1,39],99:[1,47],100:[1,40],103:[1,56],105:41,106:[1,65],108:[1,66],109:42,110:[1,67],111:43,112:[1,68],113:69,121:[1,44],126:38,127:[1,64],129:[1,32],130:[1,33],131:[1,34],132:[1,35],133:[1,36]},{118:[2,156],119:[2,156]},{28:161,29:[1,73],57:162,58:163,75:[1,70],89:[1,115],117:275},{1:[2,162],6:[2,162],26:[2,162],27:[2,162],48:[2,162],53:[2,162],56:[2,162],71:[2,162],77:[2,162],85:[2,162],90:[2,162],92:[2,162],104:[2,162],105:87,106:[2,162],107:[1,276],108:[2,162],111:88,112:[2,162],113:69,120:[1,277],128:[2,162],130:[1,80],131:[1,79],134:[1,78],135:[1,81],136:[1,82],137:[1,83],138:[1,84],139:[1,85]},{1:[2,163],6:[2,163],26:[2,163],27:[2,163],48:[2,163],53:[2,163],56:[2,163],71:[2,163],77:[2,163],85:[2,163],90:[2,163],92:[2,163],104:[2,163],105:87,106:[2,163],107:[1,278],108:[2,163],111:88,112:[2,163],113:69,120:[2,163],128:[2,163],130:[1,80],131:[1,79],134:[1,78],135:[1,81],136:[1,82],137:[1,83],138:[1,84],139:[1,85]},{6:[1,280],26:[1,281],77:[1,279]},{6:[2,52],12:170,26:[2,52],27:[2,52],28:171,29:[1,73],30:172,31:[1,71],32:[1,72],39:282,40:169,42:173,44:[1,48],45:[1,49],77:[2,52],88:[1,114]},{8:283,9:118,10:20,11:21,12:22,13:[1,23],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:19,26:[1,284],28:62,29:[1,73],30:52,31:[1,71],32:[1,72],33:25,34:[1,53],35:[1,54],36:[1,55],37:24,42:63,43:[1,46],44:[1,48],45:[1,49],46:[1,30],49:31,50:[1,60],51:[1,61],57:50,58:51,60:37,62:26,63:27,64:28,75:[1,70],78:[1,45],82:[1,29],87:[1,58],88:[1,59],89:[1,57],95:[1,39],99:[1,47],100:[1,40],103:[1,56],105:41,106:[1,65],108:[1,66],109:42,110:[1,67],111:43,112:[1,68],113:69,121:[1,44],126:38,127:[1,64],129:[1,32],130:[1,33],131:[1,34],132:[1,35],133:[1,36]},{1:[2,81],6:[2,81],26:[2,81],27:[2,81],38:[2,81],48:[2,81],53:[2,81],56:[2,81],65:[2,81],66:[2,81],67:[2,81],69:[2,81],71:[2,81],72:[2,81],73:[2,81],77:[2,81],79:[2,81],83:[2,81],84:[2,81],85:[2,81],90:[2,81],92:[2,81],104:[2,81],106:[2,81],107:[2,81],108:[2,81],112:[2,81],120:[2,81],128:[2,81],130:[2,81],131:[2,81],132:[2,81],133:[2,81],134:[2,81],135:[2,81],136:[2,81],137:[2,81],138:[2,81],139:[2,81],140:[2,81]},{8:285,9:118,10:20,11:21,12:22,13:[1,23],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:19,28:62,29:[1,73],30:52,31:[1,71],32:[1,72],33:25,34:[1,53],35:[1,54],36:[1,55],37:24,42:63,43:[1,46],44:[1,48],45:[1,49],46:[1,30],49:31,50:[1,60],51:[1,61],57:50,58:51,60:37,62:26,63:27,64:28,71:[2,117],75:[1,70],78:[1,45],82:[1,29],87:[1,58],88:[1,59],89:[1,57],95:[1,39],99:[1,47],100:[1,40],103:[1,56],105:41,106:[1,65],108:[1,66],109:42,110:[1,67],111:43,112:[1,68],113:69,121:[1,44],126:38,127:[1,64],129:[1,32],130:[1,33],131:[1,34],132:[1,35],133:[1,36]},{71:[2,118],105:87,106:[1,65],108:[1,66],111:88,112:[1,68],113:69,128:[1,86],130:[1,80],131:[1,79],134:[1,78],135:[1,81],136:[1,82],137:[1,83],138:[1,84],139:[1,85]},{27:[1,286],105:87,106:[1,65],108:[1,66],111:88,112:[1,68],113:69,128:[1,86],130:[1,80],131:[1,79],134:[1,78],135:[1,81],136:[1,82],137:[1,83],138:[1,84],139:[1,85]},{6:[1,269],26:[1,270],85:[1,287]},{6:[2,63],26:[2,63],27:[2,63],53:[2,63],85:[2,63],90:[2,63]},{5:288,26:[1,5]},{48:[2,55],53:[2,55]},{48:[2,58],53:[2,58],105:87,106:[1,65],108:[1,66],111:88,112:[1,68],113:69,128:[1,86],130:[1,80],131:[1,79],134:[1,78],135:[1,81],136:[1,82],137:[1,83],138:[1,84],139:[1,85]},{27:[1,289],105:87,106:[1,65],108:[1,66],111:88,112:[1,68],113:69,128:[1,86],130:[1,80],131:[1,79],134:[1,78],135:[1,81],136:[1,82],137:[1,83],138:[1,84],139:[1,85]},{5:290,26:[1,5],105:87,106:[1,65],108:[1,66],111:88,112:[1,68],113:69,128:[1,86],130:[1,80],131:[1,79],134:[1,78],135:[1,81],136:[1,82],137:[1,83],138:[1,84],139:[1,85]},{5:291,26:[1,5]},{1:[2,130],6:[2,130],26:[2,130],27:[2,130],48:[2,130],53:[2,130],56:[2,130],71:[2,130],77:[2,130],85:[2,130],90:[2,130],92:[2,130],104:[2,130],106:[2,130],107:[2,130],108:[2,130],112:[2,130],120:[2,130],128:[2,130],130:[2,130],131:[2,130],134:[2,130],135:[2,130],136:[2,130],137:[2,130],138:[2,130],139:[2,130]},{5:292,26:[1,5]},{1:[2,135],6:[2,135],26:[2,135],27:[2,135],48:[2,135],53:[2,135],56:[2,135],71:[2,135],77:[2,135],85:[2,135],90:[2,135],92:[2,135],104:[2,135],106:[2,135],107:[2,135],108:[2,135],112:[2,135],120:[2,135],128:[2,135],130:[2,135],131:[2,135],134:[2,135],135:[2,135],136:[2,135],137:[2,135],138:[2,135],139:[2,135]},{1:[2,137],6:[2,137],26:[2,137],27:[2,137],48:[2,137],53:[2,137],56:[2,137],65:[2,137],71:[2,137],77:[2,137],85:[2,137],90:[2,137],92:[2,137],102:[2,137],104:[2,137],106:[2,137],107:[2,137],108:[2,137],112:[2,137],120:[2,137],128:[2,137],130:[2,137],131:[2,137],134:[2,137],135:[2,137],136:[2,137],137:[2,137],138:[2,137],139:[2,137]},{27:[1,293],123:[1,294],124:261,125:[1,220]},{1:[2,171],6:[2,171],26:[2,171],27:[2,171],48:[2,171],53:[2,171],56:[2,171],71:[2,171],77:[2,171],85:[2,171],90:[2,171],92:[2,171],104:[2,171],106:[2,171],107:[2,171],108:[2,171],112:[2,171],120:[2,171],128:[2,171],130:[2,171],131:[2,171],134:[2,171],135:[2,171],136:[2,171],137:[2,171],138:[2,171],139:[2,171]},{5:295,26:[1,5]},{27:[2,174],123:[2,174],125:[2,174]},{5:296,26:[1,5],53:[1,297]},{26:[2,126],53:[2,126],105:87,106:[1,65],108:[1,66],111:88,112:[1,68],113:69,128:[1,86],130:[1,80],131:[1,79],134:[1,78],135:[1,81],136:[1,82],137:[1,83],138:[1,84],139:[1,85]},{1:[2,95],6:[2,95],26:[2,95],27:[2,95],48:[2,95],53:[2,95],56:[2,95],71:[2,95],77:[2,95],85:[2,95],90:[2,95],92:[2,95],104:[2,95],106:[2,95],107:[2,95],108:[2,95],112:[2,95],120:[2,95],128:[2,95],130:[2,95],131:[2,95],134:[2,95],135:[2,95],136:[2,95],137:[2,95],138:[2,95],139:[2,95]},{1:[2,98],5:298,6:[2,98],26:[1,5],27:[2,98],48:[2,98],53:[2,98],56:[2,98],61:93,65:[1,95],66:[1,96],67:[1,97],68:98,69:[1,99],71:[2,98],72:[1,100],73:[1,101],77:[2,98],80:92,83:[1,94],84:[2,104],85:[2,98],90:[2,98],92:[2,98],104:[2,98],106:[2,98],107:[2,98],108:[2,98],112:[2,98],120:[2,98],128:[2,98],130:[2,98],131:[2,98],134:[2,98],135:[2,98],136:[2,98],137:[2,98],138:[2,98],139:[2,98]},{104:[1,299]},{90:[1,300],105:87,106:[1,65],108:[1,66],111:88,112:[1,68],113:69,128:[1,86],130:[1,80],131:[1,79],134:[1,78],135:[1,81],136:[1,82],137:[1,83],138:[1,84],139:[1,85]},{1:[2,112],6:[2,112],26:[2,112],27:[2,112],38:[2,112],48:[2,112],53:[2,112],56:[2,112],65:[2,112],66:[2,112],67:[2,112],69:[2,112],71:[2,112],72:[2,112],73:[2,112],77:[2,112],83:[2,112],84:[2,112],85:[2,112],90:[2,112],92:[2,112],104:[2,112],106:[2,112],107:[2,112],108:[2,112],112:[2,112],118:[2,112],119:[2,112],120:[2,112],128:[2,112],130:[2,112],131:[2,112],134:[2,112],135:[2,112],136:[2,112],137:[2,112],138:[2,112],139:[2,112]},{8:202,9:118,10:20,11:21,12:22,13:[1,23],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:19,28:62,29:[1,73],30:52,31:[1,71],32:[1,72],33:25,34:[1,53],35:[1,54],36:[1,55],37:24,42:63,43:[1,46],44:[1,48],45:[1,49],46:[1,30],49:31,50:[1,60],51:[1,61],57:50,58:51,59:150,60:37,62:26,63:27,64:28,75:[1,70],78:[1,45],82:[1,29],87:[1,58],88:[1,59],89:[1,57],93:301,95:[1,39],99:[1,47],100:[1,40],103:[1,56],105:41,106:[1,65],108:[1,66],109:42,110:[1,67],111:43,112:[1,68],113:69,121:[1,44],126:38,127:[1,64],129:[1,32],130:[1,33],131:[1,34],132:[1,35],133:[1,36]},{8:202,9:118,10:20,11:21,12:22,13:[1,23],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:19,26:[1,149],28:62,29:[1,73],30:52,31:[1,71],32:[1,72],33:25,34:[1,53],35:[1,54],36:[1,55],37:24,42:63,43:[1,46],44:[1,48],45:[1,49],46:[1,30],49:31,50:[1,60],51:[1,61],57:50,58:51,59:150,60:37,62:26,63:27,64:28,75:[1,70],78:[1,45],82:[1,29],86:302,87:[1,58],88:[1,59],89:[1,57],93:148,95:[1,39],99:[1,47],100:[1,40],103:[1,56],105:41,106:[1,65],108:[1,66],109:42,110:[1,67],111:43,112:[1,68],113:69,121:[1,44],126:38,127:[1,64],129:[1,32],130:[1,33],131:[1,34],132:[1,35],133:[1,36]},{6:[2,120],26:[2,120],27:[2,120],53:[2,120],85:[2,120],90:[2,120]},{6:[1,269],26:[1,270],27:[1,303]},{1:[2,141],6:[2,141],26:[2,141],27:[2,141],48:[2,141],53:[2,141],56:[2,141],71:[2,141],77:[2,141],85:[2,141],90:[2,141],92:[2,141],104:[2,141],105:87,106:[1,65],107:[2,141],108:[1,66],111:88,112:[1,68],113:69,120:[2,141],128:[2,141],130:[1,80],131:[1,79],134:[1,78],135:[1,81],136:[1,82],137:[1,83],138:[1,84],139:[1,85]},{1:[2,143],6:[2,143],26:[2,143],27:[2,143],48:[2,143],53:[2,143],56:[2,143],71:[2,143],77:[2,143],85:[2,143],90:[2,143],92:[2,143],104:[2,143],105:87,106:[1,65],107:[2,143],108:[1,66],111:88,112:[1,68],113:69,120:[2,143],128:[2,143],130:[1,80],131:[1,79],134:[1,78],135:[1,81],136:[1,82],137:[1,83],138:[1,84],139:[1,85]},{118:[2,161],119:[2,161]},{8:304,9:118,10:20,11:21,12:22,13:[1,23],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:19,28:62,29:[1,73],30:52,31:[1,71],32:[1,72],33:25,34:[1,53],35:[1,54],36:[1,55],37:24,42:63,43:[1,46],44:[1,48],45:[1,49],46:[1,30],49:31,50:[1,60],51:[1,61],57:50,58:51,60:37,62:26,63:27,64:28,75:[1,70],78:[1,45],82:[1,29],87:[1,58],88:[1,59],89:[1,57],95:[1,39],99:[1,47],100:[1,40],103:[1,56],105:41,106:[1,65],108:[1,66],109:42,110:[1,67],111:43,112:[1,68],113:69,121:[1,44],126:38,127:[1,64],129:[1,32],130:[1,33],131:[1,34],132:[1,35],133:[1,36]},{8:305,9:118,10:20,11:21,12:22,13:[1,23],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:19,28:62,29:[1,73],30:52,31:[1,71],32:[1,72],33:25,34:[1,53],35:[1,54],36:[1,55],37:24,42:63,43:[1,46],44:[1,48],45:[1,49],46:[1,30],49:31,50:[1,60],51:[1,61],57:50,58:51,60:37,62:26,63:27,64:28,75:[1,70],78:[1,45],82:[1,29],87:[1,58],88:[1,59],89:[1,57],95:[1,39],99:[1,47],100:[1,40],103:[1,56],105:41,106:[1,65],108:[1,66],109:42,110:[1,67],111:43,112:[1,68],113:69,121:[1,44],126:38,127:[1,64],129:[1,32],130:[1,33],131:[1,34],132:[1,35],133:[1,36]},{8:306,9:118,10:20,11:21,12:22,13:[1,23],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:19,28:62,29:[1,73],30:52,31:[1,71],32:[1,72],33:25,34:[1,53],35:[1,54],36:[1,55],37:24,42:63,43:[1,46],44:[1,48],45:[1,49],46:[1,30],49:31,50:[1,60],51:[1,61],57:50,58:51,60:37,62:26,63:27,64:28,75:[1,70],78:[1,45],82:[1,29],87:[1,58],88:[1,59],89:[1,57],95:[1,39],99:[1,47],100:[1,40],103:[1,56],105:41,106:[1,65],108:[1,66],109:42,110:[1,67],111:43,112:[1,68],113:69,121:[1,44],126:38,127:[1,64],129:[1,32],130:[1,33],131:[1,34],132:[1,35],133:[1,36]},{1:[2,86],6:[2,86],26:[2,86],27:[2,86],38:[2,86],48:[2,86],53:[2,86],56:[2,86],65:[2,86],66:[2,86],67:[2,86],69:[2,86],71:[2,86],72:[2,86],73:[2,86],77:[2,86],83:[2,86],84:[2,86],85:[2,86],90:[2,86],92:[2,86],104:[2,86],106:[2,86],107:[2,86],108:[2,86],112:[2,86],118:[2,86],119:[2,86],120:[2,86],128:[2,86],130:[2,86],131:[2,86],134:[2,86],135:[2,86],136:[2,86],137:[2,86],138:[2,86],139:[2,86]},{12:170,28:171,29:[1,73],30:172,31:[1,71],32:[1,72],39:307,40:169,42:173,44:[1,48],45:[1,49],88:[1,114]},{6:[2,87],12:170,26:[2,87],27:[2,87],28:171,29:[1,73],30:172,31:[1,71],32:[1,72],39:168,40:169,42:173,44:[1,48],45:[1,49],53:[2,87],76:308,88:[1,114]},{6:[2,89],26:[2,89],27:[2,89],53:[2,89],77:[2,89]},{6:[2,37],26:[2,37],27:[2,37],53:[2,37],77:[2,37],105:87,106:[1,65],108:[1,66],111:88,112:[1,68],113:69,128:[1,86],130:[1,80],131:[1,79],134:[1,78],135:[1,81],136:[1,82],137:[1,83],138:[1,84],139:[1,85]},{8:309,9:118,10:20,11:21,12:22,13:[1,23],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:19,28:62,29:[1,73],30:52,31:[1,71],32:[1,72],33:25,34:[1,53],35:[1,54],36:[1,55],37:24,42:63,43:[1,46],44:[1,48],45:[1,49],46:[1,30],49:31,50:[1,60],51:[1,61],57:50,58:51,60:37,62:26,63:27,64:28,75:[1,70],78:[1,45],82:[1,29],87:[1,58],88:[1,59],89:[1,57],95:[1,39],99:[1,47],100:[1,40],103:[1,56],105:41,106:[1,65],108:[1,66],109:42,110:[1,67],111:43,112:[1,68],113:69,121:[1,44],126:38,127:[1,64],129:[1,32],130:[1,33],131:[1,34],132:[1,35],133:[1,36]},{71:[2,116],105:87,106:[1,65],108:[1,66],111:88,112:[1,68],113:69,128:[1,86],130:[1,80],131:[1,79],134:[1,78],135:[1,81],136:[1,82],137:[1,83],138:[1,84],139:[1,85]},{1:[2,35],6:[2,35],26:[2,35],27:[2,35],48:[2,35],53:[2,35],56:[2,35],71:[2,35],77:[2,35],85:[2,35],90:[2,35],92:[2,35],104:[2,35],106:[2,35],107:[2,35],108:[2,35],112:[2,35],120:[2,35],128:[2,35],130:[2,35],131:[2,35],134:[2,35],135:[2,35],136:[2,35],137:[2,35],138:[2,35],139:[2,35]},{1:[2,107],6:[2,107],26:[2,107],27:[2,107],48:[2,107],53:[2,107],56:[2,107],65:[2,107],66:[2,107],67:[2,107],69:[2,107],71:[2,107],72:[2,107],73:[2,107],77:[2,107],83:[2,107],84:[2,107],85:[2,107],90:[2,107],92:[2,107],104:[2,107],106:[2,107],107:[2,107],108:[2,107],112:[2,107],120:[2,107],128:[2,107],130:[2,107],131:[2,107],134:[2,107],135:[2,107],136:[2,107],137:[2,107],138:[2,107],139:[2,107]},{1:[2,47],6:[2,47],26:[2,47],27:[2,47],48:[2,47],53:[2,47],56:[2,47],71:[2,47],77:[2,47],85:[2,47],90:[2,47],92:[2,47],104:[2,47],106:[2,47],107:[2,47],108:[2,47],112:[2,47],120:[2,47],128:[2,47],130:[2,47],131:[2,47],134:[2,47],135:[2,47],136:[2,47],137:[2,47],138:[2,47],139:[2,47]},{1:[2,199],6:[2,199],26:[2,199],27:[2,199],48:[2,199],53:[2,199],56:[2,199],71:[2,199],77:[2,199],85:[2,199],90:[2,199],92:[2,199],104:[2,199],106:[2,199],107:[2,199],108:[2,199],112:[2,199],120:[2,199],128:[2,199],130:[2,199],131:[2,199],134:[2,199],135:[2,199],136:[2,199],137:[2,199],138:[2,199],139:[2,199]},{1:[2,178],6:[2,178],26:[2,178],27:[2,178],48:[2,178],53:[2,178],56:[2,178],71:[2,178],77:[2,178],85:[2,178],90:[2,178],92:[2,178],104:[2,178],106:[2,178],107:[2,178],108:[2,178],112:[2,178],120:[2,178],123:[2,178],128:[2,178],130:[2,178],131:[2,178],134:[2,178],135:[2,178],136:[2,178],137:[2,178],138:[2,178],139:[2,178]},{1:[2,131],6:[2,131],26:[2,131],27:[2,131],48:[2,131],53:[2,131],56:[2,131],71:[2,131],77:[2,131],85:[2,131],90:[2,131],92:[2,131],104:[2,131],106:[2,131],107:[2,131],108:[2,131],112:[2,131],120:[2,131],128:[2,131],130:[2,131],131:[2,131],134:[2,131],135:[2,131],136:[2,131],137:[2,131],138:[2,131],139:[2,131]},{1:[2,132],6:[2,132],26:[2,132],27:[2,132],48:[2,132],53:[2,132],56:[2,132],71:[2,132],77:[2,132],85:[2,132],90:[2,132],92:[2,132],97:[2,132],104:[2,132],106:[2,132],107:[2,132],108:[2,132],112:[2,132],120:[2,132],128:[2,132],130:[2,132],131:[2,132],134:[2,132],135:[2,132],136:[2,132],137:[2,132],138:[2,132],139:[2,132]},{1:[2,169],6:[2,169],26:[2,169],27:[2,169],48:[2,169],53:[2,169],56:[2,169],71:[2,169],77:[2,169],85:[2,169],90:[2,169],92:[2,169],104:[2,169],106:[2,169],107:[2,169],108:[2,169],112:[2,169],120:[2,169],128:[2,169],130:[2,169],131:[2,169],134:[2,169],135:[2,169],136:[2,169],137:[2,169],138:[2,169],139:[2,169]},{5:310,26:[1,5]},{27:[1,311]},{6:[1,312],27:[2,175],123:[2,175],125:[2,175]},{8:313,9:118,10:20,11:21,12:22,13:[1,23],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:19,28:62,29:[1,73],30:52,31:[1,71],32:[1,72],33:25,34:[1,53],35:[1,54],36:[1,55],37:24,42:63,43:[1,46],44:[1,48],45:[1,49],46:[1,30],49:31,50:[1,60],51:[1,61],57:50,58:51,60:37,62:26,63:27,64:28,75:[1,70],78:[1,45],82:[1,29],87:[1,58],88:[1,59],89:[1,57],95:[1,39],99:[1,47],100:[1,40],103:[1,56],105:41,106:[1,65],108:[1,66],109:42,110:[1,67],111:43,112:[1,68],113:69,121:[1,44],126:38,127:[1,64],129:[1,32],130:[1,33],131:[1,34],132:[1,35],133:[1,36]},{1:[2,99],6:[2,99],26:[2,99],27:[2,99],48:[2,99],53:[2,99],56:[2,99],71:[2,99],77:[2,99],85:[2,99],90:[2,99],92:[2,99],104:[2,99],106:[2,99],107:[2,99],108:[2,99],112:[2,99],120:[2,99],128:[2,99],130:[2,99],131:[2,99],134:[2,99],135:[2,99],136:[2,99],137:[2,99],138:[2,99],139:[2,99]},{1:[2,139],6:[2,139],26:[2,139],27:[2,139],48:[2,139],53:[2,139],56:[2,139],65:[2,139],66:[2,139],67:[2,139],69:[2,139],71:[2,139],72:[2,139],73:[2,139],77:[2,139],83:[2,139],84:[2,139],85:[2,139],90:[2,139],92:[2,139],104:[2,139],106:[2,139],107:[2,139],108:[2,139],112:[2,139],120:[2,139],128:[2,139],130:[2,139],131:[2,139],134:[2,139],135:[2,139],136:[2,139],137:[2,139],138:[2,139],139:[2,139]},{1:[2,115],6:[2,115],26:[2,115],27:[2,115],48:[2,115],53:[2,115],56:[2,115],65:[2,115],66:[2,115],67:[2,115],69:[2,115],71:[2,115],72:[2,115],73:[2,115],77:[2,115],83:[2,115],84:[2,115],85:[2,115],90:[2,115],92:[2,115],104:[2,115],106:[2,115],107:[2,115],108:[2,115],112:[2,115],120:[2,115],128:[2,115],130:[2,115],131:[2,115],134:[2,115],135:[2,115],136:[2,115],137:[2,115],138:[2,115],139:[2,115]},{6:[2,121],26:[2,121],27:[2,121],53:[2,121],85:[2,121],90:[2,121]},{6:[2,51],26:[2,51],27:[2,51],52:314,53:[1,230]},{6:[2,122],26:[2,122],27:[2,122],53:[2,122],85:[2,122],90:[2,122]},{1:[2,164],6:[2,164],26:[2,164],27:[2,164],48:[2,164],53:[2,164],56:[2,164],71:[2,164],77:[2,164],85:[2,164],90:[2,164],92:[2,164],104:[2,164],105:87,106:[2,164],107:[2,164],108:[2,164],111:88,112:[2,164],113:69,120:[1,315],128:[2,164],130:[1,80],131:[1,79],134:[1,78],135:[1,81],136:[1,82],137:[1,83],138:[1,84],139:[1,85]},{1:[2,166],6:[2,166],26:[2,166],27:[2,166],48:[2,166],53:[2,166],56:[2,166],71:[2,166],77:[2,166],85:[2,166],90:[2,166],92:[2,166],104:[2,166],105:87,106:[2,166],107:[1,316],108:[2,166],111:88,112:[2,166],113:69,120:[2,166],128:[2,166],130:[1,80],131:[1,79],134:[1,78],135:[1,81],136:[1,82],137:[1,83],138:[1,84],139:[1,85]},{1:[2,165],6:[2,165],26:[2,165],27:[2,165],48:[2,165],53:[2,165],56:[2,165],71:[2,165],77:[2,165],85:[2,165],90:[2,165],92:[2,165],104:[2,165],105:87,106:[2,165],107:[2,165],108:[2,165],111:88,112:[2,165],113:69,120:[2,165],128:[2,165],130:[1,80],131:[1,79],134:[1,78],135:[1,81],136:[1,82],137:[1,83],138:[1,84],139:[1,85]},{6:[2,90],26:[2,90],27:[2,90],53:[2,90],77:[2,90]},{6:[2,51],26:[2,51],27:[2,51],52:317,53:[1,240]},{27:[1,318],105:87,106:[1,65],108:[1,66],111:88,112:[1,68],113:69,128:[1,86],130:[1,80],131:[1,79],134:[1,78],135:[1,81],136:[1,82],137:[1,83],138:[1,84],139:[1,85]},{27:[1,319]},{1:[2,172],6:[2,172],26:[2,172],27:[2,172],48:[2,172],53:[2,172],56:[2,172],71:[2,172],77:[2,172],85:[2,172],90:[2,172],92:[2,172],104:[2,172],106:[2,172],107:[2,172],108:[2,172],112:[2,172],120:[2,172],128:[2,172],130:[2,172],131:[2,172],134:[2,172],135:[2,172],136:[2,172],137:[2,172],138:[2,172],139:[2,172]},{27:[2,176],123:[2,176],125:[2,176]},{26:[2,127],53:[2,127],105:87,106:[1,65],108:[1,66],111:88,112:[1,68],113:69,128:[1,86],130:[1,80],131:[1,79],134:[1,78],135:[1,81],136:[1,82],137:[1,83],138:[1,84],139:[1,85]},{6:[1,269],26:[1,270],27:[1,320]},{8:321,9:118,10:20,11:21,12:22,13:[1,23],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:19,28:62,29:[1,73],30:52,31:[1,71],32:[1,72],33:25,34:[1,53],35:[1,54],36:[1,55],37:24,42:63,43:[1,46],44:[1,48],45:[1,49],46:[1,30],49:31,50:[1,60],51:[1,61],57:50,58:51,60:37,62:26,63:27,64:28,75:[1,70],78:[1,45],82:[1,29],87:[1,58],88:[1,59],89:[1,57],95:[1,39],99:[1,47],100:[1,40],103:[1,56],105:41,106:[1,65],108:[1,66],109:42,110:[1,67],111:43,112:[1,68],113:69,121:[1,44],126:38,127:[1,64],129:[1,32],130:[1,33],131:[1,34],132:[1,35],133:[1,36]},{8:322,9:118,10:20,11:21,12:22,13:[1,23],14:8,15:9,16:10,17:11,18:12,19:13,20:14,21:15,22:16,23:17,24:18,25:19,28:62,29:[1,73],30:52,31:[1,71],32:[1,72],33:25,34:[1,53],35:[1,54],36:[1,55],37:24,42:63,43:[1,46],44:[1,48],45:[1,49],46:[1,30],49:31,50:[1,60],51:[1,61],57:50,58:51,60:37,62:26,63:27,64:28,75:[1,70],78:[1,45],82:[1,29],87:[1,58],88:[1,59],89:[1,57],95:[1,39],99:[1,47],100:[1,40],103:[1,56],105:41,106:[1,65],108:[1,66],109:42,110:[1,67],111:43,112:[1,68],113:69,121:[1,44],126:38,127:[1,64],129:[1,32],130:[1,33],131:[1,34],132:[1,35],133:[1,36]},{6:[1,280],26:[1,281],27:[1,323]},{6:[2,38],26:[2,38],27:[2,38],53:[2,38],77:[2,38]},{1:[2,170],6:[2,170],26:[2,170],27:[2,170],48:[2,170],53:[2,170],56:[2,170],71:[2,170],77:[2,170],85:[2,170],90:[2,170],92:[2,170],104:[2,170],106:[2,170],107:[2,170],108:[2,170],112:[2,170],120:[2,170],128:[2,170],130:[2,170],131:[2,170],134:[2,170],135:[2,170],136:[2,170],137:[2,170],138:[2,170],139:[2,170]},{6:[2,123],26:[2,123],27:[2,123],53:[2,123],85:[2,123],90:[2,123]},{1:[2,167],6:[2,167],26:[2,167],27:[2,167],48:[2,167],53:[2,167],56:[2,167],71:[2,167],77:[2,167],85:[2,167],90:[2,167],92:[2,167],104:[2,167],105:87,106:[2,167],107:[2,167],108:[2,167],111:88,112:[2,167],113:69,120:[2,167],128:[2,167],130:[1,80],131:[1,79],134:[1,78],135:[1,81],136:[1,82],137:[1,83],138:[1,84],139:[1,85]},{1:[2,168],6:[2,168],26:[2,168],27:[2,168],48:[2,168],53:[2,168],56:[2,168],71:[2,168],77:[2,168],85:[2,168],90:[2,168],92:[2,168],104:[2,168],105:87,106:[2,168],107:[2,168],108:[2,168],111:88,112:[2,168],113:69,120:[2,168],128:[2,168],130:[1,80],131:[1,79],134:[1,78],135:[1,81],136:[1,82],137:[1,83],138:[1,84],139:[1,85]},{6:[2,91],26:[2,91],27:[2,91],53:[2,91],77:[2,91]}],
defaultActions: {60:[2,49],61:[2,50],75:[2,3],94:[2,105],191:[2,85]},
parseError: function parseError(str, hash) {
    throw new Error(str);
},
parse: function parse(input) {
    var self = this,
        stack = [0],
        vstack = [null], // semantic value stack
        lstack = [], // location stack
        table = this.table,
        yytext = '',
        yylineno = 0,
        yyleng = 0,
        recovering = 0,
        TERROR = 2,
        EOF = 1;

    //this.reductionCount = this.shiftCount = 0;

    this.lexer.setInput(input);
    this.lexer.yy = this.yy;
    this.yy.lexer = this.lexer;
    if (typeof this.lexer.yylloc == 'undefined')
        this.lexer.yylloc = {};
    var yyloc = this.lexer.yylloc;
    lstack.push(yyloc);

    if (typeof this.yy.parseError === 'function')
        this.parseError = this.yy.parseError;

    function popStack (n) {
        stack.length = stack.length - 2*n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }

    function lex() {
        var token;
        token = self.lexer.lex() || 1; // $end = 1
        // if token isn't its numeric value, convert
        if (typeof token !== 'number') {
            token = self.symbols_[token] || token;
        }
        return token;
    }

    var symbol, preErrorSymbol, state, action, a, r, yyval={},p,len,newState, expected;
    while (true) {
        // retreive state number from top of stack
        state = stack[stack.length-1];

        // use default actions if available
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol == null)
                symbol = lex();
            // read action for current state and first input
            action = table[state] && table[state][symbol];
        }

        // handle parse error
        _handle_error:
        if (typeof action === 'undefined' || !action.length || !action[0]) {

            if (!recovering) {
                // Report error
                expected = [];
                for (p in table[state]) if (this.terminals_[p] && p > 2) {
                    expected.push("'"+this.terminals_[p]+"'");
                }
                var errStr = '';
                if (this.lexer.showPosition) {
                    errStr = 'Parse error on line '+(yylineno+1)+":\n"+this.lexer.showPosition()+"\nExpecting "+expected.join(', ') + ", got '" + this.terminals_[symbol]+ "'";
                } else {
                    errStr = 'Parse error on line '+(yylineno+1)+": Unexpected " +
                                  (symbol == 1 /*EOF*/ ? "end of input" :
                                              ("'"+(this.terminals_[symbol] || symbol)+"'"));
                }
                this.parseError(errStr,
                    {text: this.lexer.match, token: this.terminals_[symbol] || symbol, line: this.lexer.yylineno, loc: yyloc, expected: expected});
            }

            // just recovered from another error
            if (recovering == 3) {
                if (symbol == EOF) {
                    throw new Error(errStr || 'Parsing halted.');
                }

                // discard current lookahead and grab another
                yyleng = this.lexer.yyleng;
                yytext = this.lexer.yytext;
                yylineno = this.lexer.yylineno;
                yyloc = this.lexer.yylloc;
                symbol = lex();
            }

            // try to recover from error
            while (1) {
                // check for error recovery rule in this state
                if ((TERROR.toString()) in table[state]) {
                    break;
                }
                if (state == 0) {
                    throw new Error(errStr || 'Parsing halted.');
                }
                popStack(1);
                state = stack[stack.length-1];
            }

            preErrorSymbol = symbol; // save the lookahead token
            symbol = TERROR;         // insert generic error symbol as new lookahead
            state = stack[stack.length-1];
            action = table[state] && table[state][TERROR];
            recovering = 3; // allow 3 real symbols to be shifted before reporting a new error
        }

        // this shouldn't happen, unless resolve defaults are off
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: '+state+', token: '+symbol);
        }

        switch (action[0]) {

            case 1: // shift
                //this.shiftCount++;

                stack.push(symbol);
                vstack.push(this.lexer.yytext);
                lstack.push(this.lexer.yylloc);
                stack.push(action[1]); // push state
                symbol = null;
                if (!preErrorSymbol) { // normal execution/no error
                    yyleng = this.lexer.yyleng;
                    yytext = this.lexer.yytext;
                    yylineno = this.lexer.yylineno;
                    yyloc = this.lexer.yylloc;
                    if (recovering > 0)
                        recovering--;
                } else { // error just occurred, resume old lookahead f/ before error
                    symbol = preErrorSymbol;
                    preErrorSymbol = null;
                }
                break;

            case 2: // reduce
                //this.reductionCount++;

                len = this.productions_[action[1]][1];

                // perform semantic action
                yyval.$ = vstack[vstack.length-len]; // default to $$ = $1
                // default location, uses first token for firsts, last for lasts
                yyval._$ = {
                    first_line: lstack[lstack.length-(len||1)].first_line,
                    last_line: lstack[lstack.length-1].last_line,
                    first_column: lstack[lstack.length-(len||1)].first_column,
                    last_column: lstack[lstack.length-1].last_column
                };
                r = this.performAction.call(yyval, yytext, yyleng, yylineno, this.yy, action[1], vstack, lstack);

                if (typeof r !== 'undefined') {
                    return r;
                }

                // pop off stack
                if (len) {
                    stack = stack.slice(0,-1*len*2);
                    vstack = vstack.slice(0, -1*len);
                    lstack = lstack.slice(0, -1*len);
                }

                stack.push(this.productions_[action[1]][0]);    // push nonterminal (reduce)
                vstack.push(yyval.$);
                lstack.push(yyval._$);
                // goto new state = table[STATE][NONTERMINAL]
                newState = table[stack[stack.length-2]][stack[stack.length-1]];
                stack.push(newState);
                break;

            case 3: // accept
                return true;
        }

    }

    return true;
}};
undefined
return parser;
})();
if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
exports.parser = parser;
exports.parse = function () { return parser.parse.apply(parser, arguments); }
exports.main = function commonjsMain(args) {
    if (!args[1])
        throw new Error('Usage: '+args[0]+' FILE');
    if (typeof process !== 'undefined') {
        var source = require('fs').readFileSync(require('path').join(process.cwd(), args[1]), "utf8");
    } else {
        var cwd = require("file").path(require("file").cwd());
        var source = cwd.join(args[1]).read({charset: "utf-8"});
    }
    return exports.parser.parse(source);
}
if (typeof module !== 'undefined' && require.main === module) {
  exports.main(typeof process !== 'undefined' ? process.argv.slice(1) : require("system").args);
}
}
};require['./scope'] = new function() {
  var exports = this;
  (function() {
  var Scope, extend, last, _ref;
  _ref = require('./helpers'), extend = _ref.extend, last = _ref.last;
  exports.Scope = Scope = (function() {
    Scope.root = null;
    function Scope(parent, expressions, method) {
      this.parent = parent;
      this.expressions = expressions;
      this.method = method;
      this.variables = [
        {
          name: 'arguments',
          type: 'arguments'
        }
      ];
      this.positions = {};
      if (!this.parent) {
        Scope.root = this;
      }
    }
    Scope.prototype.add = function(name, type, immediate) {
      var pos;
      if (this.shared && !immediate) {
        return this.parent.add(name, type, immediate);
      }
      if (typeof (pos = this.positions[name]) === 'number') {
        return this.variables[pos].type = type;
      } else {
        return this.positions[name] = this.variables.push({
          name: name,
          type: type
        }) - 1;
      }
    };
    Scope.prototype.find = function(name, options) {
      if (this.check(name, options)) {
        return true;
      }
      this.add(name, 'var');
      return false;
    };
    Scope.prototype.parameter = function(name) {
      if (this.shared && this.parent.check(name, true)) {
        return;
      }
      return this.add(name, 'param');
    };
    Scope.prototype.check = function(name, immediate) {
      var found, _ref2;
      found = !!this.type(name);
      if (found || immediate) {
        return found;
      }
      return !!((_ref2 = this.parent) != null ? _ref2.check(name) : void 0);
    };
    Scope.prototype.temporary = function(name, index) {
      if (name.length > 1) {
        return '_' + name + (index > 1 ? index : '');
      } else {
        return '_' + (index + parseInt(name, 36)).toString(36).replace(/\d/g, 'a');
      }
    };
    Scope.prototype.type = function(name) {
      var v, _i, _len, _ref2;
      _ref2 = this.variables;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        v = _ref2[_i];
        if (v.name === name) {
          return v.type;
        }
      }
      return null;
    };
    Scope.prototype.freeVariable = function(type) {
      var index, temp;
      index = 0;
      while (this.check((temp = this.temporary(type, index)))) {
        index++;
      }
      this.add(temp, 'var', true);
      return temp;
    };
    Scope.prototype.assign = function(name, value) {
      this.add(name, {
        value: value,
        assigned: true
      });
      return this.hasAssignments = true;
    };
    Scope.prototype.hasDeclarations = function() {
      return !!this.declaredVariables().length;
    };
    Scope.prototype.declaredVariables = function() {
      var realVars, tempVars, v, _i, _len, _ref2;
      realVars = [];
      tempVars = [];
      _ref2 = this.variables;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        v = _ref2[_i];
        if (v.type === 'var') {
          (v.name.charAt(0) === '_' ? tempVars : realVars).push(v.name);
        }
      }
      return realVars.sort().concat(tempVars.sort());
    };
    Scope.prototype.assignedVariables = function() {
      var v, _i, _len, _ref2, _results;
      _ref2 = this.variables;
      _results = [];
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        v = _ref2[_i];
        if (v.type.assigned) {
          _results.push("" + v.name + " = " + v.type.value);
        }
      }
      return _results;
    };
    return Scope;
  })();
}).call(this);


};require['./nodes'] = new function() {
  var exports = this;
  (function() {
  var Access, Arr, Assign, Base, Block, Call, Class, Closure, Code, Comment, Existence, Extends, For, IDENTIFIER, IDENTIFIER_STR, IS_STRING, If, In, Include, Index, LEVEL_ACCESS, LEVEL_COND, LEVEL_LIST, LEVEL_OP, LEVEL_PAREN, LEVEL_TOP, Literal, METHOD_DEF, NEGATE, NO, Namespace, Obj, Op, Param, Parens, Push, Range, Return, SIMPLENUM, Scope, Slice, Splat, Switch, TAB, THIS, Throw, Try, UTILITIES, Value, While, YES, compact, del, ends, extend, flatten, last, merge, multident, starts, unfoldSoak, utility, _ref;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    /** @constructor */
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  }, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __indexOf = Array.prototype.indexOf || function(item) {
    for (var i = 0, l = this.length; i < l; i++) {
      if (this[i] === item) return i;
    }
    return -1;
  };
  Scope = require('./scope').Scope;
  _ref = require('./helpers'), compact = _ref.compact, flatten = _ref.flatten, extend = _ref.extend, merge = _ref.merge, del = _ref.del, starts = _ref.starts, ends = _ref.ends, last = _ref.last;
  exports.extend = extend;
  YES = function() {
    return true;
  };
  NO = function() {
    return false;
  };
  THIS = function() {
    return this;
  };
  NEGATE = function() {
    this.negated = !this.negated;
    return this;
  };
  exports.Base = Base = (function() {
    function Base() {}
    Base.prototype.compile = function(o, lvl) {
      var node;
      o = extend({}, o);
      if (lvl) {
        o.level = lvl;
      }
      node = this.unfoldSoak(o) || this;
      node.tab = o.indent;
      if (o.level === LEVEL_TOP || !node.isStatement(o)) {
        return node.compileNode(o);
      } else {
        return node.compileClosure(o);
      }
    };
    Base.prototype.compileClosure = function(o) {
      if (this.jumps() || this instanceof Throw) {
        throw SyntaxError('cannot use a pure statement in an expression.');
      }
      o.sharedScope = true;
      return Closure.wrap(this).compileNode(o);
    };
    Base.prototype.cache = function(o, level, reused) {
      var ref, sub;
      if (!this.isComplex()) {
        ref = level ? this.compile(o, level) : this;
        return [ref, ref];
      } else {
        ref = new Literal(reused || o.scope.freeVariable('ref'));
        sub = new Assign(ref, this);
        if (level) {
          return [sub.compile(o, level), ref.value];
        } else {
          return [sub, ref];
        }
      }
    };
    Base.prototype.compileLoopReference = function(o, name) {
      var src, tmp;
      src = tmp = this.compile(o, LEVEL_LIST);
      if (!((-Infinity < +src && +src < Infinity) || IDENTIFIER.test(src) && o.scope.check(src, true))) {
        src = "" + (tmp = o.scope.freeVariable(name)) + " = " + src;
      }
      return [src, tmp];
    };
    Base.prototype.makeReturn = function() {
      return new Return(this);
    };
    Base.prototype.contains = function(pred) {
      var contains;
      contains = false;
      this.traverseChildren(false, function(node) {
        if (pred(node)) {
          contains = true;
          return false;
        }
      });
      return contains;
    };
    Base.prototype.containsType = function(type) {
      return this instanceof type || this.contains(function(node) {
        return node instanceof type;
      });
    };
    Base.prototype.lastNonComment = function(list) {
      var i;
      i = list.length;
      while (i--) {
        if (!(list[i] instanceof Comment)) {
          return list[i];
        }
      }
      return null;
    };
    Base.prototype.toString = function(idt, name) {
      var tree;
      if (idt == null) {
        idt = '';
      }
      if (name == null) {
        name = this.constructor.name;
      }
      tree = '\n' + idt + name;
      if (this.soak) {
        tree += '?';
      }
      this.eachChild(function(node) {
        return tree += node.toString(idt + TAB);
      });
      return tree;
    };
    Base.prototype.eachChild = function(func) {
      var attr, child, _i, _j, _len, _len2, _ref2, _ref3;
      if (!this.children) {
        return this;
      }
      _ref2 = this.children;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        attr = _ref2[_i];
        if (this[attr]) {
          _ref3 = flatten([this[attr]]);
          for (_j = 0, _len2 = _ref3.length; _j < _len2; _j++) {
            child = _ref3[_j];
            if (func(child) === false) {
              return this;
            }
          }
        }
      }
      return this;
    };
    Base.prototype.traverseChildren = function(crossScope, func) {
      return this.eachChild(function(child) {
        if (func(child) === false) {
          return false;
        }
        return child.traverseChildren(crossScope, func);
      });
    };
    Base.prototype.invert = function() {
      return new Op('!', this);
    };
    Base.prototype.unwrapAll = function() {
      var node;
      node = this;
      while (node !== (node = node.unwrap())) {
        continue;
      }
      return node;
    };
    Base.prototype.children = [];
    Base.prototype.isStatement = NO;
    Base.prototype.jumps = NO;
    Base.prototype.isComplex = YES;
    Base.prototype.isChainable = NO;
    Base.prototype.isAssignable = NO;
    Base.prototype.unwrap = THIS;
    Base.prototype.unfoldSoak = NO;
    Base.prototype.assigns = NO;
    return Base;
  })();
  exports.Block = Block = (function() {
    __extends(Block, Base);
    function Block(nodes) {
      this.expressions = compact(flatten(nodes || []));
    }
    Block.prototype.children = ['expressions'];
    Block.prototype.push = function(node) {
      this.expressions.push(node);
      return this;
    };
    Block.prototype.pop = function() {
      return this.expressions.pop();
    };
    Block.prototype.unshift = function(node) {
      this.expressions.unshift(node);
      return this;
    };
    Block.prototype.unwrap = function() {
      if (this.expressions.length === 1) {
        return this.expressions[0];
      } else {
        return this;
      }
    };
    Block.prototype.isEmpty = function() {
      return !this.expressions.length;
    };
    Block.prototype.isStatement = function(o) {
      var exp, _i, _len, _ref2;
      _ref2 = this.expressions;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        exp = _ref2[_i];
        if (exp.isStatement(o)) {
          return true;
        }
      }
      return false;
    };
    Block.prototype.jumps = function(o) {
      var exp, _i, _len, _ref2;
      _ref2 = this.expressions;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        exp = _ref2[_i];
        if (exp.jumps(o)) {
          return exp;
        }
      }
    };
    Block.prototype.makeReturn = function() {
      var expr, len;
      len = this.expressions.length;
      while (len--) {
        expr = this.expressions[len];
        if (!(expr instanceof Comment)) {
          this.expressions[len] = expr.makeReturn();
          if (expr instanceof Return && !expr.expression) {
            this.expressions.splice(len, 1);
          }
          break;
        }
      }
      return this;
    };
    Block.prototype.compile = function(o, level) {
      if (o == null) {
        o = {};
      }
      if (o.scope) {
        return Block.__super__.compile.call(this, o, level);
      } else {
        return this.compileRoot(o);
      }
    };
    Block.prototype.compileNode = function(o) {
      var code, codes, node, top, _i, _len, _ref2;
      this.tab = o.indent;
      top = o.level === LEVEL_TOP;
      codes = [];
      _ref2 = this.expressions;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        node = _ref2[_i];
        node = node.unwrapAll();
        node = node.unfoldSoak(o) || node;
        if (node instanceof Block) {
          codes.push(node.compileNode(o));
        } else if (top) {
          node.front = true;
          code = node.compile(o);
          codes.push(node.isStatement(o) ? code : this.tab + code + ';');
        } else {
          codes.push(node.compile(o, LEVEL_LIST));
        }
      }
      if (top) {
        return codes.join('\n');
      }
      code = codes.join(', ') || 'void 0';
      if (codes.length > 1 && o.level >= LEVEL_LIST) {
        return "(" + code + ")";
      } else {
        return code;
      }
    };
    Block.prototype.compileRoot = function(o) {
      var aliases, code, comparator, idt, inc, includes, includesJs, name, provides, providesJs;
      o.indent = this.tab = o.bare ? '' : TAB;
      o.scope = new Scope(null, this, null);
      o.level = LEVEL_TOP;
      code = this.compileWithDeclarations(o);
      if (o.google) {
        provides = o.google.provides;
        provides.sort();
        providesJs = (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = provides.length; _i < _len; _i++) {
            name = provides[_i];
            _results.push("goog.provide('" + name + "');");
          }
          return _results;
        })();
        providesJs = providesJs.join('\n');
        includes = o.google.includes;
        comparator = function(a, b) {
          return a.name.localeCompare(b.name);
        };
        includes.sort(comparator);
        includesJs = (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = includes.length; _i < _len; _i++) {
            inc = includes[_i];
            if (provides.indexOf(inc.name) === -1) {
              _results.push("goog.require('" + inc.name + "');");
            }
          }
          return _results;
        })();
        includesJs = includesJs.join('\n');
        aliases = (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = includes.length; _i < _len; _i++) {
            inc = includes[_i];
            if (inc.alias) {
              _results.push(inc);
            }
          }
          return _results;
        })();
        aliases.sort(comparator);
        idt = this.tab + TAB;
        aliases = (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = aliases.length; _i < _len; _i++) {
            inc = aliases[_i];
            _results.push("" + idt + "var " + inc.alias + " = " + inc.name + ";");
          }
          return _results;
        })();
        aliases = aliases.join('\n');
        code = "" + providesJs + "\n\n" + includesJs + "\n\ngoog.scope(function() {\n" + aliases + "\n" + code + "\n\n}); // close goog.scope()";
      }
      if (o.bare) {
        return code;
      } else {
        return "(function() {\n" + code + "\n}).call(this);\n";
      }
    };
    Block.prototype.compileWithDeclarations = function(o) {
      var assigns, code, declars, exp, i, post, rest, scope, _len, _ref2;
      code = post = '';
      _ref2 = this.expressions;
      for (i = 0, _len = _ref2.length; i < _len; i++) {
        exp = _ref2[i];
        exp = exp.unwrap();
        if (!(exp instanceof Comment || exp instanceof Literal)) {
          break;
        }
      }
      o = merge(o, {
        level: LEVEL_TOP
      });
      if (i) {
        rest = this.expressions.splice(i, this.expressions.length);
        code = this.compileNode(o);
        this.expressions = rest;
      }
      post = this.compileNode(o);
      scope = o.scope;
      if (scope.expressions === this) {
        declars = o.scope.hasDeclarations();
        assigns = scope.hasAssignments;
        if ((declars || assigns) && i) {
          code += '\n';
        }
        if (declars) {
          code += "" + this.tab + "var " + (scope.declaredVariables().join(', ')) + ";\n";
        }
        if (assigns) {
          code += "" + this.tab + "var " + (multident(scope.assignedVariables().join(', '), this.tab)) + ";\n";
        }
      }
      return code + post;
    };
    Block.wrap = function(nodes) {
      if (nodes.length === 1 && nodes[0] instanceof Block) {
        return nodes[0];
      }
      return new Block(nodes);
    };
    return Block;
  })();
  exports.Literal = Literal = (function() {
    __extends(Literal, Base);
    function Literal(value) {
      this.value = value;
    }
    Literal.prototype.makeReturn = function() {
      if (this.isStatement()) {
        return this;
      } else {
        return new Return(this);
      }
    };
    Literal.prototype.isAssignable = function() {
      return IDENTIFIER.test(this.value);
    };
    Literal.prototype.isStatement = function() {
      var _ref2;
      return (_ref2 = this.value) === 'break' || _ref2 === 'continue' || _ref2 === 'debugger';
    };
    Literal.prototype.isComplex = NO;
    Literal.prototype.assigns = function(name) {
      return name === this.value;
    };
    Literal.prototype.jumps = function(o) {
      if (!this.isStatement()) {
        return false;
      }
      if (!(o && (o.loop || o.block && (this.value !== 'continue')))) {
        return this;
      } else {
        return false;
      }
    };
    Literal.prototype.compileNode = function(o) {
      var code;
      code = this.isUndefined ? o.level >= LEVEL_ACCESS ? '(void 0)' : 'void 0' : this.value.reserved ? "\"" + this.value + "\"" : this.value;
      if (this.isStatement()) {
        return "" + this.tab + code + ";";
      } else {
        return code;
      }
    };
    Literal.prototype.toString = function() {
      return ' "' + this.value + '"';
    };
    return Literal;
  })();
  exports.Return = Return = (function() {
    __extends(Return, Base);
    function Return(expr) {
      if (expr && !expr.unwrap().isUndefined) {
        this.expression = expr;
      }
    }
    Return.prototype.children = ['expression'];
    Return.prototype.isStatement = YES;
    Return.prototype.makeReturn = THIS;
    Return.prototype.jumps = THIS;
    Return.prototype.compile = function(o, level) {
      var expr, _ref2;
      expr = (_ref2 = this.expression) != null ? _ref2.makeReturn() : void 0;
      if (expr && !(expr instanceof Return)) {
        return expr.compile(o, level);
      } else {
        return Return.__super__.compile.call(this, o, level);
      }
    };
    Return.prototype.compileNode = function(o) {
      return this.tab + ("return" + (this.expression ? ' ' + this.expression.compile(o, LEVEL_PAREN) : '') + ";");
    };
    return Return;
  })();
  exports.Value = Value = (function() {
    __extends(Value, Base);
    function Value(base, props, tag) {
      if (!props && base instanceof Value) {
        return base;
      }
      this.base = base;
      this.properties = props || [];
      if (tag) {
        this[tag] = true;
      }
      return this;
    }
    Value.prototype.children = ['base', 'properties'];
    Value.prototype.push = function(prop) {
      this.properties.push(prop);
      return this;
    };
    Value.prototype.hasProperties = function() {
      return !!this.properties.length;
    };
    Value.prototype.isArray = function() {
      return !this.properties.length && this.base instanceof Arr;
    };
    Value.prototype.isComplex = function() {
      return this.hasProperties() || this.base.isComplex();
    };
    Value.prototype.isAssignable = function() {
      return this.hasProperties() || this.base.isAssignable();
    };
    Value.prototype.isSimpleNumber = function() {
      return this.base instanceof Literal && SIMPLENUM.test(this.base.value);
    };
    Value.prototype.isAtomic = function() {
      var node, _i, _len, _ref2;
      _ref2 = this.properties.concat(this.base);
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        node = _ref2[_i];
        if (node.soak || node instanceof Call) {
          return false;
        }
      }
      return true;
    };
    Value.prototype.isStatement = function(o) {
      return !this.properties.length && this.base.isStatement(o);
    };
    Value.prototype.assigns = function(name) {
      return !this.properties.length && this.base.assigns(name);
    };
    Value.prototype.jumps = function(o) {
      return !this.properties.length && this.base.jumps(o);
    };
    Value.prototype.isObject = function(onlyGenerated) {
      if (this.properties.length) {
        return false;
      }
      return (this.base instanceof Obj) && (!onlyGenerated || this.base.generated);
    };
    Value.prototype.isSplice = function() {
      return last(this.properties) instanceof Slice;
    };
    Value.prototype.makeReturn = function() {
      if (this.properties.length) {
        return Value.__super__.makeReturn.call(this);
      } else {
        return this.base.makeReturn();
      }
    };
    Value.prototype.unwrap = function() {
      if (this.properties.length) {
        return this;
      } else {
        return this.base;
      }
    };
    Value.prototype.cacheReference = function(o) {
      var base, bref, name, nref;
      name = last(this.properties);
      if (this.properties.length < 2 && !this.base.isComplex() && !(name != null ? name.isComplex() : void 0)) {
        return [this, this];
      }
      base = new Value(this.base, this.properties.slice(0, -1));
      if (base.isComplex()) {
        bref = new Literal(o.scope.freeVariable('base'));
        base = new Value(new Parens(new Assign(bref, base)));
      }
      if (!name) {
        return [base, bref];
      }
      if (name.isComplex()) {
        nref = new Literal(o.scope.freeVariable('name'));
        name = new Index(new Assign(nref, name.index));
        nref = new Index(nref);
      }
      return [base.push(name), new Value(bref || base.base, [nref || name])];
    };
    Value.prototype.compileNode = function(o) {
      var code, prop, props, _i, _len;
      this.base.front = this.front;
      props = this.properties;
      code = this.base.compile(o, props.length ? LEVEL_ACCESS : null);
      if ((this.base instanceof Parens || props.length) && SIMPLENUM.test(code)) {
        code = "" + code + ".";
      }
      for (_i = 0, _len = props.length; _i < _len; _i++) {
        prop = props[_i];
        code += prop.compile(o);
      }
      return code;
    };
    Value.prototype.unfoldSoak = function(o) {
      var result;
      if (this.unfoldedSoak != null) {
        return this.unfoldedSoak;
      }
      result = __bind(function() {
        var fst, i, ifn, prop, ref, snd, _len, _ref2;
        if (ifn = this.base.unfoldSoak(o)) {
          Array.prototype.push.apply(ifn.body.properties, this.properties);
          return ifn;
        }
        _ref2 = this.properties;
        for (i = 0, _len = _ref2.length; i < _len; i++) {
          prop = _ref2[i];
          if (prop.soak) {
            prop.soak = false;
            fst = new Value(this.base, this.properties.slice(0, i));
            snd = new Value(this.base, this.properties.slice(i));
            if (fst.isComplex()) {
              ref = new Literal(o.scope.freeVariable('ref'));
              fst = new Parens(new Assign(ref, fst));
              snd.base = ref;
            }
            return new If(new Existence(fst), snd, {
              soak: true
            });
          }
        }
        return null;
      }, this)();
      return this.unfoldedSoak = result || false;
    };
    return Value;
  })();
  exports.Comment = Comment = (function() {
    __extends(Comment, Base);
    function Comment(comment, forCtor) {
      this.comment = comment;
      this.forCtor = forCtor;
    }
    Comment.prototype.isStatement = YES;
    Comment.prototype.makeReturn = THIS;
    Comment.prototype.compileNode = function(o, level) {
      var code;
      code = '/*' + multident(this.comment, this.tab);
      if (!this.forCtor && o.closure && !o.closure_nodoc) {
        code += '*/';
      }
      if ((level || o.level) === LEVEL_TOP) {
        code = o.indent + code;
      }
      return code;
    };
    return Comment;
  })();
  exports.Call = Call = (function() {
    __extends(Call, Base);
    function Call(variable, args, soak) {
      this.args = args != null ? args : [];
      this.soak = soak;
      this.isNew = false;
      this.isSuper = variable === 'super';
      this.variable = this.isSuper ? null : variable;
    }
    Call.prototype.children = ['variable', 'args'];
    Call.prototype.newInstance = function() {
      var base;
      base = this.variable.base || this.variable;
      if (base instanceof Call && !base.isNew) {
        base.newInstance();
      } else {
        this.isNew = true;
      }
      return this;
    };
    Call.prototype.superReference = function(o) {
      var method, name;
      method = o.scope.method;
      if (!method) {
        throw SyntaxError('cannot call super outside of a function.');
      }
      name = method.name;
      if (name == null) {
        throw SyntaxError('cannot call super on an anonymous function.');
      }
      if (o.google) {
        if (method.klass) {
          return (new Value(new Literal(method.klass), [new Access(new Literal("superClass_")), new Access(new Literal(name))])).compile(o);
        } else if (method.ctorParent) {
          return method.ctorParent.compile(o);
        } else {
          throw SyntaxError("super() called without a parent class");
        }
      } else {
        if (method.klass) {
          return (new Value(new Literal(method.klass), [new Access(new Literal("__super__")), new Access(new Literal(name))])).compile(o);
        } else {
          return "" + name + ".__super__.constructor";
        }
      }
    };
    Call.prototype.unfoldSoak = function(o) {
      var call, ifn, left, list, rite, _i, _len, _ref2, _ref3;
      if (this.soak) {
        if (this.variable) {
          if (ifn = unfoldSoak(o, this, 'variable')) {
            return ifn;
          }
          _ref2 = new Value(this.variable).cacheReference(o), left = _ref2[0], rite = _ref2[1];
        } else {
          left = new Literal(this.superReference(o));
          rite = new Value(left);
        }
        rite = new Call(rite, this.args);
        rite.isNew = this.isNew;
        left = new Literal("typeof " + (left.compile(o)) + " === \"function\"");
        return new If(left, new Value(rite), {
          soak: true
        });
      }
      call = this;
      list = [];
      while (true) {
        if (call.variable instanceof Call) {
          list.push(call);
          call = call.variable;
          continue;
        }
        if (!(call.variable instanceof Value)) {
          break;
        }
        list.push(call);
        if (!((call = call.variable.base) instanceof Call)) {
          break;
        }
      }
      _ref3 = list.reverse();
      for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
        call = _ref3[_i];
        if (ifn) {
          if (call.variable instanceof Call) {
            call.variable = ifn;
          } else {
            call.variable.base = ifn;
          }
        }
        ifn = unfoldSoak(o, call, 'variable');
      }
      return ifn;
    };
    Call.prototype.filterImplicitObjects = function(list) {
      var node, nodes, obj, prop, properties, _i, _j, _len, _len2, _ref2;
      nodes = [];
      for (_i = 0, _len = list.length; _i < _len; _i++) {
        node = list[_i];
        if (!((typeof node.isObject === "function" ? node.isObject() : void 0) && node.base.generated)) {
          nodes.push(node);
          continue;
        }
        obj = null;
        _ref2 = node.base.properties;
        for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
          prop = _ref2[_j];
          if (prop instanceof Assign || prop instanceof Comment) {
            if (!obj) {
              nodes.push(obj = new Obj(properties = [], true));
            }
            properties.push(prop);
          } else {
            nodes.push(prop);
            obj = null;
          }
        }
      }
      return nodes;
    };
    Call.prototype.compileNode = function(o) {
      var arg, args, code, _ref2;
      if ((_ref2 = this.variable) != null) {
        _ref2.front = this.front;
      }
      if (code = Splat.compileSplattedArray(o, this.args, true)) {
        return this.compileSplat(o, code);
      }
      args = this.filterImplicitObjects(this.args);
      args = ((function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = args.length; _i < _len; _i++) {
          arg = args[_i];
          _results.push(arg.compile(o, LEVEL_LIST));
        }
        return _results;
      })()).join(', ');
      if (this.isSuper) {
        return this.superReference(o) + (".call(this" + (args && ', ' + args) + ")");
      } else {
        return (this.isNew ? 'new ' : '') + this.variable.compile(o, LEVEL_ACCESS) + ("(" + args + ")");
      }
    };
    Call.prototype.compileSuper = function(args, o) {
      return "" + (this.superReference(o)) + ".call(this" + (args.length ? ', ' : '') + args + ")";
    };
    Call.prototype.compileSplat = function(o, splatArgs) {
      var base, fun, idt, name, ref;
      if (this.isSuper) {
        return "" + (this.superReference(o)) + ".apply(this, " + splatArgs + ")";
      }
      if (this.isNew) {
        idt = this.tab + TAB;
        return "(function(func, args, ctor) {\n" + idt + "ctor.prototype = func.prototype;\n" + idt + "var child = new ctor, result = func.apply(child, args);\n" + idt + "return typeof result === \"object\" ? result : child;\n" + this.tab + "})(" + (this.variable.compile(o, LEVEL_LIST)) + ", " + splatArgs + ", function() {})";
      }
      base = new Value(this.variable);
      if ((name = base.properties.pop()) && base.isComplex()) {
        ref = o.scope.freeVariable('ref');
        fun = "(" + ref + " = " + (base.compile(o, LEVEL_LIST)) + ")" + (name.compile(o));
      } else {
        fun = base.compile(o, LEVEL_ACCESS);
        if (SIMPLENUM.test(fun)) {
          fun = "(" + fun + ")";
        }
        if (name) {
          ref = fun;
          fun += name.compile(o);
        } else {
          ref = 'null';
        }
      }
      return "" + fun + ".apply(" + ref + ", " + splatArgs + ")";
    };
    return Call;
  })();
  exports.Extends = Extends = (function() {
    __extends(Extends, Base);
    function Extends(child, parent) {
      this.child = child;
      this.parent = parent;
    }
    Extends.prototype.children = ['child', 'parent'];
    Extends.prototype.compile = function(o) {
      var inheritsFunction;
      if (!o.google) {
        utility('hasProp', o);
      }
      if (o.google) {
        inheritsFunction = new Value(new Literal('goog.inherits'));
      } else {
        inheritsFunction = new Value(new Literal(utility('extends', o)));
      }
      return new Call(inheritsFunction, [this.child, this.parent]).compile(o);
    };
    return Extends;
  })();
  exports.Access = Access = (function() {
    __extends(Access, Base);
    function Access(name, tag) {
      this.name = name;
      this.name.asKey = true;
      this.proto = tag === 'proto' ? '.prototype' : '';
      this.soak = tag === 'soak';
    }
    Access.prototype.children = ['name'];
    Access.prototype.compile = function(o) {
      var name;
      name = this.name.compile(o);
      return this.proto + (IDENTIFIER.test(name) ? "." + name : "[" + name + "]");
    };
    Access.prototype.isComplex = NO;
    return Access;
  })();
  exports.Index = Index = (function() {
    __extends(Index, Base);
    function Index(index) {
      this.index = index;
    }
    Index.prototype.children = ['index'];
    Index.prototype.compile = function(o) {
      return (this.proto ? '.prototype' : '') + ("[" + (this.index.compile(o, LEVEL_PAREN)) + "]");
    };
    Index.prototype.isComplex = function() {
      return this.index.isComplex();
    };
    return Index;
  })();
  exports.Range = Range = (function() {
    __extends(Range, Base);
    Range.prototype.children = ['from', 'to'];
    function Range(from, to, tag) {
      this.from = from;
      this.to = to;
      this.exclusive = tag === 'exclusive';
      this.equals = this.exclusive ? '' : '=';
    }
    Range.prototype.compileVariables = function(o) {
      var step, _ref2, _ref3, _ref4, _ref5;
      o = merge(o, {
        top: true
      });
      _ref2 = this.from.cache(o, LEVEL_LIST), this.fromC = _ref2[0], this.fromVar = _ref2[1];
      _ref3 = this.to.cache(o, LEVEL_LIST), this.toC = _ref3[0], this.toVar = _ref3[1];
      if (step = del(o, 'step')) {
        _ref4 = step.cache(o, LEVEL_LIST), this.step = _ref4[0], this.stepVar = _ref4[1];
      }
      _ref5 = [this.fromVar.match(SIMPLENUM), this.toVar.match(SIMPLENUM)], this.fromNum = _ref5[0], this.toNum = _ref5[1];
      if (this.stepVar) {
        return this.stepNum = this.stepVar.match(SIMPLENUM);
      }
    };
    Range.prototype.compileNode = function(o) {
      var cond, condPart, from, gt, idx, known, lt, stepPart, to, varPart, _ref2, _ref3;
      if (!this.fromVar) {
        this.compileVariables(o);
      }
      if (!o.index) {
        return this.compileArray(o);
      }
      known = this.fromNum && this.toNum;
      idx = del(o, 'index');
      varPart = "" + idx + " = " + this.fromC;
      if (this.toC !== this.toVar) {
        varPart += ", " + this.toC;
      }
      if (this.step !== this.stepVar) {
        varPart += ", " + this.step;
      }
      _ref2 = ["" + idx + " <" + this.equals, "" + idx + " >" + this.equals], lt = _ref2[0], gt = _ref2[1];
      condPart = this.stepNum ? condPart = +this.stepNum > 0 ? "" + lt + " " + this.toVar : "" + gt + " " + this.toVar : known ? ((_ref3 = [+this.fromNum, +this.toNum], from = _ref3[0], to = _ref3[1], _ref3), condPart = from <= to ? "" + lt + " " + to : "" + gt + " " + to) : (cond = "" + this.fromVar + " <= " + this.toVar, condPart = "" + cond + " ? " + lt + " " + this.toVar + " : " + gt + " " + this.toVar);
      stepPart = this.stepVar ? "" + idx + " += " + this.stepVar : known ? from <= to ? "" + idx + "++" : "" + idx + "--" : "" + cond + " ? " + idx + "++ : " + idx + "--";
      return "" + varPart + "; " + condPart + "; " + stepPart;
    };
    Range.prototype.compileArray = function(o) {
      var args, body, cond, hasArgs, i, idt, post, pre, range, result, vars, _i, _ref2, _ref3, _results;
      if (this.fromNum && this.toNum && Math.abs(this.fromNum - this.toNum) <= 20) {
        range = (function() {
          _results = [];
          for (var _i = _ref2 = +this.fromNum, _ref3 = +this.toNum; _ref2 <= _ref3 ? _i <= _ref3 : _i >= _ref3; _ref2 <= _ref3 ? _i++ : _i--){ _results.push(_i); }
          return _results;
        }).apply(this);
        if (this.exclusive) {
          range.pop();
        }
        return "[" + (range.join(', ')) + "]";
      }
      idt = this.tab + TAB;
      i = o.scope.freeVariable('i');
      result = o.scope.freeVariable('results');
      pre = "\n" + idt + result + " = [];";
      if (this.fromNum && this.toNum) {
        o.index = i;
        body = this.compileNode(o);
      } else {
        vars = ("" + i + " = " + this.fromC) + (this.toC !== this.toVar ? ", " + this.toC : '');
        cond = "" + this.fromVar + " <= " + this.toVar;
        body = "var " + vars + "; " + cond + " ? " + i + " <" + this.equals + " " + this.toVar + " : " + i + " >" + this.equals + " " + this.toVar + "; " + cond + " ? " + i + "++ : " + i + "--";
      }
      post = "{ " + result + ".push(" + i + "); }\n" + idt + "return " + result + ";\n" + o.indent;
      hasArgs = function(node) {
        return node != null ? node.contains(function(n) {
          return n instanceof Literal && n.value === 'arguments' && !n.asKey;
        }) : void 0;
      };
      if (hasArgs(this.from) || hasArgs(this.to)) {
        args = ', arguments';
      }
      return "(function() {" + pre + "\n" + idt + "for (" + body + ")" + post + "}).apply(this" + (args != null ? args : '') + ")";
    };
    return Range;
  })();
  exports.Slice = Slice = (function() {
    __extends(Slice, Base);
    Slice.prototype.children = ['range'];
    function Slice(range) {
      this.range = range;
      Slice.__super__.constructor.call(this);
    }
    Slice.prototype.compileNode = function(o) {
      var compiled, from, fromStr, to, toStr, _ref2;
      _ref2 = this.range, to = _ref2.to, from = _ref2.from;
      fromStr = from && from.compile(o, LEVEL_PAREN) || '0';
      compiled = to && to.compile(o, LEVEL_PAREN);
      if (to && !(!this.range.exclusive && +compiled === -1)) {
        toStr = ', ' + (this.range.exclusive ? compiled : SIMPLENUM.test(compiled) ? (+compiled + 1).toString() : "(" + compiled + " + 1) || 9e9");
      }
      return ".slice(" + fromStr + (toStr || '') + ")";
    };
    return Slice;
  })();
  exports.Obj = Obj = (function() {
    __extends(Obj, Base);
    function Obj(props, generated) {
      this.generated = generated != null ? generated : false;
      this.objects = this.properties = props || [];
    }
    Obj.prototype.children = ['properties'];
    Obj.prototype.compileNode = function(o) {
      var i, idt, indent, join, lastNoncom, node, obj, prop, props, _i, _len;
      props = this.properties;
      if (!props.length) {
        if (this.front) {
          return '({})';
        } else {
          return '{}';
        }
      }
      if (this.generated) {
        for (_i = 0, _len = props.length; _i < _len; _i++) {
          node = props[_i];
          if (node instanceof Value) {
            throw new Error('cannot have an implicit value in an implicit object');
          }
        }
      }
      idt = o.indent += TAB;
      lastNoncom = this.lastNonComment(this.properties);
      props = (function() {
        var _len2, _results;
        _results = [];
        for (i = 0, _len2 = props.length; i < _len2; i++) {
          prop = props[i];
          join = i === props.length - 1 ? '' : prop === lastNoncom || prop instanceof Comment ? '\n' : ',\n';
          indent = prop instanceof Comment ? '' : idt;
          if (prop instanceof Value && prop["this"]) {
            prop = new Assign(prop.properties[0].name, prop, 'object');
          }
          if (!(prop instanceof Comment)) {
            if (!(prop instanceof Assign)) {
              prop = new Assign(prop, prop, 'object');
            }
            (prop.variable.base || prop.variable).asKey = true;
          }
          _results.push(indent + prop.compile(o, LEVEL_TOP) + join);
        }
        return _results;
      })();
      props = props.join('');
      obj = "{" + (props && '\n' + props + '\n' + this.tab) + "}";
      if (this.front) {
        return "(" + obj + ")";
      } else {
        return obj;
      }
    };
    Obj.prototype.assigns = function(name) {
      var prop, _i, _len, _ref2;
      _ref2 = this.properties;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        prop = _ref2[_i];
        if (prop.assigns(name)) {
          return true;
        }
      }
      return false;
    };
    return Obj;
  })();
  exports.Arr = Arr = (function() {
    __extends(Arr, Base);
    function Arr(objs) {
      this.objects = objs || [];
    }
    Arr.prototype.children = ['objects'];
    Arr.prototype.filterImplicitObjects = Call.prototype.filterImplicitObjects;
    Arr.prototype.compileNode = function(o) {
      var code, obj, objs;
      if (!this.objects.length) {
        return '[]';
      }
      o.indent += TAB;
      objs = this.filterImplicitObjects(this.objects);
      if (code = Splat.compileSplattedArray(o, objs)) {
        return code;
      }
      code = ((function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = objs.length; _i < _len; _i++) {
          obj = objs[_i];
          _results.push(obj.compile(o, LEVEL_LIST));
        }
        return _results;
      })()).join(', ');
      if (code.indexOf('\n') >= 0) {
        return "[\n" + o.indent + code + "\n" + this.tab + "]";
      } else {
        return "[" + code + "]";
      }
    };
    Arr.prototype.assigns = function(name) {
      var obj, _i, _len, _ref2;
      _ref2 = this.objects;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        obj = _ref2[_i];
        if (obj.assigns(name)) {
          return true;
        }
      }
      return false;
    };
    return Arr;
  })();
  exports.Class = Class = (function() {
    __extends(Class, Base);
    function Class(variable, parent, body) {
      this.variable = variable;
      this.parent = parent;
      this.body = body != null ? body : new Block;
      this.boundFuncs = [];
      this.body.classBody = true;
    }
    Class.prototype.children = ['variable', 'parent', 'body'];
    Class.prototype.determineName = function(o) {
      var decl, tail;
      if (!this.variable) {
        return null;
      }
      if (o.google || o.closure) {
        return this.variable.compile(o);
      }
      decl = (tail = last(this.variable.properties)) ? tail instanceof Access && tail.name.value : this.variable.base.value;
      return decl && (decl = IDENTIFIER.test(decl) && decl);
    };
    Class.prototype.setContext = function(name) {
      return this.body.traverseChildren(false, function(node) {
        if (node.classBody) {
          return false;
        }
        if (node instanceof Literal && node.value === 'this') {
          return node.value = name;
        } else if (node instanceof Code) {
          node.klass = name;
          if (node.bound) {
            return node.context = name;
          }
        }
      });
    };
    Class.prototype.addBoundFunctions = function(o) {
      var bvar, lhs, _i, _len, _ref2, _results;
      if (this.boundFuncs.length) {
        _ref2 = this.boundFuncs;
        _results = [];
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          bvar = _ref2[_i];
          lhs = (new Value(new Literal("this"), [new Access(bvar)])).compile(o);
          _results.push(this.ctor.body.unshift(new Literal("" + lhs + " = " + (utility('bind', o)) + "(" + lhs + ", this)")));
        }
        return _results;
      }
    };
    Class.prototype.addProperties = function(node, name, o) {
      var assign, base, exprs, func, props;
      props = node.base.properties.slice(0);
      exprs = (function() {
        var _results;
        _results = [];
        while (assign = props.shift()) {
          if (assign instanceof Assign) {
            base = assign.variable.base;
            delete assign.context;
            func = assign.value;
            if (base.value === 'constructor') {
              if (this.ctor) {
                throw new Error('cannot define more than one constructor in a class');
              }
              if (func.bound) {
                throw new Error('cannot define a constructor as a bound function');
              }
              if (func instanceof Code) {
                assign = this.ctor = func;
              } else {
                this.externalCtor = o.scope.freeVariable('class');
                assign = new Assign(new Literal(this.externalCtor), func);
              }
            } else {
              if (!assign.variable["this"]) {
                assign.variable = new Value(new Literal(name), [new Access(base, 'proto')]);
              }
              if (func instanceof Code && func.bound) {
                this.boundFuncs.push(base);
                func.bound = false;
              }
            }
          }
          _results.push(assign);
        }
        return _results;
      }).call(this);
      return compact(exprs);
    };
    Class.prototype.walkBody = function(name, o) {
      return this.traverseChildren(false, __bind(function(child) {
        var exps, i, node, _len, _ref2;
        if (child instanceof Class) {
          return false;
        }
        if (child instanceof Block) {
          _ref2 = exps = child.expressions;
          for (i = 0, _len = _ref2.length; i < _len; i++) {
            node = _ref2[i];
            if (node instanceof Value && node.isObject(true)) {
              exps[i] = this.addProperties(node, name, o);
            }
          }
          return child.expressions = exps = flatten(exps);
        }
      }, this));
    };
    Class.prototype.ensureConstructor = function(name, o) {
      if (!this.ctor) {
        this.ctor = new Code;
        if (!o.google) {
          if (this.parent) {
            this.ctor.body.push(new Literal("" + name + ".__super__.constructor.apply(this, arguments)"));
          }
          if (this.externalCtor) {
            this.ctor.body.push(new Literal("" + this.externalCtor + ".apply(this, arguments)"));
          }
        }
        this.body.expressions.unshift(this.ctor);
      }
      this.ctor.ctor = this.ctor.name = name;
      this.ctor.klass = null;
      this.ctor.noReturn = true;
      return this.ctor.ctorParent = this.parent;
    };
    Class.prototype.compileNode = function(o) {
      var decl, klass, lname, name;
      decl = this.determineName(o);
      name = decl || this.name || '_Class';
      lname = new Literal(name);
      this.setContext(name);
      this.walkBody(name, o);
      this.ensureConstructor(name, o);
      if (this.parent && !o.google && !o.closure) {
        this.body.expressions.unshift(new Extends(lname, this.parent));
      }
      if (!(this.ctor instanceof Code)) {
        this.body.expressions.unshift(this.ctor);
      }
      if (!(o.google || o.closure)) {
        this.body.expressions.push(lname);
      }
      this.addBoundFunctions(o);
      if (o.google || o.closure) {
        return this.body.compile(o);
      } else {
        klass = new Parens(Closure.wrap(this.body), true);
        if (this.variable) {
          klass = new Assign(this.variable, klass);
        }
        return klass.compile(o);
      }
    };
    return Class;
  })();
  exports.Assign = Assign = (function() {
    __extends(Assign, Base);
    function Assign(variable, value, context, options) {
      this.variable = variable;
      this.value = value;
      this.context = context;
      this.param = options && options.param;
    }
    Assign.prototype.children = ['variable', 'value'];
    Assign.prototype.isStatement = function(o) {
      return (o != null ? o.level : void 0) === LEVEL_TOP && this.context && __indexOf.call(this.context, "?") >= 0;
    };
    Assign.prototype.assigns = function(name) {
      return this[this.context === 'object' ? 'value' : 'variable'].assigns(name);
    };
    Assign.prototype.unfoldSoak = function(o) {
      return unfoldSoak(o, this, 'variable');
    };
    Assign.prototype.compileNode = function(o) {
      var isValue, match, name, val, _ref2, _ref3, _ref4, _ref5;
      if (isValue = this.variable instanceof Value) {
        if (this.variable.isArray() || this.variable.isObject()) {
          return this.compilePatternMatch(o);
        }
        if (this.variable.isSplice()) {
          return this.compileSplice(o);
        }
        if ((_ref2 = this.context) === '||=' || _ref2 === '&&=' || _ref2 === '?=') {
          return this.compileConditional(o);
        }
      }
      name = this.variable.compile(o, LEVEL_LIST);
      if (!(this.context || this.variable.isAssignable())) {
        throw SyntaxError("\"" + (this.variable.compile(o)) + "\" cannot be assigned.");
      }
      if (!(this.context || isValue && (this.variable.namespaced || this.variable.hasProperties()))) {
        if (this.param) {
          o.scope.add(name, 'var');
        } else {
          o.scope.find(name);
        }
      }
      if (this.value instanceof Code && (match = METHOD_DEF.exec(name))) {
        if (match[1]) {
          this.value.klass = match[1];
        }
        this.value.name = (_ref3 = (_ref4 = (_ref5 = match[2]) != null ? _ref5 : match[3]) != null ? _ref4 : match[4]) != null ? _ref3 : match[5];
      }
      val = this.value.compile(o, LEVEL_LIST);
      if (this.context === 'object') {
        return "" + name + ": " + val;
      }
      val = name + (" " + (this.context || '=') + " ") + val;
      if (o.level <= LEVEL_LIST) {
        return val;
      } else {
        return "(" + val + ")";
      }
    };
    Assign.prototype.compilePatternMatch = function(o) {
      var acc, assigns, code, i, idx, isObject, ivar, obj, objects, olen, ref, rest, splat, top, val, value, vvar, _len, _ref2, _ref3, _ref4, _ref5;
      top = o.level === LEVEL_TOP;
      value = this.value;
      objects = this.variable.base.objects;
      if (!(olen = objects.length)) {
        code = value.compile(o);
        if (o.level >= LEVEL_OP) {
          return "(" + code + ")";
        } else {
          return code;
        }
      }
      isObject = this.variable.isObject();
      if (top && olen === 1 && !((obj = objects[0]) instanceof Splat)) {
        if (obj instanceof Assign) {
          _ref2 = obj, idx = _ref2.variable.base, obj = _ref2.value;
        } else {
          if (obj.base instanceof Parens) {
            _ref3 = new Value(obj.unwrapAll()).cacheReference(o), obj = _ref3[0], idx = _ref3[1];
          } else {
            idx = isObject ? obj["this"] ? obj.properties[0].name : obj : new Literal(0);
          }
        }
        acc = IDENTIFIER.test(idx.unwrap().value || 0);
        value = new Value(value);
        value.properties.push(new (acc ? Access : Index)(idx));
        return new Assign(obj, value, null, {
          param: this.param
        }).compile(o, LEVEL_TOP);
      }
      vvar = value.compile(o, LEVEL_LIST);
      assigns = [];
      splat = false;
      if (!IDENTIFIER.test(vvar) || this.variable.assigns(vvar)) {
        assigns.push("" + (ref = o.scope.freeVariable('ref')) + " = " + vvar);
        vvar = ref;
      }
      for (i = 0, _len = objects.length; i < _len; i++) {
        obj = objects[i];
        idx = i;
        if (isObject) {
          if (obj instanceof Assign) {
            _ref4 = obj, idx = _ref4.variable.base, obj = _ref4.value;
          } else {
            if (obj.base instanceof Parens) {
              _ref5 = new Value(obj.unwrapAll()).cacheReference(o), obj = _ref5[0], idx = _ref5[1];
            } else {
              idx = obj["this"] ? obj.properties[0].name : obj;
            }
          }
        }
        if (!splat && obj instanceof Splat) {
          val = "" + olen + " <= " + vvar + ".length ? " + (utility('slice', o)) + ".call(" + vvar + ", " + i;
          if (rest = olen - i - 1) {
            ivar = o.scope.freeVariable('i');
            val += ", " + ivar + " = " + vvar + ".length - " + rest + ") : (" + ivar + " = " + i + ", [])";
          } else {
            val += ") : []";
          }
          val = new Literal(val);
          splat = "" + ivar + "++";
        } else {
          if (obj instanceof Splat) {
            obj = obj.name.compile(o);
            throw SyntaxError("multiple splats are disallowed in an assignment: " + obj + " ...");
          }
          if (typeof idx === 'number') {
            idx = new Literal(splat || idx);
            acc = false;
          } else {
            acc = isObject && IDENTIFIER.test(idx.unwrap().value || 0);
          }
          val = new Value(new Literal(vvar), [new (acc ? Access : Index)(idx)]);
        }
        assigns.push(new Assign(obj, val, null, {
          param: this.param
        }).compile(o, LEVEL_TOP));
      }
      if (!top) {
        assigns.push(vvar);
      }
      code = assigns.join(', ');
      if (o.level < LEVEL_LIST) {
        return code;
      } else {
        return "(" + code + ")";
      }
    };
    Assign.prototype.compileConditional = function(o) {
      var left, rite, _ref2;
      _ref2 = this.variable.cacheReference(o), left = _ref2[0], rite = _ref2[1];
      if (__indexOf.call(this.context, "?") >= 0) {
        o.isExistentialEquals = true;
      }
      return new Op(this.context.slice(0, -1), left, new Assign(rite, this.value, '=')).compile(o);
    };
    Assign.prototype.compileSplice = function(o) {
      var code, exclusive, from, fromDecl, fromRef, name, to, valDef, valRef, _ref2, _ref3, _ref4;
      _ref2 = this.variable.properties.pop().range, from = _ref2.from, to = _ref2.to, exclusive = _ref2.exclusive;
      name = this.variable.compile(o);
      _ref3 = (from != null ? from.cache(o, LEVEL_OP) : void 0) || ['0', '0'], fromDecl = _ref3[0], fromRef = _ref3[1];
      if (to) {
        if ((from != null ? from.isSimpleNumber() : void 0) && to.isSimpleNumber()) {
          to = +to.compile(o) - +fromRef;
          if (!exclusive) {
            to += 1;
          }
        } else {
          to = to.compile(o) + ' - ' + fromRef;
          if (!exclusive) {
            to += ' + 1';
          }
        }
      } else {
        to = "9e9";
      }
      _ref4 = this.value.cache(o, LEVEL_LIST), valDef = _ref4[0], valRef = _ref4[1];
      code = "[].splice.apply(" + name + ", [" + fromDecl + ", " + to + "].concat(" + valDef + ")), " + valRef;
      if (o.level > LEVEL_TOP) {
        return "(" + code + ")";
      } else {
        return code;
      }
    };
    return Assign;
  })();
  exports.Code = Code = (function() {
    __extends(Code, Base);
    function Code(params, body, tag) {
      this.params = params || [];
      this.body = body || new Block;
      this.bound = tag === 'boundfunc';
      if (this.bound) {
        this.context = 'this';
      }
    }
    Code.prototype.children = ['params', 'body'];
    Code.prototype.isStatement = function() {
      return !!this.ctor;
    };
    Code.prototype.isGoogleConstructor = function(o) {
      return (o.google || o.closure) && this.ctor;
    };
    Code.prototype.jumps = NO;
    Code.prototype.compileNode = function(o) {
      var code, comments, exprs, i, idt, lit, p, param, ref, splats, v, val, vars, wasEmpty, _i, _j, _k, _len, _len2, _len3, _len4, _ref2, _ref3, _ref4, _ref5;
      o.scope = new Scope(o.scope, this.body, this);
      o.scope.shared = del(o, 'sharedScope');
      o.indent += TAB;
      delete o.bare;
      vars = [];
      exprs = [];
      _ref2 = this.params;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        param = _ref2[_i];
        if (param.splat) {
          _ref3 = this.params;
          for (_j = 0, _len2 = _ref3.length; _j < _len2; _j++) {
            p = _ref3[_j];
            if (p.name.value) {
              o.scope.add(p.name.value, 'var', true);
            }
          }
          splats = new Assign(new Value(new Arr((function() {
            var _k, _len3, _ref4, _results;
            _ref4 = this.params;
            _results = [];
            for (_k = 0, _len3 = _ref4.length; _k < _len3; _k++) {
              p = _ref4[_k];
              _results.push(p.asReference(o));
            }
            return _results;
          }).call(this))), new Value(new Literal('arguments')));
          break;
        }
      }
      _ref4 = this.params;
      for (_k = 0, _len3 = _ref4.length; _k < _len3; _k++) {
        param = _ref4[_k];
        if (param.isComplex()) {
          val = ref = param.asReference(o);
          if (param.value) {
            val = new Op('?', ref, param.value);
          }
          exprs.push(new Assign(new Value(param.name), val, '=', {
            param: true
          }));
        } else {
          ref = param;
          if (param.value) {
            lit = new Literal(ref.name.value + ' == null');
            val = new Assign(new Value(param.name), param.value, '=');
            exprs.push(new If(lit, val));
          }
        }
        if (!splats) {
          vars.push(ref);
        }
      }
      wasEmpty = this.body.isEmpty();
      if (splats) {
        exprs.unshift(splats);
      }
      if (exprs.length) {
        (_ref5 = this.body.expressions).unshift.apply(_ref5, exprs);
      }
      if (!splats) {
        for (i = 0, _len4 = vars.length; i < _len4; i++) {
          v = vars[i];
          o.scope.parameter(vars[i] = v.compile(o));
        }
      }
      if (!(wasEmpty || this.noReturn)) {
        this.body.makeReturn();
      }
      idt = o.indent;
      comments = this.addFunctionComments(o);
      code = '';
      if (comments !== '') {
        if (!this.isPreviousNodeAComment(o)) {
          code += "" + this.tab + "/**\n";
        }
        code += comments;
        code += "*/\n";
      }
      code += this.addFunctionDeclaration(o);
      code += '(' + vars.join(', ') + ') {';
      if (!this.body.isEmpty()) {
        code += "\n" + (this.body.compileWithDeclarations(o)) + "\n" + this.tab;
      }
      code += this.closeBlock(o);
      if (this.ctor) {
        return this.tab + code;
      }
      if (this.bound) {
        return utility('bind', o) + ("(" + code + ", " + this.context + ")");
      }
      if (this.front || (o.level >= LEVEL_ACCESS)) {
        return "(" + code + ")";
      } else {
        return code;
      }
    };
    Code.prototype.addFunctionComments = function(o) {
      var code, extendsJsDoc, parentClassName, _ref2, _ref3;
      if (o.closure_nodoc) {
        return '';
      }
      code = '';
      code += this.addParamAnnotations(o);
      if (this.isGoogleConstructor(o)) {
        extendsJsDoc = "";
        if (this.ctorParent) {
          parentClassName = this.ctorParent.compile(o);
          if ((_ref2 = o.google) != null) {
            _ref2.includes.push({
              name: parentClassName,
              alias: null
            });
          }
          extendsJsDoc = "" + this.tab + "@extends {" + parentClassName + "}\n";
        }
        if ((_ref3 = o.google) != null) {
          _ref3.provides.push(this.name);
        }
        code += "" + this.tab + "@constructor\n" + extendsJsDoc + this.tab;
      }
      return code;
    };
    Code.prototype.isPreviousNodeAComment = function(o) {
      var foundNode, lastNode, previousNodeIsComment, topBlock;
      topBlock = new Block(o.scope.parent.expressions.expressions);
      previousNodeIsComment = false;
      lastNode = null;
      foundNode = false;
      topBlock.contains(__bind(function(node) {
        if (this.ctor !== void 0 && node.ctor === this.ctor) {
          foundNode = true;
          return true;
        }
        if (!foundNode) {
          lastNode = node;
        }
        return false;
      }, this));
      previousNodeIsComment = (lastNode != null ? lastNode.comment : void 0) != null;
      return previousNodeIsComment;
    };
    Code.prototype.extractMethodAsString = function(value) {};
    Code.prototype.addParamAnnotations = function(o) {
      var code, defaultParam, i, inference, m, name, param, parsed, re, tMode, _len, _ref10, _ref11, _ref12, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9;
      code = '';
      if (o.closure && o.closure_infer) {
        _ref2 = this.params;
        for (i = 0, _len = _ref2.length; i < _len; i++) {
          param = _ref2[i];
          tMode = false;
          if (((_ref3 = param.value) != null ? (_ref4 = _ref3.variable) != null ? (_ref5 = _ref4.base) != null ? _ref5.value : void 0 : void 0 : void 0) === '__') {
            defaultParam = (_ref6 = param.value) != null ? (_ref7 = _ref6.args) != null ? (_ref8 = _ref7[0]) != null ? _ref8.base.value : void 0 : void 0 : void 0;
            tMode = true;
          } else if (((_ref9 = param.value) != null ? (_ref10 = _ref9.base) != null ? _ref10.value : void 0 : void 0) != null) {
            defaultParam = (_ref11 = param.value) != null ? (_ref12 = _ref11.base) != null ? _ref12.value : void 0 : void 0;
          } else {

          }
          name = param.name.value;
          re = RegExp(/^[\/']([\/{].*[\/}])[\/']$/);
          m = re.exec(defaultParam);
          if (m != null) {
            code += "" + this.tab + "@param " + m[1] + " " + name + "\n";
          } else if (tMode) {
            parsed = parseInt(defaultParam);
            if (isNaN(parsed)) {
              inference = this.type(defaultParam);
            } else {
              inference = this.type(parsed);
            }
            if (inference === 'function') {
              code += "" + this.tab + "@param {" + inference + "()=} " + name + "\n";
            } else if (inference !== 'undefined') {
              code += "" + this.tab + "@param {" + inference + "=} " + name + "\n";
            }
          }
        }
      }
      return code;
    };
    Code.prototype.addFunctionDeclaration = function(o) {
      var code, namespaces;
      code = '';
      if (!this.isGoogleConstructor(o)) {
        code += 'function';
        if (this.ctor) {
          code += ' ' + this.name;
        }
      } else if (o.closure) {
        namespaces = this.name.split("\.");
        if (namespaces.length === 1) {
          code += "var " + this.tab + this.name + " = function";
        } else {
          code += "" + this.tab + this.name + " = function";
        }
      } else {
        code += "" + this.tab + this.name + " = function";
      }
      return code;
    };
    Code.prototype.closeBlock = function(o) {
      var code, extendsNode;
      code = '';
      if (this.isGoogleConstructor(o)) {
        code += '};';
        if (this.ctorParent) {
          extendsNode = new Extends(new Literal(this.name), this.ctorParent);
          code += '\n' + extendsNode.compile(o) + ';';
        }
        code += '\n';
      } else {
        code += '}';
      }
      return code;
    };
    Code.prototype.traverseChildren = function(crossScope, func) {
      if (crossScope) {
        return Code.__super__.traverseChildren.call(this, crossScope, func);
      }
    };
    Code.prototype.type = function(o) {
      var TOSTRING, TYPES;
      TYPES = {
        'undefined': 'undefined',
        'number': 'number',
        'boolean': 'boolean',
        'string': 'string',
        '[object Function]': 'function',
        '[object RegExp]': 'regexp',
        '[object Array]': 'array',
        '[object Date]': 'date',
        '[object Error]': 'error'
      };
      TOSTRING = Object.prototype.toString;
      return TYPES[typeof o] || TYPES[TOSTRING.call(o)] || (o != null ? o : {
        'object': 'null'
      });
    };
    return Code;
  })();
  exports.Param = Param = (function() {
    __extends(Param, Base);
    function Param(name, value, splat) {
      this.name = name;
      this.value = value;
      this.splat = splat;
    }
    Param.prototype.children = ['name', 'value'];
    Param.prototype.compile = function(o) {
      return this.name.compile(o, LEVEL_LIST);
    };
    Param.prototype.asReference = function(o) {
      var node;
      if (this.reference) {
        return this.reference;
      }
      node = this.name;
      if (node["this"]) {
        node = node.properties[0].name;
        if (node.value.reserved) {
          node = new Literal('_' + node.value);
        }
      } else if (node.isComplex()) {
        node = new Literal(o.scope.freeVariable('arg'));
      }
      node = new Value(node);
      if (this.splat) {
        node = new Splat(node);
      }
      return this.reference = node;
    };
    Param.prototype.isComplex = function() {
      return this.name.isComplex();
    };
    return Param;
  })();
  exports.Splat = Splat = (function() {
    __extends(Splat, Base);
    Splat.prototype.children = ['name'];
    Splat.prototype.isAssignable = YES;
    function Splat(name) {
      this.name = name.compile ? name : new Literal(name);
    }
    Splat.prototype.assigns = function(name) {
      return this.name.assigns(name);
    };
    Splat.prototype.compile = function(o) {
      if (this.index != null) {
        return this.compileParam(o);
      } else {
        return this.name.compile(o);
      }
    };
    Splat.compileSplattedArray = function(o, list, apply) {
      var args, base, code, i, index, node, _len;
      index = -1;
      while ((node = list[++index]) && !(node instanceof Splat)) {
        continue;
      }
      if (index >= list.length) {
        return '';
      }
      if (list.length === 1) {
        code = list[0].compile(o, LEVEL_LIST);
        if (apply) {
          return code;
        }
        return "" + (utility('slice', o)) + ".call(" + code + ")";
      }
      args = list.slice(index);
      for (i = 0, _len = args.length; i < _len; i++) {
        node = args[i];
        code = node.compile(o, LEVEL_LIST);
        args[i] = node instanceof Splat ? "" + (utility('slice', o)) + ".call(" + code + ")" : "[" + code + "]";
      }
      if (index === 0) {
        return args[0] + (".concat(" + (args.slice(1).join(', ')) + ")");
      }
      base = (function() {
        var _i, _len2, _ref2, _results;
        _ref2 = list.slice(0, index);
        _results = [];
        for (_i = 0, _len2 = _ref2.length; _i < _len2; _i++) {
          node = _ref2[_i];
          _results.push(node.compile(o, LEVEL_LIST));
        }
        return _results;
      })();
      return "[" + (base.join(', ')) + "].concat(" + (args.join(', ')) + ")";
    };
    return Splat;
  })();
  exports.While = While = (function() {
    __extends(While, Base);
    function While(condition, options) {
      this.condition = (options != null ? options.invert : void 0) ? condition.invert() : condition;
      this.guard = options != null ? options.guard : void 0;
    }
    While.prototype.children = ['condition', 'guard', 'body'];
    While.prototype.isStatement = YES;
    While.prototype.makeReturn = function() {
      this.returns = true;
      return this;
    };
    While.prototype.addBody = function(body) {
      this.body = body;
      return this;
    };
    While.prototype.jumps = function() {
      var expressions, node, _i, _len;
      expressions = this.body.expressions;
      if (!expressions.length) {
        return false;
      }
      for (_i = 0, _len = expressions.length; _i < _len; _i++) {
        node = expressions[_i];
        if (node.jumps({
          loop: true
        })) {
          return node;
        }
      }
      return false;
    };
    While.prototype.compileNode = function(o) {
      var body, code, rvar, set;
      o.indent += TAB;
      set = '';
      body = this.body;
      if (body.isEmpty()) {
        body = '';
      } else {
        if (o.level > LEVEL_TOP || this.returns) {
          rvar = o.scope.freeVariable('results');
          set = "" + this.tab + rvar + " = [];\n";
          if (body) {
            body = Push.wrap(rvar, body);
          }
        }
        if (this.guard) {
          body = Block.wrap([new If(this.guard, body)]);
        }
        body = "\n" + (body.compile(o, LEVEL_TOP)) + "\n" + this.tab;
      }
      code = set + this.tab + ("while (" + (this.condition.compile(o, LEVEL_PAREN)) + ") {" + body + "}");
      if (this.returns) {
        code += "\n" + this.tab + "return " + rvar + ";";
      }
      return code;
    };
    return While;
  })();
  exports.Op = Op = (function() {
    var CONVERSIONS, INVERSIONS;
    __extends(Op, Base);
    function Op(op, first, second, flip) {
      var call;
      if (op === 'in') {
        return new In(first, second);
      }
      if (op === 'do') {
        call = new Call(first, first.params || []);
        call["do"] = true;
        return call;
      }
      if (op === 'new') {
        if (first instanceof Call && !first["do"] && !first.isNew) {
          return first.newInstance();
        }
        if (first instanceof Code && first.bound || first["do"]) {
          first = new Parens(first);
        }
      }
      this.operator = CONVERSIONS[op] || op;
      this.first = first;
      this.second = second;
      this.flip = !!flip;
      return this;
    }
    CONVERSIONS = {
      '==': '===',
      '!=': '!==',
      'of': 'in'
    };
    INVERSIONS = {
      '!==': '===',
      '===': '!=='
    };
    Op.prototype.children = ['first', 'second'];
    Op.prototype.isSimpleNumber = NO;
    Op.prototype.isUnary = function() {
      return !this.second;
    };
    Op.prototype.isComplex = function() {
      var _ref2;
      return !(this.isUnary() && ((_ref2 = this.operator) === '+' || _ref2 === '-')) || this.first.isComplex();
    };
    Op.prototype.isChainable = function() {
      var _ref2;
      return (_ref2 = this.operator) === '<' || _ref2 === '>' || _ref2 === '>=' || _ref2 === '<=' || _ref2 === '===' || _ref2 === '!==';
    };
    Op.prototype.invert = function() {
      var allInvertable, curr, fst, op, _ref2;
      if (this.isChainable() && this.first.isChainable()) {
        allInvertable = true;
        curr = this;
        while (curr && curr.operator) {
          allInvertable && (allInvertable = curr.operator in INVERSIONS);
          curr = curr.first;
        }
        if (!allInvertable) {
          return new Parens(this).invert();
        }
        curr = this;
        while (curr && curr.operator) {
          curr.invert = !curr.invert;
          curr.operator = INVERSIONS[curr.operator];
          curr = curr.first;
        }
        return this;
      } else if (op = INVERSIONS[this.operator]) {
        this.operator = op;
        if (this.first.unwrap() instanceof Op) {
          this.first.invert();
        }
        return this;
      } else if (this.second) {
        return new Parens(this).invert();
      } else if (this.operator === '!' && (fst = this.first.unwrap()) instanceof Op && ((_ref2 = fst.operator) === '!' || _ref2 === 'in' || _ref2 === 'instanceof')) {
        return fst;
      } else {
        return new Op('!', this);
      }
    };
    Op.prototype.unfoldSoak = function(o) {
      var _ref2;
      return ((_ref2 = this.operator) === '++' || _ref2 === '--' || _ref2 === 'delete') && unfoldSoak(o, this, 'first');
    };
    Op.prototype.compileNode = function(o) {
      var code;
      if (this.isUnary()) {
        return this.compileUnary(o);
      }
      if (this.isChainable() && this.first.isChainable()) {
        return this.compileChain(o);
      }
      if (this.operator === '?') {
        return this.compileExistence(o);
      }
      this.first.front = this.front;
      code = this.first.compile(o, LEVEL_OP) + ' ' + this.operator + ' ' + this.second.compile(o, LEVEL_OP);
      if (o.level <= LEVEL_OP) {
        return code;
      } else {
        return "(" + code + ")";
      }
    };
    Op.prototype.compileChain = function(o) {
      var code, fst, shared, _ref2;
      _ref2 = this.first.second.cache(o), this.first.second = _ref2[0], shared = _ref2[1];
      fst = this.first.compile(o, LEVEL_OP);
      code = "" + fst + " " + (this.invert ? '&&' : '||') + " " + (shared.compile(o)) + " " + this.operator + " " + (this.second.compile(o, LEVEL_OP));
      return "(" + code + ")";
    };
    Op.prototype.compileExistence = function(o) {
      var fst, ref;
      if (this.first.isComplex()) {
        ref = new Literal(o.scope.freeVariable('ref'));
        fst = new Parens(new Assign(ref, this.first));
      } else {
        fst = this.first;
        ref = fst;
      }
      return new If(new Existence(fst), ref, {
        type: 'if'
      }).addElse(this.second).compile(o);
    };
    Op.prototype.compileUnary = function(o) {
      var op, parts;
      parts = [op = this.operator];
      if ((op === 'new' || op === 'typeof' || op === 'delete') || (op === '+' || op === '-') && this.first instanceof Op && this.first.operator === op) {
        parts.push(' ');
      }
      if (op === 'new' && this.first.isStatement(o)) {
        this.first = new Parens(this.first);
      }
      parts.push(this.first.compile(o, LEVEL_OP));
      if (this.flip) {
        parts.reverse();
      }
      return parts.join('');
    };
    Op.prototype.toString = function(idt) {
      return Op.__super__.toString.call(this, idt, this.constructor.name + ' ' + this.operator);
    };
    return Op;
  })();
  exports.In = In = (function() {
    __extends(In, Base);
    function In(object, array) {
      this.object = object;
      this.array = array;
    }
    In.prototype.children = ['object', 'array'];
    In.prototype.invert = NEGATE;
    In.prototype.compileNode = function(o) {
      var hasSplat, obj, _i, _len, _ref2;
      if (this.array instanceof Value && this.array.isArray()) {
        _ref2 = this.array.base.objects;
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          obj = _ref2[_i];
          if (obj instanceof Splat) {
            hasSplat = true;
            break;
          }
        }
        if (!hasSplat) {
          return this.compileOrTest(o);
        }
      }
      return this.compileLoopTest(o);
    };
    In.prototype.compileOrTest = function(o) {
      var cmp, cnj, i, item, ref, sub, tests, _ref2, _ref3;
      _ref2 = this.object.cache(o, LEVEL_OP), sub = _ref2[0], ref = _ref2[1];
      _ref3 = this.negated ? [' !== ', ' && '] : [' === ', ' || '], cmp = _ref3[0], cnj = _ref3[1];
      tests = (function() {
        var _len, _ref4, _results;
        _ref4 = this.array.base.objects;
        _results = [];
        for (i = 0, _len = _ref4.length; i < _len; i++) {
          item = _ref4[i];
          _results.push((i ? ref : sub) + cmp + item.compile(o, LEVEL_OP));
        }
        return _results;
      }).call(this);
      if (tests.length === 0) {
        return 'false';
      }
      tests = tests.join(cnj);
      if (o.level < LEVEL_OP) {
        return tests;
      } else {
        return "(" + tests + ")";
      }
    };
    In.prototype.compileLoopTest = function(o) {
      var code, ref, sub, _ref2;
      _ref2 = this.object.cache(o, LEVEL_LIST), sub = _ref2[0], ref = _ref2[1];
      code = utility('indexOf', o) + (".call(" + (this.array.compile(o, LEVEL_LIST)) + ", " + ref + ") ") + (this.negated ? '< 0' : '>= 0');
      if (sub === ref) {
        return code;
      }
      code = sub + ', ' + code;
      if (o.level < LEVEL_LIST) {
        return code;
      } else {
        return "(" + code + ")";
      }
    };
    In.prototype.toString = function(idt) {
      return In.__super__.toString.call(this, idt, this.constructor.name + (this.negated ? '!' : ''));
    };
    return In;
  })();
  exports.Try = Try = (function() {
    __extends(Try, Base);
    function Try(attempt, error, recovery, ensure) {
      this.attempt = attempt;
      this.error = error;
      this.recovery = recovery;
      this.ensure = ensure;
    }
    Try.prototype.children = ['attempt', 'recovery', 'ensure'];
    Try.prototype.isStatement = YES;
    Try.prototype.jumps = function(o) {
      var _ref2;
      return this.attempt.jumps(o) || ((_ref2 = this.recovery) != null ? _ref2.jumps(o) : void 0);
    };
    Try.prototype.makeReturn = function() {
      if (this.attempt) {
        this.attempt = this.attempt.makeReturn();
      }
      if (this.recovery) {
        this.recovery = this.recovery.makeReturn();
      }
      return this;
    };
    Try.prototype.compileNode = function(o) {
      var catchPart, errorPart;
      o.indent += TAB;
      errorPart = this.error ? " (" + (this.error.compile(o)) + ") " : ' ';
      catchPart = this.recovery ? (o.scope.add(this.error.value, 'param'), " catch" + errorPart + "{\n" + (this.recovery.compile(o, LEVEL_TOP)) + "\n" + this.tab + "}") : !(this.ensure || this.recovery) ? ' catch (_e) {}' : void 0;
      return ("" + this.tab + "try {\n" + (this.attempt.compile(o, LEVEL_TOP)) + "\n" + this.tab + "}" + (catchPart || '')) + (this.ensure ? " finally {\n" + (this.ensure.compile(o, LEVEL_TOP)) + "\n" + this.tab + "}" : '');
    };
    return Try;
  })();
  exports.Throw = Throw = (function() {
    __extends(Throw, Base);
    function Throw(expression) {
      this.expression = expression;
    }
    Throw.prototype.children = ['expression'];
    Throw.prototype.isStatement = YES;
    Throw.prototype.jumps = NO;
    Throw.prototype.makeReturn = THIS;
    Throw.prototype.compileNode = function(o) {
      return this.tab + ("throw " + (this.expression.compile(o)) + ";");
    };
    return Throw;
  })();
  exports.Include = Include = (function() {
    __extends(Include, Base);
    function Include(namespace, alias) {
      this.namespace = namespace;
      this.alias = alias != null ? alias : null;
    }
    Include.prototype.compileNode = function(o) {
      var _ref2;
      if ((_ref2 = o.google) != null) {
        _ref2.includes.push({
          name: this.namespace.flatten(),
          alias: this.alias
        });
      }
      return "";
    };
    return Include;
  })();
  exports.Namespace = Namespace = (function() {
    __extends(Namespace, Base);
    function Namespace(identifier, namespace) {
      this.identifier = identifier;
      this.namespace = namespace != null ? namespace : null;
    }
    Namespace.prototype.flatten = function() {
      var ids, ns;
      ns = this.namespace;
      ids = [this.identifier];
      while (ns) {
        ids.unshift(ns.identifier);
        ns = ns.namespace;
      }
      return ids.join('.');
    };
    Namespace.prototype.compileNode = function(o) {
      return this.flatten();
    };
    return Namespace;
  })();
  exports.Existence = Existence = (function() {
    __extends(Existence, Base);
    function Existence(expression) {
      this.expression = expression;
    }
    Existence.prototype.children = ['expression'];
    Existence.prototype.invert = NEGATE;
    Existence.prototype.compileNode = function(o) {
      var cmp, cnj, code, _ref2;
      code = this.expression.compile(o, LEVEL_OP);
      code = IDENTIFIER.test(code) && !o.scope.check(code) ? ((_ref2 = this.negated ? ['===', '||'] : ['!==', '&&'], cmp = _ref2[0], cnj = _ref2[1], _ref2), "typeof " + code + " " + cmp + " \"undefined\" " + cnj + " " + code + " " + cmp + " null") : "" + code + " " + (this.negated ? '==' : '!=') + " null";
      if (o.level <= LEVEL_COND) {
        return code;
      } else {
        return "(" + code + ")";
      }
    };
    return Existence;
  })();
  exports.Parens = Parens = (function() {
    __extends(Parens, Base);
    function Parens(body) {
      this.body = body;
    }
    Parens.prototype.children = ['body'];
    Parens.prototype.unwrap = function() {
      return this.body;
    };
    Parens.prototype.isComplex = function() {
      return this.body.isComplex();
    };
    Parens.prototype.makeReturn = function() {
      return this.body.makeReturn();
    };
    Parens.prototype.compileNode = function(o) {
      var bare, code, expr;
      expr = this.body.unwrap();
      if (expr instanceof Value && expr.isAtomic()) {
        expr.front = this.front;
        return expr.compile(o);
      }
      code = expr.compile(o, LEVEL_PAREN);
      bare = o.level < LEVEL_OP && (expr instanceof Op || expr instanceof Call || (expr instanceof For && expr.returns));
      if (bare) {
        return code;
      } else {
        return "(" + code + ")";
      }
    };
    return Parens;
  })();
  exports.For = For = (function() {
    __extends(For, Base);
    function For(body, source) {
      var _ref2;
      this.source = source.source, this.guard = source.guard, this.step = source.step, this.name = source.name, this.index = source.index;
      this.body = Block.wrap([body]);
      this.own = !!source.own;
      this.object = !!source.object;
      if (this.object) {
        _ref2 = [this.index, this.name], this.name = _ref2[0], this.index = _ref2[1];
      }
      if (this.index instanceof Value) {
        throw SyntaxError('index cannot be a pattern matching expression');
      }
      this.range = this.source instanceof Value && this.source.base instanceof Range && !this.source.properties.length;
      this.pattern = this.name instanceof Value;
      if (this.range && this.index) {
        throw SyntaxError('indexes do not apply to range loops');
      }
      if (this.range && this.pattern) {
        throw SyntaxError('cannot pattern match over range loops');
      }
      this.returns = false;
    }
    For.prototype.children = ['body', 'source', 'guard', 'step'];
    For.prototype.isStatement = YES;
    For.prototype.jumps = While.prototype.jumps;
    For.prototype.makeReturn = function() {
      this.returns = true;
      return this;
    };
    For.prototype.compileNode = function(o) {
      var body, defPart, forPart, forVarPart, guardPart, idt1, index, ivar, lastJumps, lvar, name, namePart, ref, resultPart, returnResult, rvar, scope, source, stepPart, stepvar, svar, varPart, _ref2;
      body = Block.wrap([this.body]);
      lastJumps = (_ref2 = last(body.expressions)) != null ? _ref2.jumps() : void 0;
      if (lastJumps && lastJumps instanceof Return) {
        this.returns = false;
      }
      source = this.range ? this.source.base : this.source;
      scope = o.scope;
      name = this.name && this.name.compile(o, LEVEL_LIST);
      index = this.index && this.index.compile(o, LEVEL_LIST);
      if (name && !this.pattern) {
        scope.find(name, {
          immediate: true
        });
      }
      if (index) {
        scope.find(index, {
          immediate: true
        });
      }
      if (this.returns) {
        rvar = scope.freeVariable('results');
      }
      ivar = (this.range ? name : index) || scope.freeVariable('i');
      if (this.step && !this.range) {
        stepvar = scope.freeVariable("step");
      }
      if (this.pattern) {
        name = ivar;
      }
      varPart = '';
      guardPart = '';
      defPart = '';
      idt1 = this.tab + TAB;
      if (this.range) {
        forPart = source.compile(merge(o, {
          index: ivar,
          step: this.step
        }));
      } else {
        svar = this.source.compile(o, LEVEL_LIST);
        if ((name || this.own) && !IDENTIFIER.test(svar)) {
          defPart = "" + this.tab + (ref = scope.freeVariable('ref')) + " = " + svar + ";\n";
          svar = ref;
        }
        if (name && !this.pattern) {
          namePart = "" + name + " = " + svar + "[" + ivar + "]";
        }
        if (!this.object) {
          lvar = scope.freeVariable('len');
          forVarPart = ("" + ivar + " = 0, " + lvar + " = " + svar + ".length") + (this.step ? ", " + stepvar + " = " + (this.step.compile(o, LEVEL_OP)) : '');
          stepPart = this.step ? "" + ivar + " += " + stepvar : "" + ivar + "++";
          forPart = "" + forVarPart + "; " + ivar + " < " + lvar + "; " + stepPart;
        }
      }
      if (this.returns) {
        resultPart = "" + this.tab + rvar + " = [];\n";
        returnResult = "\n" + this.tab + "return " + rvar + ";";
        body = Push.wrap(rvar, body);
      }
      if (this.guard) {
        body = Block.wrap([new If(this.guard, body)]);
      }
      if (this.pattern) {
        body.expressions.unshift(new Assign(this.name, new Literal("" + svar + "[" + ivar + "]")));
      }
      defPart += this.pluckDirectCall(o, body);
      if (namePart) {
        varPart = "\n" + idt1 + namePart + ";";
      }
      if (this.object) {
        forPart = "" + ivar + " in " + svar;
        if (this.own) {
          guardPart = "\n" + idt1 + "if (!" + (utility('hasProp', o)) + ".call(" + svar + ", " + ivar + ")) continue;";
        }
      }
      body = body.compile(merge(o, {
        indent: idt1
      }), LEVEL_TOP);
      if (body) {
        body = '\n' + body + '\n';
      }
      return "" + defPart + (resultPart || '') + this.tab + "for (" + forPart + ") {" + guardPart + varPart + body + this.tab + "}" + (returnResult || '');
    };
    For.prototype.pluckDirectCall = function(o, body) {
      var base, defs, expr, fn, idx, ref, val, _len, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7;
      defs = '';
      _ref2 = body.expressions;
      for (idx = 0, _len = _ref2.length; idx < _len; idx++) {
        expr = _ref2[idx];
        expr = expr.unwrapAll();
        if (!(expr instanceof Call)) {
          continue;
        }
        val = expr.variable.unwrapAll();
        if (!((val instanceof Code) || (val instanceof Value && ((_ref3 = val.base) != null ? _ref3.unwrapAll() : void 0) instanceof Code && val.properties.length === 1 && ((_ref4 = (_ref5 = val.properties[0].name) != null ? _ref5.value : void 0) === 'call' || _ref4 === 'apply')))) {
          continue;
        }
        fn = ((_ref6 = val.base) != null ? _ref6.unwrapAll() : void 0) || val;
        ref = new Literal(o.scope.freeVariable('fn'));
        base = new Value(ref);
        if (val.base) {
          _ref7 = [base, val], val.base = _ref7[0], base = _ref7[1];
        }
        body.expressions[idx] = new Call(base, expr.args);
        defs += this.tab + new Assign(ref, fn).compile(o, LEVEL_TOP) + ';\n';
      }
      return defs;
    };
    return For;
  })();
  exports.Switch = Switch = (function() {
    __extends(Switch, Base);
    function Switch(subject, cases, otherwise) {
      this.subject = subject;
      this.cases = cases;
      this.otherwise = otherwise;
    }
    Switch.prototype.children = ['subject', 'cases', 'otherwise'];
    Switch.prototype.isStatement = YES;
    Switch.prototype.jumps = function(o) {
      var block, conds, _i, _len, _ref2, _ref3, _ref4;
      if (o == null) {
        o = {
          block: true
        };
      }
      _ref2 = this.cases;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        _ref3 = _ref2[_i], conds = _ref3[0], block = _ref3[1];
        if (block.jumps(o)) {
          return block;
        }
      }
      return (_ref4 = this.otherwise) != null ? _ref4.jumps(o) : void 0;
    };
    Switch.prototype.makeReturn = function() {
      var pair, _i, _len, _ref2, _ref3;
      _ref2 = this.cases;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        pair = _ref2[_i];
        pair[1].makeReturn();
      }
      if ((_ref3 = this.otherwise) != null) {
        _ref3.makeReturn();
      }
      return this;
    };
    Switch.prototype.compileNode = function(o) {
      var block, body, code, cond, conditions, expr, i, idt1, idt2, _i, _len, _len2, _ref2, _ref3, _ref4, _ref5;
      idt1 = o.indent + TAB;
      idt2 = o.indent = idt1 + TAB;
      code = this.tab + ("switch (" + (((_ref2 = this.subject) != null ? _ref2.compile(o, LEVEL_PAREN) : void 0) || false) + ") {\n");
      _ref3 = this.cases;
      for (i = 0, _len = _ref3.length; i < _len; i++) {
        _ref4 = _ref3[i], conditions = _ref4[0], block = _ref4[1];
        _ref5 = flatten([conditions]);
        for (_i = 0, _len2 = _ref5.length; _i < _len2; _i++) {
          cond = _ref5[_i];
          if (!this.subject) {
            cond = cond.invert();
          }
          code += idt1 + ("case " + (cond.compile(o, LEVEL_PAREN)) + ":\n");
        }
        if (body = block.compile(o, LEVEL_TOP)) {
          code += body + '\n';
        }
        if (i === this.cases.length - 1 && !this.otherwise) {
          break;
        }
        expr = this.lastNonComment(block.expressions);
        if (expr instanceof Return || (expr instanceof Literal && expr.jumps() && expr.value !== 'debugger')) {
          continue;
        }
        code += idt2 + 'break;\n';
      }
      if (this.otherwise && this.otherwise.expressions.length) {
        code += idt1 + ("default:\n" + (this.otherwise.compile(o, LEVEL_TOP)) + "\n");
      }
      return code + this.tab + '}';
    };
    return Switch;
  })();
  exports.If = If = (function() {
    __extends(If, Base);
    function If(condition, body, options) {
      this.body = body;
      if (options == null) {
        options = {};
      }
      this.condition = options.type === 'unless' ? condition.invert() : condition;
      this.elseBody = null;
      this.isChain = false;
      this.soak = options.soak;
    }
    If.prototype.children = ['condition', 'body', 'elseBody'];
    If.prototype.bodyNode = function() {
      var _ref2;
      return (_ref2 = this.body) != null ? _ref2.unwrap() : void 0;
    };
    If.prototype.elseBodyNode = function() {
      var _ref2;
      return (_ref2 = this.elseBody) != null ? _ref2.unwrap() : void 0;
    };
    If.prototype.addElse = function(elseBody) {
      if (this.isChain) {
        this.elseBodyNode().addElse(elseBody);
      } else {
        this.isChain = elseBody instanceof If;
        this.elseBody = this.ensureBlock(elseBody);
      }
      return this;
    };
    If.prototype.isStatement = function(o) {
      var _ref2;
      return (o != null ? o.level : void 0) === LEVEL_TOP || this.bodyNode().isStatement(o) || ((_ref2 = this.elseBodyNode()) != null ? _ref2.isStatement(o) : void 0);
    };
    If.prototype.jumps = function(o) {
      var _ref2;
      return this.body.jumps(o) || ((_ref2 = this.elseBody) != null ? _ref2.jumps(o) : void 0);
    };
    If.prototype.compileNode = function(o) {
      if (this.isStatement(o)) {
        return this.compileStatement(o);
      } else {
        return this.compileExpression(o);
      }
    };
    If.prototype.makeReturn = function() {
      this.body && (this.body = new Block([this.body.makeReturn()]));
      this.elseBody && (this.elseBody = new Block([this.elseBody.makeReturn()]));
      return this;
    };
    If.prototype.ensureBlock = function(node) {
      if (node instanceof Block) {
        return node;
      } else {
        return new Block([node]);
      }
    };
    If.prototype.compileStatement = function(o) {
      var body, child, cond, exeq, ifPart;
      child = del(o, 'chainChild');
      exeq = del(o, 'isExistentialEquals');
      if (exeq) {
        return new If(this.condition.invert(), this.elseBodyNode(), {
          type: 'if'
        }).compile(o);
      }
      cond = this.condition.compile(o, LEVEL_PAREN);
      o.indent += TAB;
      body = this.ensureBlock(this.body).compile(o);
      if (body) {
        body = "\n" + body + "\n" + this.tab;
      }
      ifPart = "if (" + cond + ") {" + body + "}";
      if (!child) {
        ifPart = this.tab + ifPart;
      }
      if (!this.elseBody) {
        return ifPart;
      }
      return ifPart + ' else ' + (this.isChain ? (o.indent = this.tab, o.chainChild = true, this.elseBody.unwrap().compile(o, LEVEL_TOP)) : "{\n" + (this.elseBody.compile(o, LEVEL_TOP)) + "\n" + this.tab + "}");
    };
    If.prototype.compileExpression = function(o) {
      var alt, body, code, cond;
      cond = this.condition.compile(o, LEVEL_COND);
      body = this.bodyNode().compile(o, LEVEL_LIST);
      alt = this.elseBodyNode() ? this.elseBodyNode().compile(o, LEVEL_LIST) : 'void 0';
      code = "" + cond + " ? " + body + " : " + alt;
      if (o.level >= LEVEL_COND) {
        return "(" + code + ")";
      } else {
        return code;
      }
    };
    If.prototype.unfoldSoak = function() {
      return this.soak && this;
    };
    return If;
  })();
  Push = {
    wrap: function(name, exps) {
      if (exps.isEmpty() || last(exps.expressions).jumps()) {
        return exps;
      }
      return exps.push(new Call(new Value(new Literal(name), [new Access(new Literal('push'))]), [exps.pop()]));
    }
  };
  Closure = {
    wrap: function(expressions, statement, noReturn) {
      var args, call, func, mentionsArgs, meth;
      if (expressions.jumps()) {
        return expressions;
      }
      func = new Code([], Block.wrap([expressions]));
      args = [];
      if ((mentionsArgs = expressions.contains(this.literalArgs)) || expressions.contains(this.literalThis)) {
        meth = new Literal(mentionsArgs ? 'apply' : 'call');
        args = [new Literal('this')];
        if (mentionsArgs) {
          args.push(new Literal('arguments'));
        }
        func = new Value(func, [new Access(meth)]);
      }
      func.noReturn = noReturn;
      call = new Call(func, args);
      if (statement) {
        return Block.wrap([call]);
      } else {
        return call;
      }
    },
    literalArgs: function(node) {
      return node instanceof Literal && node.value === 'arguments' && !node.asKey;
    },
    literalThis: function(node) {
      return (node instanceof Literal && node.value === 'this' && !node.asKey) || (node instanceof Code && node.bound);
    }
  };
  unfoldSoak = function(o, parent, name) {
    var ifn;
    if (!(ifn = parent[name].unfoldSoak(o))) {
      return;
    }
    parent[name] = ifn.body;
    ifn.body = new Value(parent);
    return ifn;
  };
  UTILITIES = {
    "extends": 'function(child, parent) {\n  for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }\n  /** @constructor */\n  function ctor() { this.constructor = child; }\n  ctor.prototype = parent.prototype;\n  child.prototype = new ctor;\n  child.__super__ = parent.prototype;\n  return child;\n}',
    bind: 'function(fn, me){ return function(){ return fn.apply(me, arguments); }; }',
    indexOf: 'Array.prototype.indexOf || function(item) {\n  for (var i = 0, l = this.length; i < l; i++) {\n    if (this[i] === item) return i;\n  }\n  return -1;\n}',
    hasProp: 'Object.prototype.hasOwnProperty',
    slice: 'Array.prototype.slice'
  };
  LEVEL_TOP = 1;
  LEVEL_PAREN = 2;
  LEVEL_LIST = 3;
  LEVEL_COND = 4;
  LEVEL_OP = 5;
  LEVEL_ACCESS = 6;
  TAB = '  ';
  IDENTIFIER_STR = "[$A-Za-z_\\x7f-\\uffff][$\\w\\x7f-\\uffff]*";
  IDENTIFIER = RegExp("^" + IDENTIFIER_STR + "$");
  SIMPLENUM = /^[+-]?\d+$/;
  METHOD_DEF = RegExp("^(?:(" + IDENTIFIER_STR + ")\\.prototype(?:\\.(" + IDENTIFIER_STR + ")|\\[(\"(?:[^\\\\\"\\r\\n]|\\\\.)*\"|'(?:[^\\\\'\\r\\n]|\\\\.)*')\\]|\\[(0x[\\da-fA-F]+|\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)\\]))|(" + IDENTIFIER_STR + ")$");
  IS_STRING = /^['"]/;
  utility = function(name, o) {
    var ref;
    if (o == null) {
      o = {};
    }
    ref = "__" + name;
    if (!o.noutil) {
      Scope.root.assign(ref, UTILITIES[name]);
    }
    return ref;
  };
  multident = function(code, tab) {
    return code.replace(/\n/g, '$&' + tab);
  };
}).call(this);


};require['./coffee-script'] = new function() {
  var exports = this;
  (function() {
  var Lexer, RESERVED, compile, fs, lexer, parser, path, vm, _ref;
  fs = require('fs');
  path = require('path');
  vm = require('vm');
  _ref = require('./lexer'), Lexer = _ref.Lexer, RESERVED = _ref.RESERVED;
  parser = require('./parser').parser;
  if (require.extensions) {
    require.extensions['.coffee'] = function(module, filename) {
      var content;
      content = compile(fs.readFileSync(filename, 'utf8'), {
        filename: filename
      });
      return module._compile(content, filename);
    };
  } else if (require.registerExtension) {
    require.registerExtension('.coffee', function(content) {
      return compile(content);
    });
  }
  exports.VERSION = '1.1.1';
  exports.RESERVED = RESERVED;
  exports.helpers = require('./helpers');
  exports.compile = compile = function(code, options) {
    var js;
    if (options == null) {
      options = {};
    }
    try {
      options.google = options.google ? {
        includes: [],
        provides: []
      } : null;
      js = (parser.parse(lexer.tokenize(code))).compile(options);
      return js + '\n';
    } catch (err) {
      if (options.filename) {
        err.message = "In " + options.filename + ", " + err.message;
      }
      throw err;
    }
  };
  exports.tokens = function(code, options) {
    return lexer.tokenize(code, options);
  };
  exports.nodes = function(source, options) {
    if (typeof source === 'string') {
      return parser.parse(lexer.tokenize(source, options));
    } else {
      return parser.parse(source);
    }
  };
  exports.run = function(code, options) {
    var Module, mainModule;
    mainModule = require.main;
    mainModule.filename = process.argv[1] = options.filename ? fs.realpathSync(options.filename) : '.';
    mainModule.moduleCache && (mainModule.moduleCache = {});
    if (process.binding('natives').module) {
      Module = require('module').Module;
      mainModule.paths = Module._nodeModulePaths(path.dirname(options.filename));
    }
    if (path.extname(mainModule.filename) !== '.coffee' || require.extensions) {
      return mainModule._compile(compile(code, options), mainModule.filename);
    } else {
      return mainModule._compile(code, mainModule.filename);
    }
  };
  exports.eval = function(code, options) {
    var g, js, k, o, sandbox, v, _i, _len, _ref2;
    if (options == null) {
      options = {};
    }
    if (!(code = code.trim())) {
      return;
    }
    sandbox = options.sandbox;
    if (!sandbox) {
      sandbox = {
        require: require,
        module: {
          exports: {}
        }
      };
      _ref2 = Object.getOwnPropertyNames(global);
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        g = _ref2[_i];
        sandbox[g] = global[g];
      }
      sandbox.global = sandbox;
      sandbox.global.global = sandbox.global.root = sandbox.global.GLOBAL = sandbox;
    }
    sandbox.__filename = options.filename || 'eval';
    sandbox.__dirname = path.dirname(sandbox.__filename);
    o = {};
    for (k in options) {
      v = options[k];
      o[k] = v;
    }
    o.bare = true;
    js = compile("_=(" + code + "\n)", o);
    return vm.runInNewContext(js, sandbox, sandbox.__filename);
  };
  lexer = new Lexer;
  parser.lexer = {
    lex: function() {
      var tag, _ref2;
      _ref2 = this.tokens[this.pos++] || [''], tag = _ref2[0], this.yytext = _ref2[1], this.yylineno = _ref2[2];
      return tag;
    },
    setInput: function(tokens) {
      this.tokens = tokens;
      return this.pos = 0;
    },
    upcomingInput: function() {
      return "";
    }
  };
  parser.yy = require('./nodes');
}).call(this);


};require['./browser'] = new function() {
  var exports = this;
  (function() {
  var CoffeeScript, runScripts;
  CoffeeScript = require('./coffee-script');
  CoffeeScript.require = require;
  CoffeeScript.eval = function(code, options) {
    return eval(CoffeeScript.compile(code, options));
  };
  CoffeeScript.run = function(code, options) {
    if (options == null) {
      options = {};
    }
    options.bare = true;
    return Function(CoffeeScript.compile(code, options))();
  };
  if (typeof window === "undefined" || window === null) {
    return;
  }
  CoffeeScript.load = function(url, callback) {
    var xhr;
    xhr = new (window.ActiveXObject || XMLHttpRequest)('Microsoft.XMLHTTP');
    xhr.open('GET', url, true);
    if ('overrideMimeType' in xhr) {
      xhr.overrideMimeType('text/plain');
    }
    xhr.onreadystatechange = function() {
      var _ref;
      if (xhr.readyState === 4) {
        if ((_ref = xhr.status) === 0 || _ref === 200) {
          CoffeeScript.run(xhr.responseText);
        } else {
          throw new Error("Could not load " + url);
        }
        if (callback) {
          return callback();
        }
      }
    };
    return xhr.send(null);
  };
  runScripts = function() {
    var coffees, execute, index, length, s, scripts;
    scripts = document.getElementsByTagName('script');
    coffees = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = scripts.length; _i < _len; _i++) {
        s = scripts[_i];
        if (s.type === 'text/coffeescript') {
          _results.push(s);
        }
      }
      return _results;
    })();
    index = 0;
    length = coffees.length;
    (execute = function() {
      var script;
      script = coffees[index++];
      if ((script != null ? script.type : void 0) === 'text/coffeescript') {
        if (script.src) {
          return CoffeeScript.load(script.src, execute);
        } else {
          CoffeeScript.run(script.innerHTML);
          return execute();
        }
      }
    })();
    return null;
  };
  if (window.addEventListener) {
    addEventListener('DOMContentLoaded', runScripts, false);
  } else {
    attachEvent('onload', runScripts);
  }
}).call(this);


};
  return require['./coffee-script']
}()