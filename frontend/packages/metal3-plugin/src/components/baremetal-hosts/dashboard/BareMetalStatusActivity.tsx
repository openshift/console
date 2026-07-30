import type { FC } from 'react';
import { ResourceLink } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import ActivityItem from '@console/shared/src/components/dashboard/activity-card/ActivityItem';
import { getName, getNamespace } from '@console/shared/src/selectors/common';
import { BareMetalHostModel } from '../../../models';
import { getHostPowerStatus } from '../../../selectors/baremetal-hosts';
import type { BareMetalHostKind } from '../../../types/host';

import './status-activity.scss';

const BareMetalStatusActivity: FC<BareMetalStatusActivityProps> = ({ resource }) => (
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
