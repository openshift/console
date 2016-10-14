import {util} from '../../module/k8s/util';

angular.module('bridge.page')
.controller('SearchCtrl', function($scope, $location, $routeParams, $route, k8s, activeNamespaceSvc) {
  'use strict';

  const shouldRedirect = $route.current.$$route.redirect;
  const namespace = $routeParams.ns || activeNamespaceSvc.getActiveNamespace();

  if (shouldRedirect) {
    let path = namespace ? `ns/${namespace}` : 'all-namespaces';
    path += '/search';
    return $location.path(path);
  }
  const defaultKind = k8s.enum.Kind.SERVICE;
  $scope.ns = namespace;

  function getKind(id) {
    var k;
    if (!id) {
      return defaultKind;
    }
    k = util.getKindEnumById(id);
    if (k) {
      return k;
    }
    return defaultKind;
  }

  $scope.init = function() {
    $scope.fields = {
      kind: null,
      selector: null,
      namespace: $scope.ns,
    };
    $scope.dropdownProps = {
      selected: null,

      // Called when type selector is changed.
      onKindChange: (kindId) => {
        $scope.fields.kind = kindId;
        $scope.submit();
      }
    },
    $scope.decodeSearch();
    $scope.$watchCollection('fields.selector', function(newVal, oldVal) {
      // Ignore initial firing.
      if (newVal === oldVal) {
        return;
      }
      $scope.submit();
    }, /* objectEquality */true);
  };

  // Populate the scope query vars from the URL query string.
  $scope.decodeSearch = function() {
    var kind = getKind($location.search().kind);
    $scope.fields.kind = kind.id;
    $scope.fields.selector = k8s.selector.fromString($location.search().q);
    $scope.dropdownProps.selected = kind.id;
  };

  // Update the query string.
  // NOTE: Triggers view reload which in turn calls init() & and search() again.
  $scope.encodeSearch = function() {
    var kind, search;
    kind = getKind($scope.fields.kind);
    search = {
      kind: kind.id,
      q: k8s.selector.toString($scope.fields.selector),
    };
    $location.search(search);
  };

  // Run when user submits form changes.
  $scope.submit = function() {
    $scope.encodeSearch();
  };

  $scope.init();
})

.controller('SearchFormCtrl', function() {
  'use strict';
});
