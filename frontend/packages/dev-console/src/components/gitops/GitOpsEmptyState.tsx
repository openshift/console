import * as React from 'react';
import {
  EmptyState,
  EmptyStateIcon,
  EmptyStateVariant,
  EmptyStateBody,
} from '@patternfly/react-core';
import * as gitopsIcon from '../../images/gitops.svg';
import './GitOpsEmptyState.scss';

interface GitOpsEmptyStateProps {
  emptyStateMsg: string;
}

const gitopsImage = () => (
  <img className="odc-gitops-empty-state__icon" src={gitopsIcon} alt="GitOps" />
);

const GitOpsEmptyState: React.FC<GitOpsEmptyStateProps> = ({ emptyStateMsg }) => (
  <EmptyState variant={EmptyStateVariant.full}>
    <EmptyStateIcon variant="container" component={gitopsImage} />
    <EmptyStateBody>{emptyStateMsg}</EmptyStateBody>
  </EmptyState>
);

export default GitOpsEmptyState;
