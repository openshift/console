angular.module('core.pkg')
.factory('pkg', function(_) {
  'use strict';

  var pkg = {

    /**
     * Extends underscore.isEmpty() to test values beyond just arrays & objects.
     */
    isEmpty: function(v) {
      if ((_.isObject(v) || _.isArray(v)) && _.isEmpty(v)) {
        return true;
      }
      if (_.isNaN(v) || _.isNull(v) || _.isUndefined(v) || v === '') {
        return true;
      }
      return false;
    },

    /**
     * Checks if all own properties of an object are empty.
     * Returns true if all are empty, false otherwise.
     */
    allEmpty: function(obj) {
      return _.every(_.values(obj), pkg.isEmpty);
    },

    /**
     * Iterates thru all own properties of an object and deletes anything identified by the filter function.
     */
    deleteProps: function(obj, fn) {
      _.each(obj, function(val, key) {
        if (fn(val)) {
          delete obj[key];
        }
      });
      return obj;
    },

    /**
     * Deletes any properties with null values.
     */
    deleteNulls: function(obj) {
      pkg.deleteProps(obj, _.isNull);
      return obj;
    },

    /**
     * Deletes any properties with empty values.
     */
    deleteEmpties: function(obj) {
      pkg.deleteProps(obj, pkg.isEmpty);
      return obj;
    },

    /**
     * Descends into an object for all properties provided by dot-separated selector string to check for existence.
     */
    propExists: function(selector, obj) {
      var currObj;
      if (!_.isObject(obj) || _.isEmpty(obj) || !selector) {
        return false;
      }

      currObj = obj;
      return selector.split('.').every(function(prop) {
        if (currObj && currObj.hasOwnProperty(prop)) {
          currObj = currObj[prop];
          return true;
        }
        return false;
      });
    },

    /**
     * A smarter version of Array.prototype.join().
     * If a predicate function is provided it it used to determine each individual label,
     * if not provided the collection is assumed to be an array of strings.
     * Predicate function is passed the same arguments as _.map().
     *
     * @param {Object|Array.<Object|string>} collection of items to join.
     * @param {string=} separator to separate items by. Default is empty space.
     * @param {function()=} fn predicate to run on each item to map it to a string.
     * @return{string}
     */
    join: function(collection, separator, fn) {
      var labels = _.map(collection, function(v) {
        if (fn) {
          return fn.apply(null, arguments);
        }
        return v;
      });
      return labels.join(separator || ' ');
    },

  };

  return pkg;

});
