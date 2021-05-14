import * as React from 'react';
import { Stack, StackItem } from '@patternfly/react-core';
import * as _ from 'lodash';
import { GitOpsEnvironmentService } from '../utils/gitops-types';

interface GitOpsServiceDetailsSectionProps {
  services: GitOpsEnvironmentService[];
}

const GitOpsServiceDetailsSection: React.FC<GitOpsServiceDetailsSectionProps> = ({ services }) => {
  return (
    <>
      {_.map(
        services,
        (service) =>
          service && (
            <Stack>
              <StackItem key={service.name}>{service.commitDetails}</StackItem>
            </Stack>
          ),
      )}
    </>
  );
};

export default GitOpsServiceDetailsSection;
