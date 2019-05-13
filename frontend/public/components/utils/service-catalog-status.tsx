import * as React from 'react';

import { K8sResourceKind, serviceCatalogStatus } from '../../module/k8s';
import { StatusIconAndText } from '../utils';

export const StatusWithIcon: React.SFC<StatusWithIconProps> = ({obj}) => {
  const objStatus: string = serviceCatalogStatus(obj);
  return <StatusIconAndText status={objStatus} />;
};

export type StatusWithIconProps = {
  obj: K8sResourceKind
};
