import * as React from 'react';
import { referenceForModel, ClusterOperator } from '@console/internal/module/k8s';
import { ClusterOperatorModel } from '@console/internal/models';
import { ResourceLink } from '@console/internal/components/utils/resource-link';
import { OperatorRowProps } from '@console/plugin-sdk';
import { OperatorStatusRow } from '@console/shared/src/components/dashboard/status-card/OperatorStatusBody';

import './operator-status.scss';

const ClusterOperatorStatusRow: React.FC<OperatorRowProps<ClusterOperator>> = ({
  operatorStatus,
}) => (
  <OperatorStatusRow title={operatorStatus.status.title} icon={operatorStatus.status.icon}>
    <ResourceLink
      kind={referenceForModel(ClusterOperatorModel)}
      name={operatorStatus.operators[0].metadata.name}
      hideIcon
      className="co-operator-status__title"
    />
  </OperatorStatusRow>
);

export default ClusterOperatorStatusRow;
