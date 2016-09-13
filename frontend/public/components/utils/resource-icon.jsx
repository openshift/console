import React from 'react';

import {angulars} from '../react-wrapper';
import iconLabel from '../../module/ui/icons/resource-icon';

export const ResourceIcon = ({kind, className}) => {
  const label = kind === '*' ? '*' : iconLabel(angulars.k8s.enum.Kind, kind);
  const klass = ['co-m-resource-icon', `co-m-resource-icon--${kind}`, className].join(' ');
  return <span className={klass}>{label}</span>
};
