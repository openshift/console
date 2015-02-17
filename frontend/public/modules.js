angular.module('underscore', []).factory('_', function($window) {
  'use strict';
  return $window._;
});

angular.module('jquery', []).factory('$', function($window) {
  'use strict';
  return $window.$;
});

angular.module('app.ui', []);
angular.module('app.modules', []);
