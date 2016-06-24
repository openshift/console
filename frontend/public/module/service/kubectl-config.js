angular.module('bridge.service')
  .factory('kubectlConfigSvc', function kubectlConfigSvc(
    $http,
    $httpParamSerializerJQLike,
    $window,
    fileSaverSvc
  ) {
    'use strict';

    // ---

    return {
      getVerificationCode,
      getConfiguration,
      downloadConfiguration,
    };

    // ---

    function getVerificationCode() {
      $window.open('/api/tectonic/kubectl/code');
    }

    function getConfiguration(code) {
      return $http.post('/api/tectonic/kubectl/config', $httpParamSerializerJQLike({code: code}), {
        headers:           {'Content-Type': 'application/x-www-form-urlencoded'},
        transformResponse: false
      })
        .then(function (res) {
          return res.data;
        })
      ;
    }

    function downloadConfiguration(config) {
      const blob = new $window.Blob([config], { type: 'text/yaml;charset=utf-8' });
      fileSaverSvc.saveAs(blob, 'kubectl-config');
    }
  })
;
