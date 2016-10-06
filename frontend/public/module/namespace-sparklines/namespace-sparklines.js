'use strict';

import { discoverService } from '../../modules/k8s/discover-service';
import { coFetch, coFetchUtils } from '../../components/utils';

const pollInterval = 30 * 1000;
const metrics = {
  cpuLimit: 'sum(namespace:container_spec_cpu_shares:sum) * 1000000',
  memoryLimit: 'sum(namespace:container_memory_usage_bytes:sum)'
};

angular.module('namespace-sparklines', ['lodash'])
.filter('queryNamespace', function() {
  return function(input, scope) {
    if (!scope.namespace || !scope.namespace.metadata) {
      return input;
    }

    return encodeURIComponent(_.split(input, '__NAMESPACE__').join(scope.namespace.metadata.name));
  };
})
.directive('coNamespaceSparklines', function () {
  return {
    templateUrl: '/static/module/ui/resources/namespace-sparklines.html',
    restrict: 'E',
    replace: true,
    scope: {
      namespace: '=',
    },
    controller: function($scope, $interval) {
      $scope.limitsLoaded = false;
      let poller;
      let polling = false;

      const finishedPolling = (json) => {
        polling = false;
        $scope.limitsLoaded = true;
        return json;
      };
      const parseLimit = (json) => _.toInteger(_.get(json, 'data.result[0].value[1]', null));

      const setLimits = (basePath) => {
        _.each(metrics, (query, metric) => {
          coFetch(`${basePath}/api/v1/query?query=${query}`)
            .then(finishedPolling)
            .then(coFetchUtils.parseJson)
            .then(parseLimit)
            .then((value) => $scope[metric] = value)
            .catch(() => {
              finishedPolling();
              $scope[metric] = null;
            });
        });
      };

      const resetLimits = () => {
        _.each(metrics, (query, metric) => {
          $scope[metric] = null;
        })
      };

      const poll = () => {
        if (polling) {
          return;
        }
        if (!$scope.namespace || !$scope.namespace.metadata) {
          resetLimits();
          return;
        }

        polling = true;
        discoverService({
          namespace: 'tectonic-system',
          labelSelector: 'name=prometheus',
          healthCheckPath: '/metrics',
          available: setLimits.bind(this),
          unavailable: resetLimits.bind(this)
        });
      };

      poll();
      poller = $interval(poll, pollInterval);
      $scope.$on('$destroy', () => {
        poller && $interval.cancel(poller);
      });
    }
  };
});
