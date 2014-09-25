// Container Image Filter
//
// Given a docker image string returns the image portion without the tag.

angular.module('app')
.filter('containerImage', function(_, CONST) {
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
    return parts[0];
  };

});
