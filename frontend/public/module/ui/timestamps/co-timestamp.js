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
          if (moment().diff(mdate, 'minutes', /* return floating point value */true) >= 10.5) {
            scope.timestamp = mdate.format('MMM DD, h:mm a');
            if (angular.isDefined(intervalReference)) {
              $interval.cancel(intervalReference);
            }
          } else {
            scope.timestamp = mdate.fromNow();
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
