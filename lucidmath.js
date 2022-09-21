
(function(exports){

  var lucidmath_error = function (text, index, token, type) {
    return {text: text, index: index, token: token, type: type};
  };

  //General helper.
  var peek = function (arr) {
    return arr[arr.length-1];
  };

  //Predefined functions and their arity.
  var func_table = {
    '||': [2, function(s){var x = s.pop(), y = s.pop(); s.push(y || x);}],

    '&&': [2, function(s){var x = s.pop(), y = s.pop(); s.push(y && x);}],

    '==': [2, function(s){s.push(s.pop() == s.pop() ? 1 : 0);}],
    '!=': [2, function(s){s.push(s.pop() != s.pop() ? 1 : 0);}],
    '<>': [2, function(s){s.push(s.pop() != s.pop() ? 1 : 0);}],

    '<' : [2, function(s){s.push(s.pop() > s.pop() ? 1 : 0);}],
    '>' : [2, function(s){s.push(s.pop() < s.pop() ? 1 : 0);}],
    '<=': [2, function(s){s.push(s.pop() >= s.pop() ? 1 : 0);}],
    '>=': [2, function(s){s.push(s.pop() <= s.pop() ? 1 : 0);}],

    '+' : [2, function(s){s.push(s.pop() + s.pop());}],
    '-' : [2, function(s){var x = s.pop(), y = s.pop(); s.push(y - x);}],

    '*' : [2, function(s){s.push(s.pop() * s.pop());}],
    '%' : [2, function(s){var x = s.pop(), y = s.pop(); s.push(y % x);}],
    '/' : [2, function(s){var x = s.pop(), y = s.pop(); s.push(y / x);}],

    '^' : [2, function(s){var x = s.pop(), y = s.pop(); s.push(Math.pow(y, x));}],

    'sqrt' : [1, function(s){s.push(Math.sqrt(s.pop()));}],
    '!' : [1, function(s){s.push(s.pop() ? 0 : 1);}],
    'u-' : [1, function(s){s.push(-s.pop());}],

    'sin' : [1, function(s){s.push(Math.sin(s.pop()));}],
    'cos' : [1, function(s){s.push(Math.cos(s.pop()));}],
    'tan' : [1, function(s){s.push(Math.tan(s.pop()));}],

    'round' : [2, function(s){var x = s.pop(), y = s.pop(); s.push(Math.round(y/x)*x);}],

    'pi' : [0, function(s){s.push(Math.PI);}],
    'e' : [0, function(s){s.push(Math.E);}],
    'identity' : [1, function(s){s.push(s.pop());}],
    'abs' : [1, function(s){s.push(Math.abs(s.pop()));}],
    'log' : [1, function(s){s.push(Math.log(s.pop()) / Math.LN10);}],
    'ln' : [1, function(s){s.push(Math.log(s.pop()));}],
    'exp' : [1, function(s){s.push(Math.exp(s.pop()));}],

    'floor' : [1, function(s){s.push(Math.floor(s.pop()));}],
    'ceil' : [1, function(s){s.push(Math.ceil(s.pop()));}],
    'if' : [3, function(s){var x = s.pop(), y = s.pop(), z = s.pop(); s.push(z ? y : x);}]

  };

  //Associativity and store operator precedence (true for left associative).
  //All prefix operators are believed to have maximum precedence and to have right associative.
  var pred_table = {
    '||': [1, true],

    '&&': [2, true],

    '==': [3, true],
    '!=': [3, true],
    '<>': [3, true],

    '<' : [4, true],
    '>' : [4, true],
    '<=': [4, true],
    '>=': [4, true],

    '+' : [5, true],
    '-' : [5, true],

    '*' : [6, true],
    '%' : [6, true],
    '/' : [6, true],

    '^' : [7, false]
  };

  var tokenize = function (text, funcs, undef) {

    funcs = funcs || {};

    var last_token = 'sep';
    var ret = [];
    var t = text.toLowerCase();
    var open_parens = 0;

    while (t.length) {
      var m;

      if (t.match(/^\s/)) {
        t = t.substr(1); //Eat whitespace.

      } else if (t.match(/^[()]/)) {

        if (t[0] === '(') {
          ++open_parens;
        } else {
          --open_parens;
          if (open_parens < 0) {
            return lucidmath_error(text, text.length - t.length, t[0], 'paren');
          }
        }

        ret.push(['paren', t[0], text.length - t.length]);
        t = t.substr(1);

      } else if (last_token !== 'sep' && t.match(/^,/)) {
        ret.push(['sep', t[0], text.length - t.length]);
        last_token = 'sep';
        t = t.substr(1);

      } else if (last_token !== 'infix' && last_token !== 'sep' && last_token !== 'prefix' && (m = t.match(/^(<=|>=|!=|==|<>|&&|\|\||[\-\^+*%\/><])/))) {
        last_token = 'infix';
        ret.push(['infix', m[0], text.length - t.length]);
        t = t.substr(m[0].length);

      } else if (last_token !== 'value' && (m = t.match(/^(?:(?:-?[0-9]+(?:\.[0-9]*)?)|^(?:-?\.[0-9]+))(?:e[+\-]?\d+)?/))) {
        last_token = 'value';
        ret.push(['number', m[0], text.length - t.length]);
        t = t.substr(m[0].length);

      } else if ((m = t.match(/^(!|-|[\a-z]+[a-z0-9._]*'?)/))) {
        var func = funcs[m[0]] || func_table[m[0]];

        if (typeof func !== 'object') {
          if (typeof undef === 'function') {
            func = undef(m[0]);
            funcs[m[0]] = func;
          }
          if (typeof func !== 'object') {
            return lucidmath_error(text, text.length - t.length, m[0], 'undefined');
          }
        }

        var arity = func[0];
        if (arity === 0)
          last_token = 'value';
        else
          last_token = 'prefix';

        ret.push(['prefix', m[0] === '-' ? 'u-' : m[0], text.length - t.length]);
        t = t.substr(m[0].length);

      } else {
        return lucidmath_error(text, text.length - t.length, '', 'syntax'); //Return index of bad character.
      }
    }

    if (open_parens) {
      return lucidmath_error(text, text.length, '', 'paren');
    }

    return ret;
  };

  //Compile text expression and return function to execute it.
  //funcs is an array of [arity, function] arrays.
  exports.compile = function (text, funcs, undef) {

    var f = {};

    //Copy funcs since we will modify it.
    if (funcs) {
      for (var k in funcs)
        f[k] = funcs[k];
    }

    var t = tokenize(text, f, undef);
    if (!Array.isArray(t)) return t;


    var p = postfix(t, f);
    if (!Array.isArray(p)) {
      p.tokens = t;
      return p;
    }

    var ret = function() {
      var stack = [];

      for (var i = 0; i < p.length; ++i) {
        var t = p[i];
        if (typeof t === 'number') {
          stack.push(t);
        } else if (typeof t === 'function') {
          t(stack);
        }
      }

      return stack.pop();
    };

    ret.text = text;
    ret.tokens = t;
    ret.postfix = p;
    return ret;
  };

})(typeof exports === 'undefined' ? this.lucidmath = {} : exports);

