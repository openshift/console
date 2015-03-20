/**
 * @fileoverview
 * Displays a different circular icon for services, controllers, pods, etc.
 */

angular.module('app').directive('coResourceIcon', function(k8s) {
  'use strict';

  return {
    template: '<span></span>',
    restrict: 'E',
    replace: true,
    link: function(scope, elem, attrs) {
      var label, kind, id;
      kind = k8s.util.getKindEnumById(attrs.kind);
      if (kind) {
        id = kind.id;
      } else {
        id = attrs.kind;
      }
      elem.addClass('co-m-resource-icon');
      elem.addClass('co-m-resource-icon--' + id);
      switch (id) {
        case k8s.enum.Kind.REPLICATIONCONTROLLER.id:
          label = 'RC';
          break;
        case k8s.enum.Kind.POD.id:
          label = 'P';
          break;
        case k8s.enum.Kind.SERVICE.id:
          label = 'S';
          break;
        case k8s.enum.Kind.NODE.id:
          label = 'M';
          break;
        case 'container':
          label = 'C';
          break;
        default:
          label = attrs.kind[0].toUpperCase();
      }
      elem.text(label);
    }
  };

});
