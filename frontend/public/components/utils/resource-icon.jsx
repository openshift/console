import React from 'react';
import classNames from 'classnames';

import {angulars} from '../react-wrapper';
import iconLabel from '../../module/ui/icons/resource-icon';

export const ResourceIcon = ({kind, className}) => {
  const label = kind === '*' ? '*' : iconLabel(angulars.k8s.enum.Kind, kind);
  const klass = classNames(`co-m-resource-icon co-m-resource-icon--${kind}`, className);
  return <span className={klass}>{label}</span>;
};
