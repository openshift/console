(function() {
  'use strict';

  // formally define non-angular external dependencies
  angular.module('lodash', []).factory('_', function($window) {
    return $window._;
  });

  angular.module('jquery', []).factory('$', function($window) {
    return $window.$;
  });

  angular.module('coreos.services', [
    'lodash',
    'jquery',
  ]);
  angular.module('coreos.ui', [
    'lodash',
    'jquery'
  ]);
  angular.module('coreos', [
    'coreos.services',
    'coreos.ui',

    // other external deps
    'ngRoute',
    'ngAnimate',
  ])
  .config(function($compileProvider) {
    // Allow irc links.
    $compileProvider
      .aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|tel|file|irc):/);
  });

}());

angular.module('coreos.ui');


/**
 * @fileoverview
 *
 * Keeps the title tag updated.
 */

angular.module('coreos.ui')
.directive('coTitle', function() {
  'use strict';

  return {
    transclude: false,
    restrict: 'A',
    scope: {
      suffix: '@coTitleSuffix'
    },
    controller: function($scope, $rootScope, $route) {
      $scope.pageTitle = '';
      $scope.defaultTitle = null;
      $rootScope.$on('$routeChangeSuccess', function() {
        if (!$route.current) {
          return;
        }
        if ($route.current.title) {
          $scope.pageTitle = $route.current.title;
        }
        if ($route.current.$$route && $route.current.$$route.title) {
          $scope.pageTitle = $route.current.$$route.title;
        }
      });
    },
    link: function(scope, elem) {
      scope.$watch('pageTitle', function(title) {
        if (title) {
          if (!scope.defaultTitle) {
            scope.defaultTitle = elem.text();
          }
          elem.text(title + ' ' + scope.suffix);
        } else {
          if (scope.defaultTitle) {
            elem.text(scope.defaultTitle);
          }
        }
      });
    }
  };

});

