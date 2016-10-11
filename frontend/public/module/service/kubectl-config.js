import {saveAs} from 'file-saver';

angular.module('bridge.service')
  .factory('kubectlConfigSvc', function kubectlConfigSvc(
    $http,
    $httpParamSerializerJQLike,
    $window
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
      $window.open('api/tectonic/kubectl/code');
    }

    function getConfiguration(code) {
      return $http.post('api/tectonic/kubectl/config', $httpParamSerializerJQLike({code: code}), {
        headers:           {'Content-Type': 'application/x-www-form-urlencoded'},
        transformResponse: false
      })
        .then(function (res) {
          return res.data;
        })
      ;
    }

    function downloadConfiguration(config) {
      const blob = new Blob([config], { type: 'text/yaml;charset=utf-8' });
      saveAs(blob, 'kubectl-config');
    }
  })
;
