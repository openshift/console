/**
 * A directive meant to be used alongside ng-view.
 * This will hide the current view and show an error message when page-error events are emitted.
 */
angular.module('creme.ui')
.directive('tecViewLoader', function($rootScope, $, $compile) {
  'use strict';

  return {
    templateUrl: '/static/module/ui/signup-progress.html',
    restrict: 'A',
    priority: 1,
    link: function(scope, elem, attrs) {
      var errorEl, viewEl;
      viewEl = $(elem.children()[0]);

      function showError(msg) {
        if (errorEl && errorEl.scope()) {
          errorEl.scope().$destroy();
        }
        viewEl.hide();
        errorEl = angular.element('<tec-error-page></tec-error-page>');
        errorEl.attr('message', msg || '');
        $compile(errorEl)(scope);
        elem.append(errorEl);
      }

      // e: the error that is emitted.
      // rejection: the rejected promise that triggered the error.
      // msg: an override message when explicit msg is desired.
      function handleError(e, rejection, msg) {
        // override msg takes priority if present.
        if (msg) {
          showError(msg);
          return;
        }

        // msg cannot be extracted if rejection is empty.
        if (!rejection) {
          showError(null);
          return;
        }

        // if rejection value is a simple string, show that
        if (angular.isString(rejection)) {
          showError(rejection);
          return;
        }

        if (rejection.message) {
          showError(rejection.message);
          return;
        }

        if (rejection.data) {
          showError(rejection.data.description);
          return;
        }

        // As a last resort display the http request status text.
        if (rejection.statusText) {
          showError(rejection.statusText);
          return;
        }

        showError(null);
      }

      $rootScope.$on('page-load-error', handleError);
    },
  };

});
