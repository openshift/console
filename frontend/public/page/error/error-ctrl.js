import {getMessage} from '../../module/service/message.js';

angular.module('bridge.page')
.controller('ErrorCtrl', function($scope, $location) {
  'use strict';

  $scope.details = function() {
    var q = $location.search();
    var type = q.error_type;
    var msgKey = q.error;
    if (!type || !msgKey) {
      return '';
    }
    return getMessage(type, msgKey);
  };

});
