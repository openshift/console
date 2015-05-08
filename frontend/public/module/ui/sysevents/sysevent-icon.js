/**
 * @fileoverview
 * Display an icon based on a kubernetes cluster event.
 */

angular.module('bridge.ui')
.directive('coSyseventIcon', function($compile) {
  'use strict';

  return {
    template: '<span></span>',
    restrict: 'E',
    replace: true,
    link: function(scope, elem, attrs) {
      var tooltipMsg, cssClass, iconEl,
          reason = attrs.reason,
          kind = attrs.kind;

      if (!reason || !kind) {
        return;
      }

      tooltipMsg = reason + ' (' + kind.toLowerCase() + ')';
      cssClass = 'fa co-sysevent-icon co-sysevent-icon--' + kind.toLowerCase() + '-' + reason.toLowerCase();
      iconEl = angular.element('<i tooltip="' + tooltipMsg +
          '" tooltip-append-to-body="true" tooltip-placement="top" class="' + cssClass + '"></i>');
      $compile(iconEl)(scope);
      elem.append(iconEl);
    },
  };

});
