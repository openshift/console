import * as React from 'react';

// eslint-disable-next-line no-unused-vars
import { K8sResourceKind, serviceCatalogStatus } from '../../module/k8s';
import { StatusIcon } from '../utils';

export const StatusWithIcon: React.SFC<StatusWithIconProps> = ({obj}) => {
  const objStatus: string = serviceCatalogStatus(obj);
  return <StatusIcon status={objStatus} />;
};

/* eslint-disable no-undef */
export type StatusWithIconProps = {
  obj: K8sResourceKind
};
/* eslint-enable no-undef */
