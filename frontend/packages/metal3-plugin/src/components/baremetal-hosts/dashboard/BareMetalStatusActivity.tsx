import * as React from 'react';
import { getName, getNamespace } from '@console/shared';
import ActivityItem from '@console/shared/src/components/dashboard/activity-card/ActivityItem';
import { ResourceLink } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { getHostPowerStatus } from '../../../selectors';
import { BareMetalHostModel } from '../../../models';
import { BareMetalHostKind } from '../../../types';

import './status-activity.scss';

const BareMetalStatusActivity: React.FC<BareMetalStatusActivityProps> = ({ resource }) => (
  <ActivityItem>
    {getHostPowerStatus(resource)}{' '}
    <ResourceLink
      inline
      hideIcon
      kind={referenceForModel(BareMetalHostModel)}
      name={getName(resource)}
      namespace={getNamespace(resource)}
      className="bmh-status-activity"
    />
  </ActivityItem>
);

export default BareMetalStatusActivity;

type BareMetalStatusActivityProps = {
  resource: BareMetalHostKind;
};
