// String Split Filter
//
// Splits a string and returns value at index.
//
// USAGE:
// $scope.obj = { myString: ['foo=bar']  };
// <div>{{obj.myString | split:'=':0}}</div>
// prints: foo

angular.module('app')
.filter('coSplit', function() {
  'use strict';

  return function(str, separator, index) {
    var parts;
    if (!str) {
      return '';
    }

    parts = str.split(separator);
    if (!parts.length || index >= parts.length) {
      return '';
    }

    return parts[index];
  };

});
