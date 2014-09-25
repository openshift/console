// Container Tag Filter
//
// Given a docker image string returns the tag (aka version) portion.
// Defaults to 'latest'.

angular.module('app')
.filter('containerTag', function(_, CONST) {
  'use strict';

  return function(image) {
    var parts;
    if (!image) {
      return CONST.placeholderText;
    }
    parts = image.split(':');
    if (_.isEmpty(parts)) {
      return CONST.placeholderText;
    }
    if (parts.length === 1) {
      return 'latest';
    }
    return parts[1];
  };

});
