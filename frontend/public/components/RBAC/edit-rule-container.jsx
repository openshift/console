import React from 'react';

import { k8s } from '../../module/k8s';
import { EditRule } from './';

export const EditRuleContainer = ({params}) => {
  const {rule, name, ns} = params;
  const k8sResource = k8s.roles;
  const props = {
    k8sResource,
    rule,
    name,
    namespace: ns
  };

  return <EditRule {...props} />;
};
