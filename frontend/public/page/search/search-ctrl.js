angular.module('bridge.page')
.controller('SearchCtrl', function($scope, $location, $routeParams, $route, k8s, activeNamespaceSvc) {
  'use strict';

  const shouldRedirect = $route.current.$$route.redirect;
  if (shouldRedirect) {
    const namespace = $routeParams.ns || activeNamespaceSvc.getActiveNamespace();
    const path = (namespace ? `ns/${namespace}` : 'all-namespaces') + '/search';
    return $location.path(path);
  }

  // Add expected GET parameters if missing
  if($location.search().kind === undefined) {
    $location.search('kind', '');
  }
  if($location.search().q === undefined) {
    $location.search('q', '');
  }

  $scope.props = {
    onKindChange: (kind) => {
      // Triggers view reload
      $location.search('kind', kind);
    },
    onSelectorChange: (q) => {
      // Triggers view reload
      $location.search('q', q);
    }
  };
});
