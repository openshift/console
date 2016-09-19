'use strict';
import units from '../../components/utils/units';

const URL = 'api/kubernetes/api/v1/proxy/namespaces/kube-system/services/heapster/api/v1/model';

const METRICS = [
  '/cpu/usage_rate',
  '/memory/usage',
]

const HUMAN_NAMES = {
  'cpu': 'CPU',
  'memory': 'Memory',
};

const HUMAN_TYPES = {
  'usage_rate': 'usage',
  'usage': 'usage',
};

const HUMAN_VALUES = {
  CPU: (value) => {
    if (!isFinite(value)) {
      value = 0;
    }
    // convert from millicores
    value /= 1000;

    if (value > 1000000) {
      return '> 1 million cores';
    }

    let useRound = true;
    if (value < 1) {
      useRound = false;
    }

    let conversion = units.humanize(value, 'numeric', useRound);

    return `${conversion.string} ${(conversion.value === 1 && conversion.unit.length === 0) ? 'Core' : 'Cores'}`;
  },
  Memory: (value) => {
    if (!isFinite(value)) {
      value = 0;
    }

    const conversion = units.humanize(value, 'decimalBytes', true);

    return `${conversion.string}`;
  }
};

function metricFromData (responses) {
  return METRICS
    .map((path, index) => {
      const res = responses[index];
      if (!res.data.metrics || !res.data.metrics.length) {
        return {value: NaN};
      }
      const metrics = res.data.metrics;
      return  metrics[metrics.length - 1];
    })
    .reduce((reducer, metric, index) => {
      const path = METRICS[index];
      const split = path.split('/');
      const type = HUMAN_NAMES[split[1]];
      const name = HUMAN_TYPES[split[2]];
      reducer[type] = reducer[type] || {};
      reducer[type][name] = metric;
      return reducer;
    }, {});
}

angular.module('heapster', ['lodash'])
.service('heapster', function($http, $q, _) {

  // expose for testing :(
  this.HUMAN_VALUES_ = HUMAN_VALUES;
  this.metricFromData_ = metricFromData;

  this.namespaceMetrics = (namespace) => {
    const baseURL = `${URL}/namespaces/${namespace}/metrics`;

    return $q.all(METRICS.map(m => {
      return $http({url: baseURL + m});
    })).then(metricFromData.bind(this));
  }

  this.clusterMetrics = () => {
    const baseURL = `${URL}/metrics`;

    return $q.all(METRICS.map(m => {
      return $http({url: baseURL + m});
    })).then(metricFromData.bind(this));
  }

  this.aggregate_ = (namespaceMetrics, clusterMetrics) => {
    _.each(namespaceMetrics, (metric, key) => {
      _.each(metric, (m) => {
        m.humanValue = HUMAN_VALUES[key](m.value);
      });
      const clusterMetric = clusterMetrics[key];
      metric.percentage = units.round(100 * metric.usage.value / clusterMetric.usage.value);
      metric.clusterTotal = HUMAN_VALUES[key](clusterMetric.usage.value);
    });
    return namespaceMetrics;
  }

  this.get = (namespace) => {
    return $q.all([this.namespaceMetrics(namespace), this.clusterMetrics()])
      .then(metrics => {
        return this.aggregate_.apply(this, metrics);
      });
  };
})
.directive('coHeapsterList', function () {
  return {
    templateUrl: '/static/module/ui/resources/heapster.html',
    restrict: 'E',
    replace: true,
    scope: {
      namespace: '=',
    },
    controller: function($scope, $timeout, heapster) {
      let poller;

      function poll () {
        if (poller) {
          $timeout.cancel(poller);
          poller = null;
          _poll();
        }
        poller = $timeout(_poll, 60 * 1000);
      }

      function _poll () {
        const namespace = $scope.namespace ? $scope.namespace.metadata.name : 'default';

        heapster
          .get(namespace)
          .then(metrics => {
            $scope.metrics = metrics;
            $scope.errors = '';
          })
          .catch(() => {
            $scope.errors = 'Can not load metrics from Heapster. Ensure your cluster is running heapster under the kube-system namespace.';
          });
      }

      poll();

      $scope.$watch('namespace', poll);
      $scope.$on('$destroy', () => {
        poller && $timeout.cancel(poller);
      });
    }
  };
});
