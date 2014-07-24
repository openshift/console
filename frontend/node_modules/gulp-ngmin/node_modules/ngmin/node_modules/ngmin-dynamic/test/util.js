
/*
 * Test utils
 */


var esprima         = require('esprima'),
    escodegen       = require('escodegen'),
    run             = require('../dynamic');

var fnDecl = /^[ ]*function[ ]?\(\)[ ]?\{\n/m,
  trailingBrace = /[ ]*\}(?![\s\S]*\})/m;

// given a function, return its body as a string.
// makes tests look a bit cleaner
var stringifyFnBody = exports.stringifyFnBody = function (fn) {
  var out = fn.toString().
    replace(fnDecl, '').
    replace(trailingBrace, '');

  return normalize(out);
};

// given a function, return its body as a string.
// makes tests look a bit cleaner
var normalize = exports.normalize = function normalize (fn) {
  var out = fn.toString();

  // then normalize with esprima/escodegen
  out = escodegen.generate(
    esprima.parse(out, {
      tolerant: true
    }), {
      format: {
        indent: {
          style: '  '
        }
      }
    });

  return out;
};

exports.annotate = function (code) {
  code = stringifyFnBody(code);
  return normalize(run(code));
};
