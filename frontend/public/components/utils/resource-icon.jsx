import React from 'react';

import {angulars} from '../react-wrapper';
import iconLabel from '../../module/ui/icons/resource-icon';

export const ResourceIcon = ({kind}) => {
  const label = iconLabel(angulars.k8s.enum.Kind, kind);
  const klass = `co-m-resource-icon co-m-resource-icon--${kind}`;

  return <span className={klass}>{label}</span>
};
