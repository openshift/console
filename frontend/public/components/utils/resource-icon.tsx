import * as React from 'react';
import * as classNames from 'classnames';
import * as _ from 'lodash';

import { connectToModel } from '../../kinds';
import { K8sResourceKindReference, K8sKind } from '../../module/k8s';

export const ResourceIcon = connectToModel((props: ResourceIconProps) => {
  const kindObj = props.kindObj;
  const kindStr = _.get(kindObj, ['kind'], '');
  const klass = classNames(`co-m-resource-icon co-m-resource-${kindStr.toLowerCase()}`, props.className);
  const iconLabel = (kindObj && kindObj.abbr) || kindStr.toUpperCase().slice(0, 2);

  return <span className={klass}>{iconLabel}</span>;
});

/* eslint-disable no-undef */
export type ResourceIconProps = {
  className: string;
  kindObj: K8sKind;
};

export type ResourceNameProps = {
  kind: K8sResourceKindReference;
  name: string;
};
/* eslint-enable no-undef */

export const ResourceName: React.SFC<ResourceNameProps> = (props) => <span><ResourceIcon kind={props.kind} /> {props.name}</span>;

ResourceIcon.displayName = 'ResourceIcon';
ResourceName.displayName = 'ResourceName';
