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
      let tooltipMsg, iconEl,
          reason = attrs.reason,
          kind = attrs.kind;

      if (!reason || !kind) {
        return;
      }

      tooltipMsg = `${reason} (${kind.toLowerCase()})`;
      iconEl = angular.element(`<i uib-tooltip="${tooltipMsg}` +
          '" tooltip-append-to-body="true" tooltip-placement="top" class="co-sysevent-icon"></i>');
      $compile(iconEl)(scope);
      elem.append(iconEl);
    },
  };

});
