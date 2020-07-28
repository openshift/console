import * as React from 'react';
import * as _ from 'lodash';
import GitOpsListItem from './GitOpsListItem';
import {
  Stack,
  StackItem,
  Split,
  SplitItem,
  EmptyState,
  EmptyStateVariant,
  EmptyStateIcon,
} from '@patternfly/react-core';
import { GitOpsAppGroupData } from '../utils/gitops-types';
import * as gitopsIcon from '../../../images/gitops.svg';
import './GitOpsList.scss';

interface GitOpsListProps {
  appGroups: GitOpsAppGroupData[];
  emptyStateMsg: string;
}

const gitopsImage = () => (
  <img className="odc-gitops-list__empty-state__icon" src={gitopsIcon} alt="GitOps" />
);

const GitOpsList: React.FC<GitOpsListProps> = ({ appGroups, emptyStateMsg }) => (
  <div className="odc-gitops-list">
    {!emptyStateMsg ? (
      <Stack hasGutter>
        <StackItem>
          <Split>
            <SplitItem isFilled />
            <SplitItem>{`${_.size(appGroups)} items`}</SplitItem>
          </Split>
        </StackItem>
        {_.map(appGroups, (appGroup) => (
          <StackItem key={`${appGroup.name}-${appGroup.repo_url}`}>
            <GitOpsListItem appGroup={appGroup} />
          </StackItem>
        ))}
      </Stack>
    ) : (
      <EmptyState variant={EmptyStateVariant.full}>
        <p className="odc-gitops-list__empty-state__msg">{emptyStateMsg}</p>
        <EmptyStateIcon variant="container" component={gitopsImage} />
      </EmptyState>
    )}
  </div>
);

export default GitOpsList;
