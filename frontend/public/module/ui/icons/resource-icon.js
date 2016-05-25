/**
 * @fileoverview
 * Displays a different circular icon for services, controllers, pods, etc.
 */

angular.module('bridge.ui')
.directive('coResourceIcon', function(k8s) {
  'use strict';

  function iconLabel(kindId) {
    switch (kindId) {
      case k8s.enum.Kind.REPLICATIONCONTROLLER.id:
        return 'RC';
      case k8s.enum.Kind.REPLICASET.id:
        return 'RS';
      case k8s.enum.Kind.POD.id:
        return 'P';
      case k8s.enum.Kind.SERVICE.id:
        return 'S';
      case k8s.enum.Kind.NODE.id:
        return 'N';
      case k8s.enum.Kind.NAMESPACE.id:
        return 'NS';
      case 'container':
        return 'C';
      default:
        return kindId.toUpperCase();
    }
    return '';
  }

  return {
    template: '<span></span>',
    restrict: 'E',
    replace: true,
    link: function(scope, elem, attrs) {
      var kind, kindInput, kindId;
      kindInput = (attrs.kind || '').toLowerCase();
      kind = k8s.util.getKindEnumById(kindInput);
      if (kind) {
        kindId = kind.id;
      } else {
        kindId = kindInput;
      }
      elem.addClass('co-m-resource-icon co-m-resource-icon--' + kindId);
      elem.text(iconLabel(kindId));
    }
  };

});
