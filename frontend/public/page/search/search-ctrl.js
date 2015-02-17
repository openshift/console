angular.module('app')
.controller('SearchCtrl', function(_, $scope, $location, k8s) {
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

  $scope.init = function() {
    $scope.results = null;
    $scope.loading = false;
    $scope.fields = {
      selectedKindId: null,
      query: null,
    };
    $scope.decodeSearch();

    if (!_.isEmpty($scope.fields.query)) {
      $scope.search();
    }
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
    var kind = getKind($scope.fields.selectedKindId);
    if (!kind) {
      return '';
    }
    return kind.path + '/' + resource.metadata.name;
  };

  // Execute the actual search with api client.
  $scope.search = function() {
    var kind = getKind($scope.fields.selectedKindId);
    $scope.loading = true;
    k8s.search(kind, { labels: $scope.fields.query })
      .then(function(results) {
        $scope.results = results;
      })
      .finally(function() {
        $scope.loading = false;
      });
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
