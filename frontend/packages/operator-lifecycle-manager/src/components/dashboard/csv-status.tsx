import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  resourcePathFromModel,
  resourcePath,
} from '@console/internal/components/utils/resource-link';
import { referenceForModel } from '@console/internal/module/k8s';
import { pluralize } from '@patternfly/react-core';
import { OperatorRowProps } from '@console/plugin-sdk';
import { OperatorStatusRow } from '@console/shared/src/components/dashboard/status-card/OperatorStatusBody';
import { ClusterServiceVersionModel } from '../../models';
import { ClusterServiceVersionKind } from '../../types';

import './csv-status.scss';

const ClusterServiceVersionRow: React.FC<OperatorRowProps<ClusterServiceVersionKind>> = ({
  operatorStatus,
}) => {
  const { name, namespace } = operatorStatus.operators[0].metadata;
  const { displayName } = operatorStatus.operators[0].spec;
  const to =
    operatorStatus.operators.length > 1
      ? `${resourcePathFromModel(ClusterServiceVersionModel)}?name=${name}`
      : resourcePath(referenceForModel(ClusterServiceVersionModel), name, namespace);
  const title = `${pluralize(
    operatorStatus.operators.length,
    'project',
  )} ${operatorStatus.status.title.toLowerCase()}`;
  return (
    <OperatorStatusRow title={title} icon={operatorStatus.status.icon}>
      <Link className="csv-operator-status__title" to={to}>
        {displayName || name}
      </Link>
    </OperatorStatusRow>
  );
};

export default ClusterServiceVersionRow;
