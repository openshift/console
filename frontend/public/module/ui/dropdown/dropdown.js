const TEMPLATE = `
<div class="dropdown" uib-dropdown>
  <span ng-if="nobutton" uib-dropdown-toggle class="dropdown__not-btn">
    <span ng-bind="title"></span> <span class="caret"></span>
  </span>

  <button ng-if="!nobutton" type="button" uib-dropdown-toggle class="btn btn--dropdown">
    <span ng-bind="title"></span> <span class="caret"></span>
  </button>

  <ul class="dropdown-menu" aria-labelledby="dLabel">
    <li ng-repeat="(name, value) in items" class="{{name === title ? 'dropdown__selected' : 'dropdown__default'}}" ng-click="select(name, value)">
      <a href="#" value="{{name}}">{{name}}</a>
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
      }
    },
  };
});
