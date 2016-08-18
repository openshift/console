/**
 * A directive that automatically updates classes indicating the following states:
 *   empty, error, loading.
 * Useful for showing special messages or loaders on tables or other dynamic content.
 */

angular.module('mochi.ui.tristate', [])
.directive('cosTristate', function() {
  'use strict';

  var cssClassPrefix = 'cos-tristate',
      states = ['empty', 'error', 'loading'];

  return {
    template: '<div ng-cloak ng-transclude></div>',
    transclude: true,
    restrict: 'EA',
    replace: true,
    scope: {
      'collection': '=cosTristate',
      'errorFlag': '=cosTristateError'
    },
    controller: ["$scope", function($scope) {
      this.isEmpty = function() {
        return $scope.collection && !$scope.collection.length;
      };

      this.isError = function() {
        return $scope.errorFlag;
      };

      this.isLoading = function() {
        return !this.isError() && !$scope.collection;
      }.bind(this);

      this.getState = function() {
        if (this.isError()) {
          return 'error';
        }
        if (this.isEmpty()) {
          return 'empty';
        }
        if (this.isLoading()) {
          return 'loading';
        }
      }.bind(this);
    }],
    link: function(scope, elem, attrs, loadStateCtrl) {
      function reset() {
        states.forEach(function(s) {
          elem.removeClass(cssClassPrefix + '--' + s);
        });
      }

      function updateState(state) {
        reset();
        if (state) {
          elem.addClass(cssClassPrefix + '--' + state);
        }
      }

      scope.$watch(loadStateCtrl.getState, updateState);
    },
  };

});

/**
 * Convenience wrapper for status message boxes that inform user of errors or empty state, etc.
 * The first child element gets a "title" class added to it, all other immediate children get
 * a "detail" class.
 */

angular.module('mochi.ui.statusBox', [])
.directive('cosStatusBox', function() {
  'use strict';

  return {
    template: '<div class="cos-status-box" ng-cloak ng-transclude></div>',
    transclude: true,
    restrict: 'EA',
    replace: true,
    link: function(scope, elem) {
      angular.forEach(elem.children(), function(el, i) {
        if (i === 0) {
          angular.element(el).addClass('cos-status-box__title');
        } else {
          angular.element(el).addClass('cos-status-box__detail');
        }
      });
    }
  };

});

/**
 * This directive generates links to uniquely named routes configured in the
 * standard angular router.
 * It assumes:
 *    - Referenced routes are uniquely named with an additional `name` property in the config.
 *    - All route params are required.
 *    - Route params are case-insensitively unique.
 *
 * Example Usage:
 *
 *  $routeProvider
 *    .when('/accounts/:accountID/purchases/:purchaseID', {
 *      name: 'purchase-detail',
 *      controller: '...',
 *      templateUrl: '...'});
 *
 *  <a cos-route-href="purchase-detail"
 *     account-id="foo"
 *     purchase-id="bar">link</a>
 *
 *  Result: <a href="/accounts/foo/purchases/bar">link</a>
 */

angular.module('mochi.ui.routeHref', ['ngRoute', 'lodash'])

.factory('routeHrefSvc', ["$window", "$route", "_", function($window, $route, _) {
  'use strict';
  var paramPattern = /\:(\w+)/g;

  return {
    expand: expand,
  };

  // Lookup route by name, replace all it's params with the provided values.
  // Any extraneous values are ignored.
  function expand(routeName, rawValues) {
    var values, route;
    route = _.findWhere($route.routes, { name: routeName });
    if (!route) {
      throw 'routeHrefSvc: named route not found: ' + routeName;
    }
    values = extractParamValues(route, rawValues);
    return replace(route.originalPath, values);
  }

  // Format a route path by replacing parameterized values with provided values.
  function replace(path, values) {
    return path.replace(paramPattern, function(match, p) {
      var val = values[p.toLowerCase()];
      if (!val) {
        throw 'routeHrefSvc: required route param not provided: ' + p;
      }
      return val;
    });
  }

  // Introspects the route to determine whitelist of path parameters.
  // Finds all values whose keys match the whitelist and extract the values into a map.
  function extractParamValues(route, rawValues) {
    var routeKeys, values = {};
    routeKeys = route.keys.map(function(r) {
      return r.name.toLowerCase();
    });

    _.forOwn(rawValues, function(val, key) {
      var lowerKey = key.toLowerCase();
      if (_.contains(routeKeys, lowerKey)) {
        values[lowerKey] = $window.encodeURIComponent(val);
      }
    });
    return values;
  }
}])

.directive('cosRouteHref', ["routeHrefSvc", function(routeHrefSvc) {
  'use strict';
  return {
    restrict: 'A',
    link: function(scope, elem, attrs) {
      elem.attr('href', routeHrefSvc.expand(attrs.cosRouteHref, attrs));
    },
  };
}]);

/**
 * @fileoverview
 * Top navbar which inlcudes nav links.
 */

angular.module('mochi.ui.navbar', [])

.directive('cosNavbar', function() {
  'use strict';

  return {
    templateUrl: '/mochi-templates/ui/navbar/navbar.tpl.html',
    transclude: true,
    restrict: 'E',
    replace: true,
    scope: {
      logoSrc: '@',
    },
    controller: ["$scope", function($scope) {
      $scope.isOpen = false;

      $scope.toggle = function() {
        $scope.isOpen = !$scope.isOpen;
      };
    }]
  };

});

/**
 * This file moved by hand from angular-ui-bootstrap, at
 *
 *     https://github.com/angular-ui/bootstrap/commit/5ae5be6625bb30f888a934a4f182300fad0a1fd3
 *
 * with minor alterations, including
 *    - This comment at the top of the file
 *    - The addition of eslint directives disabling checks we use in the rest of the build
 *    - change of the angular module name from 'ui.bootstrap.modal' to 'mochi.ui.modal'
 *    - change of template path 'template/modal/backdrop.html' to '/mochi-templates/ui/modal/modal.backdrop.tpl.html'
 *    - change of template path 'template/modal/window.html' to '/mochi-templates/ui/modal/modal.window.tpl.html'
 *
 * This file also requires templates, modal.backdrop.tpl.html and modal.window.tpl.html, and a SCSS file
 * style/css/modal/modal.scss to function correctly in an app.
 */

/* Rules to allow for the original style of the file */
/*eslint strict:0, eqeqeq:0, comma-spacing:0, no-multi-spaces:0, no-unused-vars:0, max-len:0*/
angular.module('mochi.ui.modal', [])

/**
 * A helper, internal data structure that acts as a map but also allows getting / removing
 * elements in the LIFO order
 */
  .factory('$$stackedMap', function () {
    return {
      createNew: function () {
        var stack = [];

        return {
          add: function (key, value) {
            stack.push({
              key: key,
              value: value
            });
          },
          get: function (key) {
            for (var i = 0; i < stack.length; i++) {
              if (key == stack[i].key) {
                return stack[i];
              }
            }
          },
          keys: function() {
            var keys = [];
            for (var i = 0; i < stack.length; i++) {
              keys.push(stack[i].key);
            }
            return keys;
          },
          top: function () {
            return stack[stack.length - 1];
          },
          remove: function (key) {
            var idx = -1;
            for (var i = 0; i < stack.length; i++) {
              if (key == stack[i].key) {
                idx = i;
                break;
              }
            }
            return stack.splice(idx, 1)[0];
          },
          removeTop: function () {
            return stack.splice(stack.length - 1, 1)[0];
          },
          length: function () {
            return stack.length;
          }
        };
      }
    };
  })

/**
 * A helper directive for the $modal service. It creates a backdrop element.
 */
  .directive('modalBackdrop', [
           '$animate', '$modalStack',
  function ($animate ,  $modalStack) {
    return {
      restrict: 'EA',
      replace: true,
      templateUrl: '/mochi-templates/ui/modal/modal.backdrop.tpl.html',
      compile: function (tElement, tAttrs) {
        tElement.addClass(tAttrs.backdropClass);
        return linkFn;
      }
    };

    function linkFn(scope, element, attrs) {
      if (attrs.modalInClass) {
        $animate.addClass(element, attrs.modalInClass);

        scope.$on($modalStack.NOW_CLOSING_EVENT, function (e, setIsAsync) {
          var done = setIsAsync();
          $animate.removeClass(element, attrs.modalInClass).then(done);
        });
      }
    }
  }])

  .directive('modalWindow', [
           '$modalStack', '$q', '$animate',
  function ($modalStack ,  $q ,  $animate) {
    return {
      restrict: 'EA',
      scope: {
        index: '@'
      },
      replace: true,
      transclude: true,
      templateUrl: function(tElement, tAttrs) {
        return tAttrs.templateUrl || '/mochi-templates/ui/modal/modal.window.tpl.html';
      },
      link: function (scope, element, attrs) {
        element.addClass(attrs.windowClass || '');
        scope.size = attrs.size;

        scope.close = function (evt) {
          var modal = $modalStack.getTop();
          if (modal && modal.value.backdrop && modal.value.backdrop != 'static' && (evt.target === evt.currentTarget)) {
            evt.preventDefault();
            evt.stopPropagation();
            $modalStack.dismiss(modal.key, 'backdrop click');
          }
        };

        // This property is only added to the scope for the purpose of detecting when this directive is rendered.
        // We can detect that by using this property in the template associated with this directive and then use
        // {@link Attribute#$observe} on it. For more details please see {@link TableColumnResize}.
        scope.$isRendered = true;

        // Deferred object that will be resolved when this modal is render.
        var modalRenderDeferObj = $q.defer();
        // Observe function will be called on next digest cycle after compilation, ensuring that the DOM is ready.
        // In order to use this way of finding whether DOM is ready, we need to observe a scope property used in modal's template.
        attrs.$observe('modalRender', function (value) {
          if (value == 'true') {
            modalRenderDeferObj.resolve();
          }
        });

        modalRenderDeferObj.promise.then(function () {
          if (attrs.modalInClass) {
            $animate.addClass(element, attrs.modalInClass);

            scope.$on($modalStack.NOW_CLOSING_EVENT, function (e, setIsAsync) {
              var done = setIsAsync();
              $animate.removeClass(element, attrs.modalInClass).then(done);
            });
          }

          var inputsWithAutofocus = element[0].querySelectorAll('[autofocus]');
          /**
           * Auto-focusing of a freshly-opened modal element causes any child elements
           * with the autofocus attribute to lose focus. This is an issue on touch
           * based devices which will show and then hide the onscreen keyboard.
           * Attempts to refocus the autofocus element via JavaScript will not reopen
           * the onscreen keyboard. Fixed by updated the focusing logic to only autofocus
           * the modal element if the modal does not contain an autofocus element.
           */
          if (inputsWithAutofocus.length) {
            inputsWithAutofocus[0].focus();
          } else {
            element[0].focus();
          }

          // Notify {@link $modalStack} that modal is rendered.
          var modal = $modalStack.getTop();
          if (modal) {
            $modalStack.modalRendered(modal.key);
          }
        });
      }
    };
  }])

  .directive('modalAnimationClass', [
    function () {
      return {
        compile: function (tElement, tAttrs) {
          if (tAttrs.modalAnimation) {
            tElement.addClass(tAttrs.modalAnimationClass);
          }
        }
      };
    }])

  .directive('modalTransclude', function () {
    return {
      link: function($scope, $element, $attrs, controller, $transclude) {
        $transclude($scope.$parent, function(clone) {
          $element.empty();
          $element.append(clone);
        });
      }
    };
  })

  .factory('$modalStack', [
             '$animate', '$timeout', '$document', '$compile', '$rootScope',
             '$q',
             '$$stackedMap',
    function ($animate ,  $timeout ,  $document ,  $compile ,  $rootScope ,
              $q,
              $$stackedMap) {

      var OPENED_MODAL_CLASS = 'modal-open';

      var backdropDomEl, backdropScope;
      var openedWindows = $$stackedMap.createNew();
      var $modalStack = {
        NOW_CLOSING_EVENT: 'modal.stack.now-closing'
      };

      //Modal focus behavior
      var focusableElementList;
      var focusIndex = 0;
      var tababbleSelector = 'a[href], area[href], input:not([disabled]), ' +
        'button:not([disabled]),select:not([disabled]), textarea:not([disabled]), ' +
        'iframe, object, embed, *[tabindex], *[contenteditable=true]';

      function backdropIndex() {
        var topBackdropIndex = -1;
        var opened = openedWindows.keys();
        for (var i = 0; i < opened.length; i++) {
          if (openedWindows.get(opened[i]).value.backdrop) {
            topBackdropIndex = i;
          }
        }
        return topBackdropIndex;
      }

      $rootScope.$watch(backdropIndex, function(newBackdropIndex) {
        if (backdropScope) {
          backdropScope.index = newBackdropIndex;
        }
      });

      function removeModalWindow(modalInstance, elementToReceiveFocus) {

        var body = $document.find('body').eq(0);
        var modalWindow = openedWindows.get(modalInstance).value;

        //clean up the stack
        openedWindows.remove(modalInstance);

        removeAfterAnimate(modalWindow.modalDomEl, modalWindow.modalScope, function() {
          body.toggleClass(OPENED_MODAL_CLASS, openedWindows.length() > 0);
        });
        checkRemoveBackdrop();

        //move focus to specified element if available, or else to body
        if (elementToReceiveFocus && elementToReceiveFocus.focus) {
          elementToReceiveFocus.focus();
        } else {
          body.focus();
        }
      }

      function checkRemoveBackdrop() {
          //remove backdrop if no longer needed
          if (backdropDomEl && backdropIndex() == -1) {
            var backdropScopeRef = backdropScope;
            removeAfterAnimate(backdropDomEl, backdropScope, function () {
              backdropScopeRef = null;
            });
            backdropDomEl = undefined;
            backdropScope = undefined;
          }
      }

      function removeAfterAnimate(domEl, scope, done) {
        var asyncDeferred;
        var asyncPromise = null;
        var setIsAsync = function () {
          if (!asyncDeferred) {
            asyncDeferred = $q.defer();
            asyncPromise = asyncDeferred.promise;
          }

          return function asyncDone() {
            asyncDeferred.resolve();
          };
        };
        scope.$broadcast($modalStack.NOW_CLOSING_EVENT, setIsAsync);

        // Note that it's intentional that asyncPromise might be null.
        // That's when setIsAsync has not been called during the
        // NOW_CLOSING_EVENT broadcast.
        return $q.when(asyncPromise).then(afterAnimating);

        function afterAnimating() {
          if (afterAnimating.done) {
            return;
          }
          afterAnimating.done = true;

          $animate.leave(domEl);
          scope.$destroy();
          if (done) {
            done();
          }
        }
      }

      $document.bind('keydown', function (evt) {
        var modal = openedWindows.top();
        if (modal && modal.value.keyboard) {
          switch (evt.which){
            case 27: {
              evt.preventDefault();
              $rootScope.$apply(function () {
                $modalStack.dismiss(modal.key, 'escape key press');
              });
              break;
            }
            case 9: {
              $modalStack.loadFocusElementList(modal);
              var focusChanged = false;
              if (evt.shiftKey) {
                if ($modalStack.isFocusInFirstItem(evt)) {
                  focusChanged = $modalStack.focusLastFocusableElement();
                }
              } else {
                if ($modalStack.isFocusInLastItem(evt)) {
                  focusChanged = $modalStack.focusFirstFocusableElement();
                }
              }

              if (focusChanged) {
                evt.preventDefault();
                evt.stopPropagation();
              }
              break;
            }
          }
        }
      });

      $modalStack.open = function (modalInstance, modal) {

        var modalOpener = $document[0].activeElement;

        openedWindows.add(modalInstance, {
          deferred: modal.deferred,
          renderDeferred: modal.renderDeferred,
          modalScope: modal.scope,
          backdrop: modal.backdrop,
          keyboard: modal.keyboard
        });

        var body = $document.find('body').eq(0),
            currBackdropIndex = backdropIndex();

        if (currBackdropIndex >= 0 && !backdropDomEl) {
          backdropScope = $rootScope.$new(true);
          backdropScope.index = currBackdropIndex;
          var angularBackgroundDomEl = angular.element('<div modal-backdrop="modal-backdrop"></div>');
          angularBackgroundDomEl.attr('backdrop-class', modal.backdropClass);
          if (modal.animation) {
            angularBackgroundDomEl.attr('modal-animation', 'true');
          }
          backdropDomEl = $compile(angularBackgroundDomEl)(backdropScope);
          body.append(backdropDomEl);
        }

        var angularDomEl = angular.element('<div modal-window="modal-window"></div>');
        angularDomEl.attr({
          'template-url': modal.windowTemplateUrl,
          'window-class': modal.windowClass,
          'size': modal.size,
          'index': openedWindows.length() - 1,
          'animate': 'animate'
        }).html(modal.content);
        if (modal.animation) {
          angularDomEl.attr('modal-animation', 'true');
        }

        var modalDomEl = $compile(angularDomEl)(modal.scope);
        openedWindows.top().value.modalDomEl = modalDomEl;
        openedWindows.top().value.modalOpener = modalOpener;
        body.append(modalDomEl);
        body.addClass(OPENED_MODAL_CLASS);
        $modalStack.clearFocusListCache();
      };

      function broadcastClosing(modalWindow, resultOrReason, closing) {
          return !modalWindow.value.modalScope.$broadcast('modal.closing', resultOrReason, closing).defaultPrevented;
      }

      $modalStack.close = function (modalInstance, result) {
        var modalWindow = openedWindows.get(modalInstance);
        if (modalWindow && broadcastClosing(modalWindow, result, true)) {
          modalWindow.value.deferred.resolve(result);
          removeModalWindow(modalInstance, modalWindow.value.modalOpener);
          return true;
        }
        return !modalWindow;
      };

      $modalStack.dismiss = function (modalInstance, reason) {
        var modalWindow = openedWindows.get(modalInstance);
        if (modalWindow && broadcastClosing(modalWindow, reason, false)) {
          modalWindow.value.deferred.reject(reason);
          removeModalWindow(modalInstance, modalWindow.value.modalOpener);
          return true;
        }
        return !modalWindow;
      };

      $modalStack.dismissAll = function (reason) {
        var topModal = this.getTop();
        while (topModal && this.dismiss(topModal.key, reason)) {
          topModal = this.getTop();
        }
      };

      $modalStack.getTop = function () {
        return openedWindows.top();
      };

      $modalStack.modalRendered = function (modalInstance) {
        var modalWindow = openedWindows.get(modalInstance);
        if (modalWindow) {
          modalWindow.value.renderDeferred.resolve();
        }
      };

      $modalStack.focusFirstFocusableElement = function() {
        if (focusableElementList.length > 0) {
          focusableElementList[0].focus();
          return true;
        }
        return false;
      };
      $modalStack.focusLastFocusableElement = function() {
        if (focusableElementList.length > 0) {
          focusableElementList[focusableElementList.length - 1].focus();
          return true;
        }
        return false;
      };

      $modalStack.isFocusInFirstItem = function(evt) {
        if (focusableElementList.length > 0) {
          return (evt.target || evt.srcElement) == focusableElementList[0];
        }
        return false;
      };

      $modalStack.isFocusInLastItem = function(evt) {
        if (focusableElementList.length > 0) {
          return (evt.target || evt.srcElement) == focusableElementList[focusableElementList.length - 1];
        }
        return false;
      };

      $modalStack.clearFocusListCache = function() {
        focusableElementList = [];
        focusIndex = 0;
      };

      $modalStack.loadFocusElementList = function(modalWindow) {
        if (focusableElementList === undefined || !focusableElementList.length0) {
          if (modalWindow) {
            var modalDomE1 = modalWindow.value.modalDomEl;
            if (modalDomE1 && modalDomE1.length) {
              focusableElementList = modalDomE1[0].querySelectorAll(tababbleSelector);
            }
          }
        }
      };

      return $modalStack;
    }])

  .provider('$modal', function () {

    var $modalProvider = {
      options: {
        animation: true,
        backdrop: true, //can also be false or 'static'
        keyboard: true
      },
      $get: ['$injector', '$rootScope', '$q', '$templateRequest', '$controller', '$modalStack',
        function ($injector, $rootScope, $q, $templateRequest, $controller, $modalStack) {

          var $modal = {};

          function getTemplatePromise(options) {
            return options.template ? $q.when(options.template) :
              $templateRequest(angular.isFunction(options.templateUrl) ? (options.templateUrl)() : options.templateUrl);
          }

          function getResolvePromises(resolves) {
            var promisesArr = [];
            angular.forEach(resolves, function (value) {
              if (angular.isFunction(value) || angular.isArray(value)) {
                promisesArr.push($q.when($injector.invoke(value)));
              }
            });
            return promisesArr;
          }

          $modal.open = function (modalOptions) {

            var modalResultDeferred = $q.defer();
            var modalOpenedDeferred = $q.defer();
            var modalRenderDeferred = $q.defer();

            //prepare an instance of a modal to be injected into controllers and returned to a caller
            var modalInstance = {
              result: modalResultDeferred.promise,
              opened: modalOpenedDeferred.promise,
              rendered: modalRenderDeferred.promise,
              close: function (result) {
                return $modalStack.close(modalInstance, result);
              },
              dismiss: function (reason) {
                return $modalStack.dismiss(modalInstance, reason);
              }
            };

            //merge and clean up options
            modalOptions = angular.extend({}, $modalProvider.options, modalOptions);
            modalOptions.resolve = modalOptions.resolve || {};

            //verify options
            if (!modalOptions.template && !modalOptions.templateUrl) {
              throw new Error('One of template or templateUrl options is required.');
            }

            var templateAndResolvePromise =
              $q.all([getTemplatePromise(modalOptions)].concat(getResolvePromises(modalOptions.resolve)));


            templateAndResolvePromise.then(function resolveSuccess(tplAndVars) {

              var modalScope = (modalOptions.scope || $rootScope).$new();
              modalScope.$close = modalInstance.close;
              modalScope.$dismiss = modalInstance.dismiss;

              var ctrlInstance, ctrlLocals = {};
              var resolveIter = 1;

              //controllers
              if (modalOptions.controller) {
                ctrlLocals.$scope = modalScope;
                ctrlLocals.$modalInstance = modalInstance;
                angular.forEach(modalOptions.resolve, function (value, key) {
                  ctrlLocals[key] = tplAndVars[resolveIter++];
                });

                ctrlInstance = $controller(modalOptions.controller, ctrlLocals);
                if (modalOptions.controllerAs) {
                  if (modalOptions.bindToController) {
                    angular.extend(ctrlInstance, modalScope);
                  }

                  modalScope[modalOptions.controllerAs] = ctrlInstance;
                }
              }

              $modalStack.open(modalInstance, {
                scope: modalScope,
                deferred: modalResultDeferred,
                renderDeferred: modalRenderDeferred,
                content: tplAndVars[0],
                animation: modalOptions.animation,
                backdrop: modalOptions.backdrop,
                keyboard: modalOptions.keyboard,
                backdropClass: modalOptions.backdropClass,
                windowClass: modalOptions.windowClass,
                windowTemplateUrl: modalOptions.windowTemplateUrl,
                size: modalOptions.size
              });

            }, function resolveError(reason) {
              modalResultDeferred.reject(reason);
            });

            templateAndResolvePromise.then(function () {
              modalOpenedDeferred.resolve(true);
            }, function (reason) {
              modalOpenedDeferred.reject(reason);
            });

            return modalInstance;
          };

          return $modal;
        }]
    };

    return $modalProvider;
  });

/**
 * @fileoverview
 *
 * Loading indicator that centers itself inside its parent.
 */
angular.module('mochi.ui.loader', [])
.directive('cosLoader', function() {
  'use strict';
  return {
    templateUrl: '/mochi-templates/ui/loader/loader.tpl.html',
    restrict: 'E',
    replace: true,
    link: function(scope, elem, attr) {
      if (attr.cosInline) {
        elem.addClass('cos-loader--inline');
      }
    }
  };
});

angular.module('mochi.ui.flowProgress', [])
.directive('cosFlowProgress', function() {
  'use strict';

  return {
    template: '<ul class="cos-flow-progress" ng-transclude></ul>',
    transclude: true,
    restrict: 'EA',
    replace: true,
    link: function(scope, elem, attrs) {
      var children = elem.children();
      children.wrapInner('<span class="cos-flow-progress__item-wrap"></span>');

      attrs.$observe('activeIndex', function(index) {
        var i;
        children.removeClass('cos-flow-progress--active');
        i = parseInt(index, 10);
        if (!children || !children.length || isNaN(i) || i >= children.length) {
          return;
        }
        angular.element(children[i]).addClass('cos-flow-progress--active');
      });
    },
  };

});

angular.module('mochi.ui.facetMenu', [])

.directive('cosFacetMenu', function() {
  'use strict';

  return {
    templateUrl: '/mochi-templates/ui/facet-menu/menu.tpl.html',
    transclude: true,
    restrict: 'E',
    replace: true,
    scope: {
      title: '@',
      model: '='
    },
    controller: ["$scope", function($scope) {
      this.getValue = function() {
        return $scope.model;
      };
      this.setValue = function(val) {
        $scope.model = val;
      };
    }]
  };
})


.directive('cosFacetMenuOption', function() {
  'use strict';

  return {
    templateUrl: '/mochi-templates/ui/facet-menu/option.tpl.html',
    transclude: true,
    restrict: 'E',
    replace: true,
    require: '^cosFacetMenu',
    scope: {
      value: '@'
    },
    link: function(scope, elem, attr, facetMenuCtrl) {
      elem.on('click', function(e) {
        scope.$apply(function() {
          facetMenuCtrl.setValue(scope.value);
        });
        e.preventDefault();
        e.stopPropagation();
      });

      scope.$watch(function() {
        return facetMenuCtrl.getValue();
      }, function(val) {
        scope.isActive = scope.value === val;
      });
    }
  };
});

angular.module('mochi.ui.dropdown', ['jquery'])
.directive('cosDropdown', ["$", "$document", function($, $document) {
  'use strict';

  return {
    restrict: 'A',
    replace: true,
    link: function(scope, elem, attrs) {
      var isOpen, openClass, toggleEl;
      isOpen = false;
      openClass = 'cos-dropdown--open';
      toggleEl = $('.cos-dropdown__toggle', elem);

      elem.addClass('cos-dropdown');
      if (attrs.cosDropdown === 'right') {
        elem.addClass('cos-dropdown--anchor-right');
      }

      function close() {
        if (isOpen) {
          elem.removeClass(openClass);
        }
        detachDocHandlers();
        isOpen = false;
      }

      function open() {
        if (isOpen) {
          return;
        }
        elem.addClass(openClass);
        attachDocHandlers();
        isOpen = true;
      }

      function toggleClickHandler(e) {
        if (isOpen) {
          close();
        } else {
          open();
        }
        e.preventDefault();
      }

      function docClickHandler(e) {
        if (e.target !== toggleEl.get(0)) {
          close();
        }
      }

      function escKeyHandler(e) {
        if (e.which === 27) {
          close();
        }
      }

      function attachDocHandlers() {
        $document.on('click', docClickHandler);
        $document.on('keydown', escKeyHandler);
      }

      function detachDocHandlers() {
        $document.off('click', docClickHandler);
        $document.off('keydown', escKeyHandler);
      }

      toggleEl.on('click', toggleClickHandler);
      scope.$on('$locationChangeSuccess', close);
      scope.$on('$destroy', function() {
        toggleEl.off();
        detachDocHandlers();
      });
    }
  };

}]);

angular.module('mochi.ui.clickSelect', ['jquery'])
.directive('cosClickSelect', function() {
  'use strict';

  return {
    restrict: 'A',
    replace: true,
    link: function(scope, elem) {
      function clickHandler(event) {
        elem.select();
        event.preventDefault();
        event.stopPropagation();
      }
      elem.on('click', clickHandler);
      elem.on('$destroy', function() {
        elem.off('click', clickHandler);
      });
    }
  };

});

/**
 * @fileoverview
 * Wrap buttons and automatically enable/disbale and show loading indicator.
 */

angular.module('mochi.ui.btnBar', ['jquery'])
.directive('cosBtnBar', ["$", "$timeout", "$compile", function($, $timeout, $compile) {
  'use strict';

  return {
    template: '<div class="cos-btn-bar" ng-transclude></div></div>',
    restrict: 'EA',
    transclude: true,
    replace: true,
    scope: {
      // A promise that indicates completion of async operation.
      'completePromise': '='
    },
    link: function(scope, elem) {
      var linkButton, loaderDirectiveEl, origDisplayVal;

      linkButton = $('.btn-link', elem).last();
      loaderDirectiveEl = angular.element('<cos-loader cos-inline="true"></cos-loader>');
      $compile(loaderDirectiveEl)(scope);

      function disableButtons() {
        elem.append(loaderDirectiveEl);
        $('button', elem).attr('disabled', 'disabled');
        origDisplayVal = linkButton.css('display');
        linkButton.css('display', 'none');
      }

      function enableButtons() {
        loaderDirectiveEl.remove();
        $('button', elem).removeAttr('disabled');
        linkButton.css('display', origDisplayVal);
      }

      scope.$watch('completePromise', function(completePromise) {
        if (completePromise) {
          // Force async execution so disabling the button won't prevent form
          // submission.
          $timeout(disableButtons, 0);
          completePromise.finally(function() {
            // Also enable buttons asynchronously in case the request completes
            // before disableButtons() runs.
            $timeout(enableButtons, 0);
          });
        }
      });
    }

  };

}]);

/**
 * HTML5 autofocus property can be finicky when it comes to dynamically
 * loaded templates and such with AngularJS.
 *
 * Usage:
 * <input type="text" autofocus />
 */

angular.module('mochi.ui.autofocus', [])

.directive('autofocus', ["$timeout", function($timeout) {
  'use strict';
  return {
    restrict: 'A',
    link: function(scope, elem) {
      $timeout(function() {
        elem[0].focus();
      });
    }
  };
}]);

/**
 * Common utility functions for working with JavaScript Objects, Arrays, Strings, etc.
 */

angular.module('mochi.svc.util', ['lodash'])

.factory('util', ["_", function(_) {
  'use strict';

  var util = {

    /**
     * Extends underscore.isEmpty() to test values beyond just arrays & objects.
     *
     * @param {*} v is a value of any type to check.
     * @return {bool}
     */
    isEmpty: function(v) {
      if ((_.isObject(v) || _.isArray(v)) && _.isEmpty(v)) {
        return true;
      }
      if (_.isNaN(v) || _.isNull(v) || _.isUndefined(v) || v === '') {
        return true;
      }
      return false;
    },

    /**
     * Checks if all own properties of an object are empty.
     * Returns true if all are empty, false otherwise.
     *
     * @param {Object} obj is the object to inspect.
     * @return {bool}
     */
    allEmpty: function(obj) {
      return _.every(_.values(obj), util.isEmpty);
    },

    /**
     * Iterates thru all own properties of an object and deletes anything
     * identified by the filter function. Returns the same object.
     *
     * @param {Object} obj is the object to mutate.
     * @param {function()} fn is the filter function.
     * @return {Object}
     */
    deleteProps: function(obj, fn) {
      _.each(obj, function(val, key) {
        if (fn(val)) {
          delete obj[key];
        }
      });
      return obj;
    },

    /**
     * Deletes all object properties with values strictly equal to null.
     * Returns the same object.
     *
     * @param {Object} obj is the object to mutate.
     * @return {Object}
     */
    deleteNulls: function(obj) {
      util.deleteProps(obj, _.isNull);
      return obj;
    },

    /**
     * Deletes all object properties with empty values on the supplied object.
     * Returns the same object.
     *
     * @param {Object} obj is the object to mutate.
     * @return {Object}
     */
    deleteEmpties: function(obj) {
      util.deleteProps(obj, util.isEmpty);
      return obj;
    },

    /**
     * Less typing to avoid "property undefined" errors.
     * Descends into an object for all properties provided by dot-separated
     * selector string to check for existence. Retunrs true if the property
     * exists, otherwise returns false.
     * Does not inspect the value of the last property.
     *
     * @param {string} selector is a dot separated string of property names.
     * @param {Object} obj is the object to check.
     * @return {bool}
     */
    propExists: function(selector, obj) {
      var currObj;
      if (!_.isObject(obj) || _.isEmpty(obj) || !selector) {
        return false;
      }

      currObj = obj;
      return selector.split('.').every(function(prop) {
        if (currObj && currObj.hasOwnProperty(prop)) {
          currObj = currObj[prop];
          return true;
        }
        return false;
      });
    },

    /**
     * A smarter version of Array.prototype.join() for turning complex collections into strings.
     *
     * If a predicate function is provided it it used to determine each individual label,
     * otherwise the collection is assumed to be an array of strings.
     * Predicate function is passed the same arguments as _.map().
     *
     * @param {Object|Array.<Object|string>} collection of items to join.
     * @param {string=} separator to separate items by. Default is empty space.
     * @param {function()=} fn predicate to run on each item to map it to a string.
     * @return {string}
     */
    join: function(collection, separator, fn) {
      var labels = _.map(collection, function(v) {
        if (fn) {
          return fn.apply(null, arguments);
        }
        return v;
      });
      return labels.join(separator || ' ');
    },

  };

  return util;

}]);

/**
 * Provides access to global page flags.
 * Useful for accessing flags rendered by server into html page.
 */
angular.module('mochi.svc.flag', [])
.provider('flag', function() {
  'use strict';

  var globalId;

  this.setGlobalId = function(id) {
    globalId = id;
  };

  this.$get = ["$window", function($window) {
    return {
      // Get a global flag by name.
      get: function(name) {
        return $window[globalId][name];
      },
      all: function() {
        return $window[globalId];
      },
    };
  }];

});

angular.module('mochi.ui', [
    'ngAnimate',
    'ngRoute',
    'lodash',
    'mochi.ui.autofocus',
    'mochi.ui.btnBar',
    'mochi.ui.clickSelect',
    'mochi.ui.dropdown',
    'mochi.ui.facetMenu',
    'mochi.ui.flowProgress',
    'mochi.ui.loader',
    'mochi.ui.modal',
    'mochi.ui.navbar',
    'mochi.ui.routeHref',
    'mochi.ui.statusBox',
    'mochi.ui.tristate',
]);

angular.module('mochi.svc', [
    'mochi.svc.flag',
    'mochi.svc.util',
]);

/**
 * Formal module definitions for non-angular dependencies.
 * This file only exists to assist test runner and build tools.
 * Disregard if not needed.
 */

angular.module('lodash', []).factory('_', ["$window", function($window) {
  'use strict';
  return $window._;
}]);

angular.module('jquery', []).factory('$', ["$window", function($window) {
  'use strict';
  return $window.$;
}]);
