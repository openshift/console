/**
 * @fileoverview
 * Displays a different circular icon for services, controllers, pods, etc.
 */

angular.module('bridge.ui')
.directive('coResourceIcon', function(k8s) {
  'use strict';
  const kind = k8s.enum.Kind;
  function iconLabel(kindId) {

    switch (kindId) {
      case kind.REPLICATIONCONTROLLER.id:
        return 'RC';
      case kind.REPLICASET.id:
        return 'RS';
      case kind.DEPLOYMENT.id:
        return 'D';
      case kind.POD.id:
        return 'P';
      case kind.SERVICE.id:
        return 'S';
      case kind.NODE.id:
        return 'N';
      case kind.NAMESPACE.id:
        return 'NS';
      case kind.POLICY.id:
        return 'TPM';
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
