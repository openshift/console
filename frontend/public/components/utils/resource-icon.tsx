/* eslint-disable no-undef */

import * as React from 'react';
import * as classNames from 'classnames';

import { connectToKinds, K8sFullyQualifiedResourceReference, getKindForResourceReference, K8sKind } from '../../kinds';

export const ResourceIcon = connectToKinds()(function ResourceIcon (props: ResourceIconProps) {
  const kindString = getKindForResourceReference(props.kind);
  const klass = classNames(`co-m-resource-icon co-m-resource-${kindString.toLowerCase()}`, props.className);
  const iconLabel = props.kindObj.abbr || kindString.toUpperCase().slice(0, 2);
  return <span className={klass}>{iconLabel}</span>;
});

ResourceIcon.displayName = 'ResourceIcon';

export type ResourceIconProps = {
  kind: K8sFullyQualifiedResourceReference;
  className: string;
  kindObj: K8sKind;
};

export const ResourceName = (props: ResourceNameProps) => <span><ResourceIcon kind={props.kind} /> {props.name}</span>;

export type ResourceNameProps = {
  kind: K8sFullyQualifiedResourceReference;
  name: string;
};
