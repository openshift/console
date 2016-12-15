import * as k8sSelectorRequirement from './selector-requirement';

angular.module('k8s')
  .factory('k8sSelector', function k8sSelector() {
    'use strict';

    function isOldFormat(selector) {
      return !selector.matchLabels && !selector.matchExpressions;
    }

    // ---

    /**
     * @param {Object[]} requirements
     * @param {Object}   options
     * @param {Boolean}  options.basic
     * @param {Boolean}  options.undefinedWhenEmpty
     */
    function fromRequirements(requirements, options) {
      options      = options || {};
      var selector = {
        matchLabels:      {},
        matchExpressions: []
      };

      if (options.undefinedWhenEmpty && requirements.length === 0) {
        return;
      }

      requirements.forEach(function (r) {
        if (r.operator === 'Equals') {
          selector.matchLabels[r.key] = r.values[0];
        } else {
          selector.matchExpressions.push(r);
        }
      });

      // old selector format?
      if (options.basic) {
        return selector.matchLabels;
      }

      return selector;
    }

    function split(string) {
      return string.trim() ? string.split(/,(?![^(]*\))/) : []; // [''] -> []
    }

    function toRequirements(selector) {
      selector             = selector || {};
      var requirements     = [];
      var matchLabels      = isOldFormat(selector) ? selector : selector.matchLabels;
      var matchExpressions = selector.matchExpressions;

      Object.keys(matchLabels || {}).sort().forEach(function (k) {
        requirements.push(k8sSelectorRequirement.createEquals(k, matchLabels[k]));
      });

      (matchExpressions || []).forEach(function (me) {
        requirements.push(me);
      });

      return requirements;
    }

    function fromString(string) {
      var requirements = split(string || '').map(k8sSelectorRequirement.fromString);
      return fromRequirements(requirements);
    }

    function toString(selector) {
      var requirements = toRequirements(selector);
      return requirements.map(k8sSelectorRequirement.toString).join(',');
    }

    // ---

    return {
      fromString:       fromString,
      toString:         toString,
      toRequirements:   toRequirements,
      fromRequirements: fromRequirements,
      split:            split,
    };
  })
;
