/**
 * @fileoverview
 * Directive to display and stream cluster events over a websocket.
 */

angular.module('bridge.ui')
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
      $scope.maxMessages = 1000;
      $scope.messages = [];
      $scope.oldestTimestamp = null;

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

      $scope.ws = wsFactory('sysevents', {
        scope: $scope,
        host: 'auto',
        reconnect: true,
        path: k8s.resource.watchURL(k8s.enum.Kind.EVENT, { ns: $scope.namespace }),
        jsonParse: true,
        bufferEnabled: true,
        bufferFlushInterval: 500,
        bufferMax: $scope.maxMessages,
      })
      .onmessage(function(data) {
        $scope.messages.unshift(data);
      })
      .onopen(function() {
        $scope.messages = [];
      })
      .onclose(function() {
        $scope.messages = [];
      })
      .onerror(function() {
        $scope.messages = [];
      });

      $scope.wsConnected = function() {
        return $scope.ws.state() === 'open';
      };

      $scope.wsError = function() {
        var state = $scope.ws.state();
        return state === 'error' || state === 'closed' || state === 'destroyed';
      };

      $scope.wsLoading = function() {
        return $scope.ws.state() === 'init';
      };

      $scope.toggleStream = function(active) {
        if (active) {
          $scope.ws.unpause();
        } else {
          $scope.ws.pause();
        }
      };

      $scope.$watch('ws.isPaused()', function(isPaused) {
        $scope.btnActive = !isPaused;
      });
    }

  };

});
