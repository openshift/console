import * as React from 'react';
import * as _ from 'lodash-es';

// eslint-disable-next-line no-unused-vars
import { K8sResourceKind } from '../../module/k8s';

const statusCondition = (obj, type) => {
  return _.find(_.get(obj, 'status.conditions'), {type: type});
};

const isStatusReady = obj => {
  return _.get(statusCondition(obj, 'Ready'), 'status') === 'True';
};

const status = obj => {
  const conditions = _.get(obj, 'status.conditions');
  const statusError = _.find(conditions, {type: 'Failed', status: 'True'});

  if (statusError) {
    return 'Failed';
  } else if (isStatusReady(obj)) {
    return 'Ready';
  }

  return 'Pending';
};

export const StatusWithIcon: React.SFC<StatusWithIconProps> = ({obj: obj}) => {
  const objStatus: string = status(obj);

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
