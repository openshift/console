/**
 * @fileoverview
 * Displays a formatted timestamp.
 */

angular.module('bridge.ui')
.directive('coTimestamp', function(moment, $interval) {
  'use strict';

  return {
    templateUrl: '/static/module/ui/timestamps/co-timestamp.html',
    restrict: 'E',
    replace: true,
    scope: {
      timestamp: '@',
    },
    link: function(scope, el, attrs) {
      attrs.$observe('timestamp', function(timestamp) {
        scope.invalidDate = false;
        // Ensure we're converting to local TZ first.
        var date = new Date(timestamp),
            mdate = moment(date);
        if (!mdate.isValid()) {
          scope.invalidDate = true;
          return;
        }

        var intervalReference;
        const updateTimestamp = function() {
          const minutesAgo = moment().diff(mdate, 'minutes', /* return floating point value */true);
          if (minutesAgo >= 10.5) {
            scope.timestamp = mdate.format('MMM DD, h:mm a');
            if (angular.isDefined(intervalReference)) {
              $interval.cancel(intervalReference);
            }
          } else {
            // 0-14:  a few seconds ago
            // 15-44: less than a minute ago
            // 45-89: a minute ago
            const secondsAgo = moment().diff(mdate, 'seconds', /* return floating point value */true);
            if (secondsAgo < 45 && secondsAgo >= 15) {
              scope.timestamp = 'less than a minute ago';
            } else {
              scope.timestamp = mdate.fromNow();
            }
            if (!intervalReference) {
              intervalReference = $interval(updateTimestamp, 1000);
              scope.$on('$destroy', $interval.cancel.bind(null, intervalReference));
            }
          }
        };
        updateTimestamp();

        scope.timestampUTC = mdate.utc().format('MMM DD, H:mm A z');
      });
    },
  };

});
