angular.module('creme.ui')

.directive('tecTabs', function() {
  'use strict';

  return {
    templateUrl: '/static/module/ui/tabs.html',
    transclude: true,
    restrict: 'E',
    replace: true,
    scope: {
      chosenName: '='
    },
    controller: function($scope) {
      var tabs = $scope.tabs = [];
      var currentName = null;

      $scope.$watch('chosenName', function() {
        var selection;
        if ($scope.chosenName && currentName !== $scope.chosenName) {
          selection = _.find(tabs, _.matchesProperty('name', $scope.chosenName));
          if (!!selection) {
            $scope.selectTab(selection);
          }
        }
      });

      $scope.selectTab = function(tab) {
        $scope.chosenName = tab.name;
        angular.forEach(tabs, function(t) {
          t.selected = false;
        });
        tab.selected = true;
        $scope.$emit('tab-changed', $scope.chosenName);
      };

      this.registerTab = function(tab, name) {
        tab.name = name;
        if (tab.name === $scope.chosenName) {
          $scope.selectTab(tab);
        }
        tabs.push(tab);
      };
    },
  };

})

.directive('tecTab', function() {
  'use strict';

  return {
    template: '<div ng-show="selected" ng-transclude></div>',
    transclude: true,
    restrict: 'E',
    require: '^tecTabs',
    scope: {
      title: '=',
      name: '=',
    },
    link: function(scope, elem, attrs, tabsCtrl) {
      tabsCtrl.registerTab(scope, scope.name || scope.title);
    }
  };

});
