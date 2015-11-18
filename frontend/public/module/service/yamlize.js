angular.module('bridge.service')
.factory('yamlizeSvc', function(_) {
  'use strict';

  // reservedWords are strings that YAML thinks of as being of a
  // particular, non-string type, so we need to protect them with
  // quotes when we see them.
  var safeWithoutQuotes, yamlizeObject;
  var reservedWords = [
    'true', 'false', 'null', 'yes', 'no', 'on', 'off'
  ];
  var LOOKS_LIKE_NUMBER = /^[\deE]*(\.[\deE]*)?$/;
  var LOOKS_LIKE_ARRAY_OR_DICT = /[:-]\s/;
  var ENDS_WITH_NON_ALPHANUM = /\W+$/;

  // Err on the side of quoting most stuff - leave unquoted strings
  // that start with an alphanum_ or a slash, and contain only
  // alphanums, slashes, and some select special characters.  This
  // match only works if we've already excluded the cases above.
  var DOESNT_NEED_QUOTES = /^[\w\/]([\w\/:+. -]*\w)?$/;

  safeWithoutQuotes = function(str) {
    if (_.includes(reservedWords, str.toLowerCase())) {
      return false;
    }

    if (str.match(LOOKS_LIKE_NUMBER)) {
      return false;
    }

    if (str.match(LOOKS_LIKE_ARRAY_OR_DICT)) {
      return false;
    }

    if (str.match(ENDS_WITH_NON_ALPHANUM)) {
      return false;
    }

    return !!str.match(DOESNT_NEED_QUOTES);
  };

  yamlizeObject = function(obj, indent) {
    var blocks = [];

    if (_.isString(obj)) {
      if (safeWithoutQuotes(obj)) {
        return obj;
      } else {
        return JSON.stringify(obj);
      }
    }

    if (_.isNull(obj) ||
        _.isBoolean(obj) ||
        _.isNumber(obj)) {
      return JSON.stringify(obj);
    }

    if (_.isArray(obj)) {
      if (obj.length === 0) {
        return '[]';
      }

      blocks = _.map(obj, function(el) {
        var val = yamlizeObject(el, indent + '  ');

        // Cosmetic wart: "- a: b" works and is preferred, but but
        // "- - a" and "a: b: c" break without a newline between the dashes.
        if (val.match(/^\n {2}\s*/) === 0 && _.isObject(el)) {
          val = val.replace(/^\n {2}\s*/, '');
        }
        return '\n' + indent + '- ' + val;
      });

      return blocks.join('');
    }

    if (_.isObject(obj)) {
      if (_.isEmpty(obj)) {
        return '{}';
      }

      blocks = _.chain(obj).pairs().sortBy().map(function(kv) {
        return '\n' + indent + yamlizeObject(kv[0], '') + ': ' + yamlizeObject(kv[1], indent + '  ');
      }).value();

      return blocks.join('');
    }

    throw new Error('Can\'t encode object into yaml: ' + obj);
  };

  return {
    yamlize: function(obj) {
      var ret = yamlizeObject(obj, '');
      if (ret.indexOf('\n') === 0) {
        ret = ret.substring(1);
      }

      return ret;
    }
  };
});
