/* eslint-disable no-undef */

import * as React from 'react';
import * as _ from 'lodash-es';
import * as classNames from 'classnames';
// eslint-disable-next-line no-unused-vars
import { K8sResourceKind } from '../module/k8s';

const normalizeIconClass = (iconClass) => {
  return _.startsWith(iconClass, 'icon-') ? `font-icon ${iconClass}` : iconClass;
};

export const ClusterServiceClassIcon: React.SFC<ClusterServiceClassIconProps> = ({serviceClass, iconSize}) => {
  const imageUrl = _.get(serviceClass, ['spec', 'externalMetadata', 'imageUrl']);
  const iconClass = _.get(serviceClass, ['spec', 'externalMetadata', 'console.openshift.io/iconClass'], 'fa fa-clone');
  return <span className="co-cluster-service-class-icon">
    { imageUrl
      ? <img className={classNames('co-cluster-service-class-icon__img', iconSize && `co-cluster-service-class-icon__img--${iconSize}`)} src={imageUrl} />
      : <span className={classNames('co-cluster-service-class-icon__icon', iconSize && `co-cluster-service-class-icon__icon--${iconSize}`, normalizeIconClass(iconClass))} /> }
  </span>;
};
ClusterServiceClassIcon.displayName = 'ClusterServiceClassIcon';

export type ClusterServiceClassIconProps = {
  serviceClass: K8sResourceKind,
  iconSize?: string,
};
