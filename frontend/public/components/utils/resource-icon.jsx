import React from 'react';
import classNames from 'classnames';
import { idToEnum } from '../../module/k8s/enum';

export const ResourceIcon = ({kind, className}) => {
  const klass = classNames(`co-m-resource-icon co-m-resource-${kind}`, className);
  const k = idToEnum[kind];
  const iconLabel = k && k.abbr ? k.abbr : kind.toUpperCase().slice(0, 2);
  return <span className={klass}>{iconLabel}</span>;
};

export const ResourceName = ({kind, name}) => <span><ResourceIcon kind={_.toLower(kind)} /> {name}</span>;
