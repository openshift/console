angular.module('app')
.controller('SearchCtrl', function(_, $scope, $location, SearchSvc, LabelSvc) {
  'use strict';

  var defaultType = 'service';

  // Query fields.
  $scope.fields = {
    entityType: null,
    query: null,
  };

  $scope.init = function() {
    $scope.results = null;
    $scope.loading = false;
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
  $scope.changeType = function(type) {
    $scope.fields.entityType = type;
    $scope.submit();
  };

  // Populate the scope query vars from the URL query string.
  $scope.decodeSearch = function() {
    $scope.fields = {
      entityType: $location.search().type || defaultType,
      query: LabelSvc.urlDecode($location.search().q),
    };
  };

  // Update the query string.
  // NOTE: Triggers view reload which in turn calls init() & and search() again.
  $scope.encodeSearch = function() {
    var search = {
      type: $scope.fields.entityType || defaultType,
      q: LabelSvc.urlEncode($scope.fields.query),
    };
    $location.search(search);
  };

  // For linking to entities.
  $scope.getEntityPath = function(entityType) {
    switch(entityType) {
      case 'pod':
        return 'pods';
      case 'service':
        return 'services';
      case 'controller':
        return 'replica-controllers';
    }
  };

  // Execute the actual search with api client.
  $scope.search = function() {
    $scope.loading = true;
    SearchSvc.search($scope.fields.entityType, $scope.fields.query)
      .then(function(result) {
        $scope.results = result.data.items;
      })
      .catch(function(e) {
        console.log('error: ', e);
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
});
