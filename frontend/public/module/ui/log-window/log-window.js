angular.module('bridge.ui')
.directive('tecLogWindow', function(_, $, $timeout, $window) {
  'use strict';

  return {
    templateUrl: '/static/module/ui/log-window/log-window.html',
    restrict: 'E',
    replace: true,
    scope: {
      state: '=',
      buffer: '=',
      logName: '&'
    },
    link: function(scope, element) {
      var vspace = 300;  // Just some vaguely reasonable value to start with
      var scrollPaneEl = element.find('.log-scroll-pane')[0];
      var updateContents, rescale, followScroll;

      scope.updates = 0;
      scope.pausedAt = 0;
      scope.oldContents = '';
      scope.newContents = '';
      scope.state = 'streaming';

      updateContents = function() {
        if (scope.buffer) {
          if (scope.state === 'paused') {
            scope.pausedAt = scope.linesShown;
            scope.linesBehind = scope.buffer.totalLineCount - scope.pausedAt;
          } else {
            var lines = scope.buffer.lines();
            var linesSincePause = scope.buffer.totalLineCount - scope.pausedAt;
            var pausedBreak = Math.max(lines.length - linesSincePause, 0);
            scope.oldContents = lines.slice(0, pausedBreak).join('');
            scope.newContents = lines.slice(pausedBreak).join('');
            scope.linesShown = scope.buffer.totalLineCount;
          }
        }
      };

      element.find('.log-scroll-pane').bind('scroll', function() {
        // 1px fudge for fractional heights
        var scrollTarget = scrollPaneEl.scrollHeight - (scrollPaneEl.clientHeight + 1);
        if (scrollPaneEl.scrollTop < scrollTarget) {
          scope.state = 'paused';
        } else {
          scope.state = 'streaming';
        }
      });

      rescale = _.debounce(function() {
        var targetHeight;
        var toRescale = $(element).find('.log-contents');
        var originalHeight = toRescale.height();
        var viewportHeight = $($window).height();
        var documentHeight = $($window.document).height();

        if (documentHeight > viewportHeight) {
          vspace = documentHeight - originalHeight;
        }

        targetHeight = Math.max(viewportHeight - vspace, 500);
        if (targetHeight !== originalHeight) { // Saves some cycles when we're at minimum height
          toRescale.height(targetHeight);
        }
      }, 10);

      followScroll = function() {
        // Async because scrollHeight depends on the size of the rendered pane
        $timeout(function() {
          if (scope.state === 'streaming') {
            scrollPaneEl.scrollTop = scrollPaneEl.scrollHeight;
          }
        }, 0);
      };

      scope.unpause = function() {
        scope.state = 'streaming';
      };

      scope.$watch('state', updateContents);
      scope.$watch('buffer.totalLineCount', updateContents);
      scope.$watch('linesShown', followScroll);
      scope.$watch('state', followScroll);

      $($window).resize(rescale);
      rescale();
    }
  };
});
