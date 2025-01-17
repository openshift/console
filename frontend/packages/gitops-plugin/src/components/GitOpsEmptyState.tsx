import * as React from 'react';
import { EmptyState, EmptyStateVariant, EmptyStateBody } from '@patternfly/react-core';
import { CubesIcon } from '@patternfly/react-icons/dist/esm/icons/cubes-icon';
import './GitOpsEmptyState.scss';

interface GitOpsEmptyStateProps {
  emptyStateMsg: string;
}

const GitOpsEmptyState: React.FC<GitOpsEmptyStateProps> = ({ emptyStateMsg }) => (
  <EmptyState icon={CubesIcon} variant={EmptyStateVariant.full}>
    <EmptyStateBody>{emptyStateMsg}</EmptyStateBody>
  </EmptyState>
);

export default GitOpsEmptyState;
