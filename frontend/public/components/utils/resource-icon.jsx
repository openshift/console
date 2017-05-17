import React from 'react';
import classNames from 'classnames';

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
    case 'etcdCluster':
      return 'EC';
    default:
      return kind.toUpperCase().slice(0, 2);
  }
}

export const ResourceIcon = ({kind, className}) => {
  const klass = classNames(`co-m-resource-icon co-m-resource-${kind}`, className);
  return <span className={klass}>{iconLabel(kind)}</span>;
};
