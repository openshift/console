import * as React from 'react';
import { getName, getNamespace } from '@console/dynamic-plugin-sdk';
import ActivityItem from '@console/dynamic-plugin-sdk/src/shared/components/dashboard/activity-card/ActivityItem';
import { ResourceLink } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { BareMetalHostModel } from '../../../models';
import { getHostPowerStatus } from '../../../selectors';
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
