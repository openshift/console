import * as React from 'react';
import * as _ from 'lodash';
import { Stack } from '@patternfly/react-core';
import { GitOpsEnvironment } from '../../utils/gitops-types';

interface GitOpsDeploymentHistoryProps {
  customData: {
    envs: GitOpsEnvironment[];
    appName: string;
  };
}

const GitOpsDeploymentHistory: React.FC<GitOpsDeploymentHistoryProps> = ({
  customData: { envs, appName },
}) => {
  return (
    <div className="odc-gitops-details">
      {_.map(
        envs,
        (env) =>
          env && (
            <Stack>
              <div>{appName}</div>
              <div>{envs}</div>
            </Stack>
          ),
      )}
    </div>
  );
};

export default GitOpsDeploymentHistory;
