angular.module('bridge.page')
.controller('NamespacesCtrl', function($location, $routeParams, $scope, $window,
                                       activeNamespaceSvc, namespaceCacheSvc, ModalLauncherSvc) {
  // At this writing, Angular is very unfriendly to changing
  // $location.path without triggering a navigation, rerendering and
  // flicker. ( See https://github.com/angular/angular.js/pull/2398#issuecomment-16924680 )
  //
  // As a result, namespaces are routed with ?searches rather than
  // /paths, and we manually watch the $routeParams to update if needed.

  function whichNamespace() {
    var active;
    if ($routeParams.name) {
      return $routeParams.name;
    }

    active = activeNamespaceSvc.getActiveNamespace();
    if (active) {
      return active.metadata.name;
    }

    return null;
  }

  function loadNamespace() {
    var nsName = whichNamespace();
    if (nsName) {
      $scope.chosen = namespaceCacheSvc.get(nsName);
    }
  }

  $scope.$watch(whichNamespace, loadNamespace);
  $scope.$watch(function() {
    return namespaceCacheSvc.cacheVersion;
  }, loadNamespace);

  $scope.$watch('chosen', function() {
    if ($scope.chosen) {
      $location.search('name', $scope.chosen.metadata.name);
    }
  });

  $scope.newNamespaceModal = function() {
    ModalLauncherSvc.open('new-namespace');
  };

  loadNamespace();
});
