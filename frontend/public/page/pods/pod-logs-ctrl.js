angular.module('bridge.page')
.controller('PodLogsCtrl', function(_, $scope, $location, $routeParams, $timeout,
                                    k8s, linebufferSvc, streamSvc) {
  'use strict';
  var streamLog, logURL;

  $scope.ns = $routeParams.ns;
  $scope.podName = $routeParams.name;
  $scope.containerName = $routeParams.containerName;
  $scope.pendingReload = null;
  $scope.windowState = 'streaming';
  $scope.active = null;
  $scope.stream = null;
  $scope.buffer = linebufferSvc.buffer(1000);
  $scope.containerNames = [$scope.containerName];
  $scope.$on('$destroy', function() {
    // Don't leak timeouts or streams
    if ($scope.pendingReload) {
      $timeout.cancel($scope.pendingReload);
      $scope.pendingReload = null;
    }
    if ($scope.stream) {
      $scope.stream.abort();
    }
  });

  $scope.selectContainer = function(cName) {
    $scope.containerName = cName;
  };

  $scope.$watch('windowState', function() {
    $scope.active = ($scope.windowState === 'streaming');
  });

  $scope.$watch('active', function() {
    $scope.windowState = $scope.active ? 'streaming' : 'paused';
  });

  $scope.$watch('containerName', function() {
    if ($routeParams.containerName !== $scope.containerName) {
      var path = 'ns/' + $scope.ns + '/pods/' + $scope.podName + '/logs/' + $scope.containerName;
      $location.path(path);
    }
  });

  if (!$scope.containerName) {
    k8s.pods.get($scope.podName, $scope.ns).then(function(pod) {
      if (pod.spec.containers.length) {
        $scope.containerName = pod.spec.containers[0].name;
      }
    });

    return;
  }

  k8s.pods.get($scope.podName, $scope.ns).then(function(pod) {
    $scope.containerNames = _.map(pod.spec.containers, 'name');
  });

  logURL = k8s.resource.resourceURL(k8s.enum.Kind.POD, {
    ns: $scope.ns,
    name: $scope.podName,
    path: 'log',
    queryParams: {
      container: $scope.containerName,
      follow: 'true',
      tailLines: $scope.buffer.maxSize()
    }
  });

  streamLog = function() {
    var loadTime = null;
    $scope.pendingReload = null;
    $scope.stream = streamSvc.stream(logURL);

    // We use the multi-argument then() because we need to monitor
    // progress notifications
    $scope.stream.promise.then(
      function() { // Load ended
        if (!$scope.pendingReload) {
          var sinceLastLoad = Date.now() - loadTime;
          var wait = Math.max(0, (1000 * 5) - sinceLastLoad);
          $scope.pendingReload = $timeout(streamLog, wait);
        }
      },
      function(why) { // Load failed/aborted
        if (why !== 'abort') {
          throw new Error('Error reading log stream');
        }
      },
      function(data) { // Data inbound
        if (loadTime === null) {
          $scope.buffer.clear();
          loadTime = Date.now();
        }
        $scope.buffer.push(data);
      }
    );
  };
  streamLog();

});
