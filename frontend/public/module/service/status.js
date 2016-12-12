import {analyticsSvc} from '../analytics';
import {coFetchJSON} from '../../co-fetch';

angular.module('bridge.service')
.factory('statusSvc', function(_, k8s) {
  'use strict';

  return {
    tectonicVersion: function() {
      return coFetchJSON('version')
      .then(function(resp) {
        // TODO (stuart): update what we do here
        // analyticsSvc.push({tier: resp.tier});
        analyticsSvc.push({tier: 'tectonic'});
        return resp;
      });
    },
    kubernetesVersion: function() {
      return k8s.version();
    },
  };
});
