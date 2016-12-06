/**
 * @fileoverview
 * Displays a different circular icon for services, controllers, pods, etc.
 */

import {util} from '../../k8s/util';

function iconLabel(kind) {
  switch (kind) {
    case 'petset':
      return 'PS';
    case 'replicationcontroller':
      return 'RC';
    case 'replicaset':
      return 'RS';
    case 'deployment':
      return 'D';
    case 'job':
      return 'J';
    case 'pod':
      return 'P';
    case 'service':
      return 'S';
    case 'node':
      return 'N';
    case 'namespace':
      return 'NS';
    case 'container':
      return 'C';
    case 'daemonset':
      return 'DS';
    case 'configmap':
      return 'CM';
    case 'secret':
      return 'S';
    case 'horizontalpodautoscaler':
      return 'HPA';
    case 'serviceaccount':
      return 'SA';
    case 'role':
      return 'R';
    case 'rolebinding':
      return 'RB';
    case 'clusterrole':
      return 'CR';
    case 'clusterrolebinding':
      return 'CRB';
    case 'ingress':
      return 'I';
    default:
      return kind.toUpperCase().slice(0, 2);
  }
}

angular.module('bridge.ui')
.directive('coResourceIcon', function() {
  'use strict';
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
      elem.addClass(`co-m-resource-icon co-m-resource-${kindId}`);
      elem.text(iconLabel(kindId));
    }
  };

});

export default iconLabel;
