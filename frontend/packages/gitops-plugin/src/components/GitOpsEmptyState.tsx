import * as React from 'react';
import {
  EmptyState,
  EmptyStateIcon,
  EmptyStateVariant,
  EmptyStateBody,
} from '@patternfly/react-core';
import { CubesIcon } from '@patternfly/react-icons';
import './GitOpsEmptyState.scss';

interface GitOpsEmptyStateProps {
  emptyStateMsg: string;
}

const GitOpsEmptyState: React.FC<GitOpsEmptyStateProps> = ({ emptyStateMsg }) => (
  <EmptyState variant={EmptyStateVariant.full}>
    <EmptyStateIcon variant="container" component={CubesIcon} />
    <EmptyStateBody>{emptyStateMsg}</EmptyStateBody>
  </EmptyState>
);

export default GitOpsEmptyState;
