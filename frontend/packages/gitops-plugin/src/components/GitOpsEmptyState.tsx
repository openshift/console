import * as React from 'react';
import {
  EmptyState,
  EmptyStateIcon,
  EmptyStateVariant,
  EmptyStateBody,
  EmptyStateHeader,
} from '@patternfly/react-core';
import { CubesIcon } from '@patternfly/react-icons/dist/esm/icons/cubes-icon';
import './GitOpsEmptyState.scss';

interface GitOpsEmptyStateProps {
  emptyStateMsg: string;
}

const GitOpsEmptyState: React.FC<GitOpsEmptyStateProps> = ({ emptyStateMsg }) => (
  <EmptyState variant={EmptyStateVariant.full}>
    <EmptyStateHeader icon={<EmptyStateIcon icon={CubesIcon} />} />
    <EmptyStateBody>{emptyStateMsg}</EmptyStateBody>
  </EmptyState>
);

export default GitOpsEmptyState;
