/**
 * @fileoverview
 * Directive to display and stream cluster events over a websocket.
 */

angular.module('app.ui')
.directive('coSyseventStream', function($log, $interval, k8s, wsFactory) {
  'use strict';

  return {
    templateUrl: '/static/module/ui/sysevents/sysevent-stream.html',
    restrict: 'E',
    replace: true,
    scope: {
      eventsFilter: '=filter',
      namespace: '=',
    },
    controller: function($scope) {
      var updateInterval = 1000;
      $scope.maxMessages = 1000;
      $scope.messages = [];
      $scope.messageBuffer = [];
      $scope.wsActive = true;
      $scope.oldestTimestamp = null;

      function flushBuffer() {
        if (!$scope.wsActive || !$scope.messageBuffer.length) {
          return;
        }
        $scope.messages.unshift.apply($scope.messages, $scope.messageBuffer);
        $scope.messageBuffer = [];
      }

      $scope.getTotalMessage = function() {
        var msg = '',
            count = $scope.filteredMessages ? $scope.filteredMessages.length : 0;
        if (count < $scope.maxMessages) {
          msg = 'Showing ' + count + ' events';
        } else {
          msg = 'Showing ' + count + ' of ' + $scope.messages.length + ' events';
        }
        return msg;
      };

      $scope.updateOldest = function(date, isLast) {
        if (isLast) {
          $scope.oldestTimestamp = date;
        }
      };

      $scope.connect = function() {
        $scope.wsError = false;
        $scope.ws = wsFactory('clusterEvents', {
          scope: $scope,
          host: 'auto',
          path: k8s.resource.watchURL(k8s.enum.Kind.EVENT, { ns: $scope.namespace }),
          jsonParse: true,
        });
      };

      $scope.toggleStream = function(active) {
        $scope.wsActive = active;
        // Reconnect if in error or unconnected state.
        if (active && ($scope.wsError || !$scope.ws)) {
          $scope.connect();
        }
      };

      $scope.$on('ws.message.clusterEvents', function(e, data) {
        $scope.wsError = false;
        $scope.messageBuffer.unshift(data);
      });

      $scope.$on('ws.open.clusterEvents', function() {
        $scope.wsError = false;
      });

      $scope.$on('ws.close.clusterEvents', function() {
        $scope.wsActive = false;
        $scope.wsError = true;
      });

      $scope.$on('ws.error.clusterEvents', function() {
        $log.log('socket error');
        $scope.wsActive = false;
        $scope.wsError = true;
      });

      $interval(flushBuffer, updateInterval);
      $scope.toggleStream(true);
    }

  };

});
