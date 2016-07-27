angular.module('bridge.page')
  .controller('KubectlConfigCtrl', function KubectlConfigCtrl(
    $scope,
    $window,
    kubectlConfigSvc
  ) {
    'use strict';

    // ---

    $scope.vm = {
      STEP_GET_VERIFICATION_CODE:  1,
      STEP_VERIFY_CODE:            2,
      STEP_DOWNLOAD_CONFIGURATION: 3,
      step:                        1,
      getVerificationCode:         getVerificationCode,
      verifyCode:                  verifyCode,
      downloadConfiguration:       downloadConfiguration,
    };

    // ---

    function getVerificationCode() {
      kubectlConfigSvc.getVerificationCode();
      $scope.vm.step = $scope.vm.STEP_VERIFY_CODE;
    }

    function verifyCode() {
      $scope.vm.verifyCodePromise = kubectlConfigSvc.getConfiguration($scope.vm.verificationCode)
        .then(function (configuration) {
          $scope.vm.step          = $scope.vm.STEP_DOWNLOAD_CONFIGURATION;
          $scope.vm.configuration = configuration;
        })
      ;
    }

    function downloadConfiguration() {
      kubectlConfigSvc.downloadConfiguration($scope.vm.configuration);
    }
  })
;
