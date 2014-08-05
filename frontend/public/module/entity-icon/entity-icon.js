/**
 * @fileoverview
 * Displays a different circular icon for services, controllers, pods, etc.
 */

'use strict';

angular.module('app').directive('coEntityIcon', function() {

  return {
    template: '<span></span>',
    restrict: 'E',
    replace: true,
    link: function(scope, elem, attrs) {
      elem.addClass('co-m-entity-icon');
      elem.addClass('co-m-entity-icon--' + attrs.type);
      elem.text(attrs.type[0].toUpperCase());
    }
  };

});
