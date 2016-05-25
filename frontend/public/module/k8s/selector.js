angular.module('k8s')
  .factory('k8sSelector', function k8sSelector() {
    'use strict';

    return {
      stringifyMatchLabels:      stringifyMatchLabels,
      stringifyMatchExpressions: stringifyMatchExpressions,
      stringify:                 stringify
    };

    // ---

    function stringifyMatchLabels(matchLabels) {
      return Object.keys(matchLabels).map(function (k) {
        return k + '=' + matchLabels[k];
      }).join(',');
    }

    function stringifyMatchExpressions(matchExpressions) {
      return matchExpressions.map(function (me) {
        if (me.operator === 'Exists') {
          return me.key;
        }

        if (me.operator === 'DoesNotExist') {
          return '!' + me.key;
        }

        if (me.operator === 'In') {
          return me.key + ' in (' + toArray(me.values).join(',') + ')';
        }

        if (me.operator === 'NotIn') {
          return me.key + ' notin (' + toArray(me.values).join(',') + ')';
        }

        throw new Error('unknown operator: ' + me.operator);
      }).join(',');
    }

    /**
     * @param  {Object}   selector
     * @return {Object}   selector.matchLabels
     * @return {Object[]} selector.matchExpressions
     */
    function stringify(selector) {
      var string = [];

      if (selector.matchLabels) {
        string.push(stringifyMatchLabels(selector.matchLabels));
      }

      if (selector.matchExpressions) {
        string.push(stringifyMatchExpressions(selector.matchExpressions));
      }

      // v1 selector?
      if (string.length === 0) {
        string.push(stringifyMatchLabels(selector));
      }

      return string.join(',');
    }

    // ---

    function toArray(value) {
      return Array.isArray(value) ? value : [value];
    }
  })
;
