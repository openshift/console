angular.module('app')
.service('LabelSvc', function(_) {
  'use strict';

  this.encode = function(labels) {
    var result = _.map(_.keys(labels), function(key) {
      return key + '=' + labels[key];
    });
    return result.join(',');
  };

});
