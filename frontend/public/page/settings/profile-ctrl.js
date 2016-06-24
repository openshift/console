(function () {
  'use strict';

  angular.module('bridge.page')
    .controller('ProfileCtrl', function ProfileCtrl(
      $scope,
      ModalLauncherSvc
    ) {
      angular.extend($scope, {
        downloadKubectlConfiguration
      });

      // ---

      function downloadKubectlConfiguration() {
        ModalLauncherSvc.open('kubectl-config');
      }
    })
  ;
})();
