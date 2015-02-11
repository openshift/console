angular.module('underscore', []).factory('_', function($window) {
  return $window._;
});

angular.module('jquery', []).factory('$', function($window) {
  return $window.$;
});

angular.module('app.ui', []);
angular.module('app.modules', []);
