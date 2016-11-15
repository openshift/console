(function () {
  'use strict';

  angular.module('bridge.page')
    .controller('ProfileCtrl', function ProfileCtrl(
      $scope,
      ModalLauncherSvc
    ) {
      function downloadKubectlConfiguration() {
        ModalLauncherSvc.open('kubectl-config');
      }

      // ---

      angular.extend($scope, {
        downloadKubectlConfiguration
      });
    })
  ;
})();
