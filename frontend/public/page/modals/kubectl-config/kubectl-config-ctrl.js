import {kubectlConfigSvc} from '../../../module/service/kubectl-config';

angular.module('bridge.page')
  .controller('KubectlConfigCtrl', function KubectlConfigCtrl(
    $scope, statusSvc
  ) {
    'use strict';

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

    function setKubectlUrls() {
      statusSvc.kubernetesVersion()
        .then(function(resp) {
          const k8sVersion = resp.gitVersion.split('+')[0];
          const prefix = `https://storage.googleapis.com/kubernetes-release/release/${k8sVersion}`;
          const postfix = '/amd64/kubectl';

          $scope.kubectlMacUrl = `${prefix}/bin/darwin${postfix}`;
          $scope.kubectlLinuxUrl =` ${prefix}/bin/linux${postfix}`;
          $scope.kubectlWinUrl = `${prefix}/bin/windows${postfix}.exe`;
        });
    }

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

    setKubectlUrls();
  })
;
