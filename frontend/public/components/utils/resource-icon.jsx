import * as React from 'react';
import * as classNames from'classnames';
import { k8sKinds } from '../../module/k8s/enum';

export const ResourceIcon = ({kind, className}) => {
  const k = k8sKinds[kind];
  const klass = classNames(`co-m-resource-icon co-m-resource-${kind.toLowerCase()}`, className);
  const iconLabel = k && k.abbr ? k.abbr : kind.toUpperCase().slice(0, 2);
  return <span className={klass}>{iconLabel}</span>;
};

ResourceIcon.displayName = 'ResourceIcon';

export const ResourceName = ({kind, name}) => <span><ResourceIcon kind={kind} /> {name}</span>;
