const TEMPLATE = `
<div class="dropdown" uib-dropdown>
  <span ng-if="nobutton" uib-dropdown-toggle class="dropdown__not-btn">
    <span ng-bind="title"></span> <span class="caret"></span>
  </span>

  <button ng-if="!nobutton" type="button" uib-dropdown-toggle class="btn btn--dropdown">
    <span ng-bind="title"></span> <span class="caret"></span>
  </button>

  <ul class="dropdown-menu" aria-labelledby="dLabel">
    <li ng-repeat="item in pairs track by item.name" class="{{item.name === title ? 'dropdown__selected' : 'dropdown__default'}}" ng-click="select(item.name, item.value)">
      <a href="#" value="{{item.name}}">{{item.name}}</a>
    </li>
  </ul>
</div>
`;
angular.module('bridge.ui')
.directive('coDropdown', function () {
  'use strict';

  return {
    template: TEMPLATE,
    restrict: 'E',
    replace: true,
    scope: {
      title: '=',
      nobutton: '=',
      items: '=',
      selected: '=',
    },
    controller: function ($scope) {
      $scope.select = (name, value) => {
        $scope.selected = value;
        $scope.title = name;
      };
      const updatePairs = () => {
        $scope.pairs = _.map($scope.items, item => {
          return {name: item[0], value: item[1]};
        });
      };

      $scope.$watch('items', updatePairs);
      updatePairs();
    },
  };
});
