'use strict';

angular.module('bridge.ui')
.directive('coTpmList', function () {
  'use strict';

  return {
    templateUrl: '/static/module/ui/resources/tpm-list.html',
    restrict: 'E',
    replace: true,
    scope: {},
    controller: function($scope, Firehose, k8s) {
      new Firehose(k8s.tpms)
        .watchList()
        .bindScope($scope);
    }
  };
});
