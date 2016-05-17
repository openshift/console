/**
 * @fileoverview
 * Directive to display and stream cluster events over a websocket.
 */

angular.module('bridge.ui')
.directive('coSyseventStream', function(_, $filter, $log, $interval, k8s, wsFactory) {
  'use strict';

  var sysevents = $filter('sysevents');

  return {
    templateUrl: '/static/module/ui/sysevents/sysevent-stream.html',
    restrict: 'E',
    replace: true,
    scope: {
      eventsFilter: '=filter',
      namespace: '=',
      fieldSelector: '=',
    },
    controller: function($scope) {
      $scope.maxMessages = 500;
      $scope.messages = [];
      $scope.oldestTimestamp = null;

      // This is a workaround for a Kubernetes bug that is being
      // addressed, where some events are missing uids.  It should be
      // removed if the issue is fixed in Kubernetes 1.2 or greater.
      $scope.eventID = function(event) {
        var ret;
        if (event.object.metadata.uid) {
          ret = 'U:' + event.object.metadata.uid;
        } else {
          ret = 'N:' + event.object.metadata.name + ':' + event.object.metadata.resourceVersion;
        }
        return ret;
      };

      $scope.$watchCollection('messages', function() {
        $scope.filteredMessages = _.chain(sysevents($scope.messages, $scope.eventsFilter))
          .uniq($scope.eventID)
          .sortBy((e) => e.object.lastTimestamp)
          .reverse()
          .slice(0, $scope.maxMessages)
          .value()
        ;
      });

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

      var params = { ns: $scope.namespace };
      if ($scope.fieldSelector) {
        params.fieldSelector = $scope.fieldSelector;
      }

      $scope.ws = wsFactory('sysevents', {
        scope: $scope,
        host: 'auto',
        reconnect: true,
        path: k8s.resource.watchURL(k8s.enum.Kind.EVENT, params),
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
