import React from 'react';
import Helmet from 'react-helmet';

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

  return <div>
    <Helmet title={k8sResource.kind.labelPlural} />
    <EditRule {...props} />
  </div>;
};
