import * as React from 'react';
import { ResourceLink } from '@console/internal/components/utils/resource-link';
import { ClusterOperatorModel } from '@console/internal/models';
import { referenceForModel, ClusterOperator } from '@console/internal/module/k8s';
import { OperatorRowProps } from '@console/plugin-sdk';
import Status from '@console/shared/src/components/dashboard/status-card/StatusPopup';

const ClusterOperatorStatusRow: React.FC<OperatorRowProps<ClusterOperator>> = ({
  operatorStatus,
}) => (
  <Status value={operatorStatus.status.title} icon={operatorStatus.status.icon}>
    <ResourceLink
      kind={referenceForModel(ClusterOperatorModel)}
      name={operatorStatus.operators[0].metadata.name}
      hideIcon
      className="co-status-popup__title"
    />
  </Status>
);

export default ClusterOperatorStatusRow;
