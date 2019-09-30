import * as React from 'react';
import { Status } from '@console/shared';

import { K8sResourceKind, serviceCatalogStatus } from '../../module/k8s';

export const StatusWithIcon: React.SFC<StatusWithIconProps> = ({ obj }) => {
  const objStatus: string = serviceCatalogStatus(obj);
  return <Status status={objStatus} />;
};

export type StatusWithIconProps = {
  obj: K8sResourceKind;
};
