/**
 * @fileoverview
 * Displays a different circular icon for services, controllers, pods, etc.
 */

angular.module('bridge.ui')
.directive('coResourceIcon', function(k8s) {
  'use strict';
  const k8sKind = k8s.enum.Kind;

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
      elem.text(iconLabel(k8sKind, kindId));
    }
  };

});


function iconLabel(k8sKind, kindId) {
  switch (kindId) {
    case k8sKind.REPLICATIONCONTROLLER.id:
      return 'RC';
    case k8sKind.REPLICASET.id:
      return 'RS';
    case k8sKind.DEPLOYMENT.id:
      return 'D';
    case k8sKind.POD.id:
      return 'P';
    case k8sKind.SERVICE.id:
      return 'S';
    case k8sKind.NODE.id:
      return 'N';
    case k8sKind.NAMESPACE.id:
      return 'NS';
    case k8sKind.POLICY.id:
      return 'PCY';
    case k8sKind.TPM.id:
      return 'TPM';
    case 'container':
      return 'C';
    default:
      return kindId.toUpperCase();
  }
  return '';
}

export default iconLabel;
