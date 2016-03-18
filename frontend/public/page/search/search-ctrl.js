angular.module('bridge.page')
.controller('SearchCtrl', function(_, $scope, $location, k8s, featuresSvc) {
  'use strict';

  var defaultKind = k8s.enum.Kind.SERVICE;
  $scope.kinds = k8s.enum.Kind;

  function getKind(id) {
    var k;
    if (!id) {
      return defaultKind;
    }
    k = k8s.util.getKindEnumById(id);
    if (k) {
      return k;
    }
    return defaultKind;
  }

  $scope.features = featuresSvc;

  $scope.init = function() {
    $scope.fields = {
      selectedKindId: null,
      query: null,
    };
    $scope.decodeSearch();
    $scope.$watchCollection('fields.query', function(newVal, oldVal) {
      // Ignore initial firing.
      if (newVal === oldVal) {
        return;
      }
      $scope.submit();
    });
  };

  // Called when type selector is changed.
  $scope.changeKind = function(kindId) {
    $scope.fields.selectedKindId = kindId;
    $scope.submit();
  };

  // Populate the scope query vars from the URL query string.
  $scope.decodeSearch = function() {
    var kind = getKind($location.search().kind);
    $scope.fields = {
      selectedKindId: kind.id,
      query: k8s.labels.urlDecode($location.search().q),
    };
  };

  // Update the query string.
  // NOTE: Triggers view reload which in turn calls init() & and search() again.
  $scope.encodeSearch = function() {
    var kind, search;
    kind = getKind($scope.fields.selectedKindId);
    search = {
      kind: kind.id,
      q: k8s.labels.urlEncode($scope.fields.query),
    };
    $location.search(search);
  };

  // For linking to resources.
  $scope.getResourceLink = function(resource) {
    var kind = getKind($scope.fields.selectedKindId), pathParts;
    if (!kind) {
      return '';
    }
    pathParts = [kind.path, resource.metadata.name];
    if (resource.metadata.namespace) {
      pathParts.unshift(resource.metadata.namespace);
      pathParts.unshift('ns');
    }
    return pathParts.join('/');
  };

  // Run when user submits form chnages.
  $scope.submit = function() {
    $scope.encodeSearch();
  };

  $scope.init();
})

.controller('SearchFormCtrl', function() {
  'use strict';
});
