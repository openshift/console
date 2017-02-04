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
    'coreos-templates-html',

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


/**
 * @fileoverview
 * Wrap buttons and automatically enable/disbale and show loading indicator.
 */

angular.module('coreos.ui')
.directive('coBtnBar', function($, $timeout, $compile) {
  'use strict';

  return {
    templateUrl: '/coreos.ui/btn-bar/btn-bar.html',
    restrict: 'EA',
    transclude: true,
    replace: true,
    scope: {
      // A promise that indicates completion of async operation.
      'completePromise': '='
    },
    link: function(scope, elem) {
      var linkButton,
          loaderDirectiveEl;

      linkButton = $('.btn-link', elem).last();
      loaderDirectiveEl =
          angular.element('<co-inline-loader></co-inline-loader>');
      $compile(loaderDirectiveEl)(scope);

      // Force async execution so disabling the button won't prevent form
      // submission.
      const disableButtons = () => $timeout(() => {
        elem.append(loaderDirectiveEl);
        $('button', elem).attr('disabled', 'disabled');
        linkButton.addClass('hidden');
      }, 0);

      // Also enable buttons asynchronously in case the request completes
      // before disableButtons() runs.
      const enableButtons = () => $timeout(() => {
        loaderDirectiveEl.remove();
        $('button', elem).removeAttr('disabled');
        linkButton.removeClass('hidden');
      }, 0);

      scope.$watch('completePromise', function(completePromise) {
        if (!completePromise) {
          return;
        }
        disableButtons();
        if (_.isFunction(completePromise.finally)) {
          completePromise.finally(enableButtons);
          return;
        }
        completePromise.then(enableButtons).catch((error) => {
          enableButtons();
          throw error;
        });
      });
    }

  };

});


angular.module('coreos.ui');

/**
 * @fileoverview
 *
 * Loading indicator that centers itself inside its parent.
 */

angular.module('coreos.ui')

.directive('coLoader', function() {
  'use strict';

  return {
    templateUrl: '/coreos.ui/loader/loader.html',
    restrict: 'E',
    replace: true
  };
})

.directive('coInlineLoader', function() {
  'use strict';

  return {
    templateUrl: '/coreos.ui/loader/inline-loader.html',
    restrict: 'E',
    replace: true
  };
});


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

/**
 * @fileoverview
 * Directive to display global error or info messages.
 * Enqueue messages through the toastSvc.
 */



angular.module('coreos.ui')
.directive('coToast', function() {
  'use strict';

  return {
    templateUrl: '/coreos.ui/toast/toast.html',
    restrict: 'E',
    replace: true,
    scope: true,
    controller: function($scope, toastSvc) {
      $scope.messages = toastSvc.messages;
      $scope.dismiss = toastSvc.dismiss;
    }
  };
});


angular.module('coreos.services')
.factory('toastSvc', function($timeout) {
  'use strict';

  var AUTO_DISMISS_TIME = 5000,
      service,
      lastTimeoutPromise;

  function dequeue() {
    if (service.messages.length) {
      service.messages.shift();
    }
  }

  function enqueue(type, text) {
    service.messages.push({
      type: type,
      text: text
    });
    lastTimeoutPromise = $timeout(dequeue, AUTO_DISMISS_TIME);
  }

  function cancelTimeout() {
    if (lastTimeoutPromise) {
      $timeout.cancel(lastTimeoutPromise);
    }
  }

  service = {

    messages: [],

    error: enqueue.bind(null, 'error'),

    info: enqueue.bind(null, 'info'),

    dismiss: function(index) {
      cancelTimeout();
      service.messages.splice(index, 1);
    },

    dismissAll: function() {
      cancelTimeout();
      service.messages.length = 0;
    }

  };

  return service;

});



(function(module) {
try {
  module = angular.module('coreos-templates-html');
} catch (e) {
  module = angular.module('coreos-templates-html', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('/coreos.ui/btn-bar/btn-bar.html',
    '<div class="co-m-btn-bar" ng-transclude>\n' +
    '</div>\n' +
    '');
}]);
})();


(function(module) {
try {
  module = angular.module('coreos-templates-html');
} catch (e) {
  module = angular.module('coreos-templates-html', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('/coreos.ui/error-message/error-message.html',
    '<div ng-show="show" class="co-m-message co-m-message--error co-an-fade-in-out ng-hide">{{message}}</div>\n' +
    '');
}]);
})();


(function(module) {
try {
  module = angular.module('coreos-templates-html');
} catch (e) {
  module = angular.module('coreos-templates-html', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('/coreos.ui/loader/inline-loader.html',
    '<div class="co-m-inline-loader co-an-fade-in-out">\n' +
    '  <div class="co-m-loader-dot__one"></div>\n' +
    '  <div class="co-m-loader-dot__two"></div>\n' +
    '  <div class="co-m-loader-dot__three"></div>\n' +
    '</div>\n' +
    '');
}]);
})();

(function(module) {
try {
  module = angular.module('coreos-templates-html');
} catch (e) {
  module = angular.module('coreos-templates-html', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('/coreos.ui/loader/loader.html',
    '<div class="co-m-loader co-an-fade-in-out">\n' +
    '  <div class="co-m-loader-dot__one"></div>\n' +
    '  <div class="co-m-loader-dot__two"></div>\n' +
    '  <div class="co-m-loader-dot__three"></div>\n' +
    '</div>\n' +
    '');
}]);
})();

(function(module) {
try {
  module = angular.module('coreos-templates-html');
} catch (e) {
  module = angular.module('coreos-templates-html', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('/coreos.ui/toast/toast.html',
    '<div class="co-m-toast">\n' +
    '  <div ng-repeat="message in messages"\n' +
    '      class="co-m-toast__message co-m-message co-m-message--{{message.type}} co-an-fade-in-out co-fx-box-shadow">\n' +
    '    {{message.text}}\n' +
    '    <span ng-click="dismiss($index)" class="pull-right glyphicon glyphicon-remove text-right co-m-message__close"></span>\n' +
    '  </div>\n' +
    '</div>\n' +
    '');
}]);
})();
