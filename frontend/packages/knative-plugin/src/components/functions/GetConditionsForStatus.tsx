import * as React from 'react';
import * as _ from 'lodash';
import { K8sResourceCondition } from '@console/internal/module/k8s';
import { GreenCheckCircleIcon, RedExclamationCircleIcon } from '@console/shared/';
import { getConditionOKCount } from '../../utils/condition-utils';

export type GetConditionsForStatusProps = {
  conditions: K8sResourceCondition[];
};

const GetConditionsForStatus: React.FC<GetConditionsForStatusProps> = ({ conditions }) => {
  const successCount = getConditionOKCount(conditions);
  const failureCount = _.size(conditions) - successCount;
  return (
    <div>
      <span>
        {' '}
        <GreenCheckCircleIcon /> {successCount} &nbsp;|&nbsp; <RedExclamationCircleIcon />{' '}
        {failureCount}
      </span>
    </div>
  );
};

export default GetConditionsForStatus;
