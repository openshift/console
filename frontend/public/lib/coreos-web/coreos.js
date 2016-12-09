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
    'coreos.events',
    'lodash',
    'jquery',
  ]);
  angular.module('coreos.ui', [
    'coreos.events',
    'lodash',
    'jquery'
  ]);
  angular.module('coreos.filters', ['lodash']);
  angular.module('coreos.events', []);
  angular.module('coreos', [
    'coreos.events',
    'coreos.services',
    'coreos.ui',
    'coreos.filters',
    'coreos-templates-html',
    'coreos-templates-svg',

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

angular.module('coreos.filters')
.filter('orderObjectBy', function() {
  'use strict';

  return function(items, field, reverse) {
    var filtered = [];
    angular.forEach(items, function(item) {
      filtered.push(item);
    });
    filtered.sort(function (a, b) {
      return reverse ? (a[field] < b[field]) : (a[field] > b[field]);
    });
    return filtered;
  };
});

angular.module('coreos.filters')
.filter('utc', function(_) {
  'use strict';

  function convertToUtc(date) {
    return new Date(date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        date.getUTCHours(),
        date.getUTCMinutes(),
        date.getUTCSeconds());
  }

  return function(input) {
    if (_.isNumber(input)) {
      return convertToUtc(new Date(input));
    }
    if (_.isString(input)) {
      return convertToUtc(new Date(Date.parse(input)));
    }
    if (_.isDate(input)) {
      return convertToUtc(input);
    }
    return '';
  };

});

/**
 * Broadcast when the window size breakpoints change.
 * TODO(sym3tri): change implementation to use window.matchMedia instead.
 */

angular.module('coreos.services').provider('configSvc', function() {
  'use strict';

  var configValues = {};

  this.config = function(newConfig) {
    if (newConfig) {
      configValues = newConfig;
    } else {
      return configValues;
    }
  };

  this.$get = function() {
    return {
      get: function(key) {
        if (key) {
          return configValues[key];
        } else {
          return angular.copy(configValues);
        }
      },

      set: function(key, value) {
        configValues[key] = value;
      }
    };
  };

});


angular.module('coreos.events').constant('CORE_EVENT', {
  PAGE_NOT_FOUND: 'core.event.page_not_found',
  BREAKPOINT: 'core.event.breakpoint',
  RESP_ERROR: 'core.event.resp_error',
  RESP_MUTATE: 'core.event.resp_mutate',
  DOC_VISIBILITY_CHANGE: 'core.event.doc_visibility_change',
  POLL_ERROR: 'core.event.poll_error',
  LOCAL_STORAGE_CHANGE: 'core.event.local_storage_change'
});

angular.module('coreos.services')
.factory('coLocalStorage', function($rootScope, $window, CORE_EVENT) {
  'use strict';

  return {

    length: $window.localStorage.length,

    getItem: function(key) {
      return $window.localStorage.getItem(key);
    },

    key: function(n) {
      return $window.localStorage.key(n);
    },

    clear: function() {
      $window.localStorage.clear();
      $rootScope.$broadcast(CORE_EVENT.LOCAL_STORAGE_CHANGE, {
        key: '*'
      });
    },

    removeItem: function(key) {
      $window.localStorage.removeItem(key);
      $rootScope.$broadcast(CORE_EVENT.LOCAL_STORAGE_CHANGE, {
        key: key
      });
    },

    setItem: function(key, value) {
      $window.localStorage.setItem(key, value);
      $rootScope.$broadcast(CORE_EVENT.LOCAL_STORAGE_CHANGE, {
        key: key,
        value: value
      });
    }

  };

});


angular.module('coreos.services')
.factory('arraySvc', function() {
  'use strict';

  return {

    /**
     * Remove first occurance of an item from an array in-place.
     *
     * @param {Arrray} ary Array to mutate.
     * @param {*} item Array item to remove.
     * @return {Array} The input array.
     */
    remove: function(ary, item) {
      var index;
      if (!ary || !ary.length) {
        return [];
      }
      index = ary.indexOf(item);
      if (index > -1) {
        ary.splice(index, 1);
      }
      return ary;
    }

  };

});


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


angular.module('coreos.ui')
/**
 * @fileoverview
 * Displays a message based on a promise.
 */

angular.module('coreos.ui')

.provider('errorMessageSvc', function() {
  'use strict';

  var formatters = {};

  this.registerFormatter = function(name, fn) {
    formatters[name] = fn;
  };

  this.$get = function() {
    return {
      getFormatter: function(name) {
        return formatters[name] || angular.noop;
      }
    };
  };

})

.directive('coErrorMessage', function(errorMessageSvc) {
  'use strict';

  return {
    templateUrl: '/coreos.ui/error-message/error-message.html',
    restrict: 'E',
    replace: true,
    scope: {
      promise: '=',
      formatter: '@',
      customMessage: '@message'
    },
    controller: function postLink($scope) {
      $scope.show = false;

      function handler(resp) {
        if ($scope.formatter) {
          $scope.message =
            errorMessageSvc.getFormatter($scope.formatter)(resp);
        } else if ($scope.customMessage) {
          $scope.message = $scope.customMessage;
        } else {
          throw resp;
        }
        $scope.show = true;

        throw resp;
      }

      $scope.$watch('promise', function(promise) {
        $scope.show = false;
        if (promise && promise.catch) {
          promise.catch(handler);
        }
      });

    }
  };

});



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
 * Adds an active class to <li> tags where a[href], a[ng-href], or
 * a[co-active-match] matches the current url path. Removes any
 * angular interpolated values.
 *
 * Assumes a structure of:
 *
 * <ul co-nav-active="active-class">
 *  <li><a href="/foo/bar">foo bar</a></li>
 *  <li><a ng-href="/foo/{{f.id}}">foo detail</a></li>
 *  <li><a co-active-match="/foo/{{f.id}}/superdetail" href="/redirector">foo super detail</a></li>
 * </ul>
 */

angular.module('coreos.ui')
.directive('coNavActive', function($, _, $location) {
  'use strict';

  // Regex to match angular interpolation vlues.
  var ngVarMatchRE = /{{2}[^}]*}{2}/g;

  return {
    restrict: 'A',
    link: function postLink(scope, elem, attrs) {

      function isActive(href) {
        // is it relative href?
        if (href[0] !== '/') {
          // prefix it with slash to mimic $location.path()
          // behavior as it strips off <base href="..."> prefix
          href = '/' + href;
        }

        var hrefParts, currParts;
        currParts = $location.path().split('/');
        hrefParts = href.replace(ngVarMatchRE, '').split('/');
        if (currParts.length !== hrefParts.length) {
          return false;
        }
        return _.every(currParts, function(part, index) {
          return hrefParts[index] === '' || part === hrefParts[index];
        });
      }

      $('a', elem).each(function() {
        var a = $(this),
            href = a.attr('co-active-match') || a.attr('href') || a.attr('ng-href');
        if (isActive(href)) {
          a.parent().addClass(attrs.coNavActive);
          return;
        }
      });

    }
  };

});


/**
 * @fileoverview
 * Top navbar which inlcudes nav links.
 */

angular.module('coreos.ui')

.directive('coNavbar', function(configSvc) {
  'use strict';

  return {
    templateUrl: '/coreos.ui/navbar/navbar.html',
    transclude: true,
    restrict: 'E',
    replace: true,
    scope: {
      logoSrc: '@',
    },
    controller: function($scope) {
      $scope.config = configSvc.get();
      $scope.isCollapsed = true;
    }
  };

})


/**
 * Simple directive to create bootstrap friendly navbar links.
 * Will automatically add the 'active' class based on the route.
 */
.directive('coNavbarLink', function($location) {
  'use strict';

  return {
    templateUrl: '/coreos.ui/navbar/navbar-link.html',
    transclude: true,
    restrict: 'E',
    replace: true,
    scope: {
      // The path to link to.
      'href': '@'
    },
    link: function(scope) {
      scope.isActive = function() {
        const currentPath = $location.path();
        let href = scope.href;
        // is it relative href?
        if (href[0] !== '/') {
          // prefix it with slash to mimic $location.path()
          // behavior as it strips off <base href="..."> prefix
          href = '/' + href;
        }

        if (currentPath.indexOf(href) >= 0) {
          return true;
        }

        if (href.indexOf('/all-namespaces/') === 0 && currentPath.indexOf('/ns/') === 0) {
          const newPath = currentPath.replace(/^\/ns\/.*?\//, '/all-namespaces/');
          return newPath.indexOf(href) >= 0;
        }

        return false;
      };
    }
  };

});

/**
 * @fileoverview
 * Directive to easily inline svg images.
 * NOTE: kind of a hack to get ng-include to work properly within a directive
 * without wrapping it with an extra DOM element.
 */

angular.module('coreos.ui')
.directive('coSvg', function($, $rootScope, $compile) {
  'use strict';

  return {
    template: '<div></div>',
    restrict: 'E',
    replace: true,
    scope: {
      src: '@',
      width: '@',
      height: '@'
    },
    link: function(scope, elem, attrs) {
      var containerEl, html, newScope;
      newScope = $rootScope.$new();
      html = '<div class="co-m-svg" ' +
              'ng-class="classes" ng-style="style" ng-include="src"></div>';
      newScope.style = {};
      if (scope.width) {
        newScope.style.width = scope.width + 'px';
      }
      if (scope.height) {
        newScope.style.height = scope.height + 'px';
      }
      if (attrs.class) {
        newScope.classes = attrs.class;
      }
      scope.$watch('src', function(src) {
        if (src) {
          newScope.src = src;
          containerEl = $compile(html)(newScope);
          elem.replaceWith(containerEl);
        }
      });
    }
  };

});

angular.module('coreos.ui')
.directive('coTextCopy', function() {
  'use strict';

  return {
    restrict: 'A',
    replace: true,
    link: function(scope, elem) {
      function onClickHandler(event) {
        elem.select();
        event.preventDefault();
        event.stopPropagation();
      }
      elem.on('click', onClickHandler);
      elem.on('$destroy', function() {
        elem.off('click', onClickHandler);
      });
    }
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
  $templateCache.put('/coreos.ui/nav-title/nav-title.html',
    '<div class="co-m-nav-title row">\n' +
    '  <div ng-transclude class="col-lg-3 col-md-3 col-sm-3 col-xs-12"></div>\n' +
    '  <div class="col-lg-6 col-md-6 col-sm-6 col-xs-12">\n' +
    '    <h1 class="co-m-page-title co-fx-text-shadow" ng-bind="title"></h1>\n' +
    '  </div>\n' +
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
  $templateCache.put('/coreos.ui/navbar/navbar-link.html',
    '<li class="co-m-nav-link" ng-class="{\'active\': isActive()}">\n' +
    '  <a ng-href="{{href}}" ng-transclude></a>\n' +
    '</li>\n' +
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
  $templateCache.put('/coreos.ui/navbar/navbar.html',
    '<div class="">\n' +
    '\n' +
    '  <div class="navbar-header">\n' +
    '    <button ng-click="isCollapsed = !isCollapsed" class="navbar-toggle" type="button">\n' +
    '      <span class="fa fa-bars"></span>\n' +
    '    </button>\n' +
    '    <a ng-href="{{config.siteBasePath}}" class="navbar-brand">\n' +
    '      <co-svg ng-if="logoSrc" class="co-m-navbar__logo" src="{{logoSrc}}"></co-svg>\n' +
    '    </a>\n' +
    '  </div>\n' +
    '\n' +
    '  <div uib-collapse="isCollapsed" ng-transclude class="collapse navbar-collapse"></div>\n' +
    '\n' +
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

(function(module) {
try {
  module = angular.module('coreos-templates-svg');
} catch (e) {
  module = angular.module('coreos-templates-svg', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('/coreos.svg/icon-back.svg',
    '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"\n' +
    '  preserveAspectRatio="xMinYMin" viewBox="0 0 73.356 61" enable-background="new 0 0 73.356 61" xml:space="preserve">\n' +
    '  <path d="M5.27,33.226l22.428,22.428c1.562,1.562,4.095,1.562,5.657,0c1.562-1.562,1.562-4.095,0-5.657L17.77,34.413h48.514\n' +
    '  c2.209,0,4-1.791,4-4s-1.791-4-4-4H17.749l15.604-15.582c1.563-1.561,1.565-4.094,0.004-5.657C32.576,4.391,31.552,4,30.527,4\n' +
    '  c-1.023,0-2.046,0.39-2.827,1.169L5.272,27.567c-0.751,0.75-1.173,1.768-1.173,2.829C4.098,31.458,4.52,32.476,5.27,33.226z"/>\n' +
    '</svg>\n' +
    '');
}]);
})();

(function(module) {
try {
  module = angular.module('coreos-templates-svg');
} catch (e) {
  module = angular.module('coreos-templates-svg', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('/coreos.svg/icon-right-arrow.svg',
    '<?xml version="1.0" encoding="utf-8"?>\n' +
    '<!-- Generator: Adobe Illustrator 17.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->\n' +
    '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n' +
    '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"\n' +
    '	 width="6px" height="10px" viewBox="0 0 6 10" enable-background="new 0 0 6 10" xml:space="preserve">\n' +
    '<g>\n' +
    '	<polygon fill="#333333" points="0,0 0,10 6,5 	"/>\n' +
    '</g>\n' +
    '</svg>\n' +
    '');
}]);
})();
