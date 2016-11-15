angular.module('bridge.page')
.controller('SearchCtrl', function($location, $routeParams, $route, activeNamespaceSvc) {
  'use strict';

  const shouldRedirect = $route.current.$$route.redirect;
  if (shouldRedirect) {
    const namespace = $routeParams.ns || activeNamespaceSvc.getActiveNamespace();
    const path = `${(namespace ? `ns/${namespace}` : 'all-namespaces')}/search`;
    return $location.path(path);
  }

  // Add expected GET parameters if missing
  if($location.search().kind === undefined) {
    $location.search('kind', '');
  }
  if($location.search().q === undefined) {
    $location.search('q', '');
  }
});
