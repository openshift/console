import * as React from 'react';
import * as _ from 'lodash';
import ActivityItem from '@console/shared/src/components/dashboard/activity-card/ActivityItem';
import { referenceForModel } from '@console/internal/module/k8s';
import { getName, getNamespace } from '@console/shared/src/selectors/common';
import { ResourceLink } from '@console/internal/components/utils/resource-link';
import { ClusterServiceVersionModel } from '../../models';
import { ClusterServiceVersionKind } from '../../types';

import './csv-activity.scss';

const ClusterServiceVersionUpgradeActivity: React.FC<ClusterServiceVersionUpgradeActivityProps> = ({
  resource,
}) => (
  <>
    <ActivityItem>Upgrading</ActivityItem>
    <ResourceLink
      kind={referenceForModel(ClusterServiceVersionModel)}
      name={getName(resource)}
      namespace={getNamespace(resource)}
      displayName={_.get(resource, 'spec.displayName')}
      className="olm-csv-activity__upgrade"
    />
  </>
);

export default ClusterServiceVersionUpgradeActivity;

type ClusterServiceVersionUpgradeActivityProps = {
  resource: ClusterServiceVersionKind;
};
