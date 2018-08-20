import * as React from 'react';

// eslint-disable-next-line no-unused-vars
import { K8sResourceKind, serviceCatalogStatus } from '../../module/k8s';

export const StatusWithIcon: React.SFC<StatusWithIconProps> = ({obj}) => {
  const objStatus: string = serviceCatalogStatus(obj);

  switch (objStatus) {
    case 'Pending':
      return <span className="status-pending">
        <span className="fa fa-hourglass-half co-status-icon" aria-hidden="true"></span>
        Pending
      </span>;
    case 'Failed':
      return <span className="status-failed">
        <span className="fa fa-times co-status-icon" aria-hidden="true"></span>
        Failed
      </span>;
    case 'Ready':
      return <span className="status-ready">
        <span className="fa fa-check co-status-icon" aria-hidden="true"></span>
        Ready
      </span>;
    default:
      return <span className="status-unknown">-</span>;
  }
};

/* eslint-disable no-undef */
export type StatusWithIconProps = {
  obj: K8sResourceKind
};
/* eslint-enable no-undef */
