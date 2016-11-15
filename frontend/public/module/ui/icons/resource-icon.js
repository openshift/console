/**
 * @fileoverview
 * Displays a different circular icon for services, controllers, pods, etc.
 */

import {util} from '../../k8s/util';

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
      kind = util.getKindEnumById(kindInput);
      if (kind) {
        kindId = kind.id;
      } else {
        kindId = kindInput;
      }
      elem.addClass(`co-m-resource-icon co-m-resource-icon--${kindId}`);
      elem.text(iconLabel(k8sKind, kindId));
    }
  };

});


function iconLabel(k8sKind, kindId) {
  switch (kindId) {
    case k8sKind.PETSET.id:
      return 'PS';
    case k8sKind.REPLICATIONCONTROLLER.id:
      return 'RC';
    case k8sKind.REPLICASET.id:
      return 'RS';
    case k8sKind.DEPLOYMENT.id:
      return 'D';
    case k8sKind.JOB.id:
      return 'J';
    case k8sKind.POD.id:
      return 'P';
    case k8sKind.SERVICE.id:
      return 'S';
    case k8sKind.NODE.id:
      return 'N';
    case k8sKind.NAMESPACE.id:
      return 'NS';
    case k8sKind.CONTAINER.id:
      return 'C';
    case k8sKind.DAEMONSET.id:
      return 'DS';
    case k8sKind.CONFIGMAP.id:
      return 'CM';
    case k8sKind.SECRET.id:
      return 'S';
    case k8sKind.HORIZONTALPODAUTOSCALER.id:
      return 'HPA';
    case k8sKind.SERVICEACCOUNT.id:
      return 'SA';
    case k8sKind['*'].id:
      return 'All';
    case k8sKind.ROLE.id:
      return 'R';
    case k8sKind.ROLEBINDING.id:
      return 'RB';
    case k8sKind.CLUSTERROLE.id:
      return 'CR';
    case k8sKind.CLUSTERROLEBINDING.id:
      return 'CRB';
    default:
      return kindId.toUpperCase().slice(0, 2);
  }
}

export default iconLabel;
