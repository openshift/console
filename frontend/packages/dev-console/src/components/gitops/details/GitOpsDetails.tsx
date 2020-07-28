import * as React from 'react';
import * as _ from 'lodash';
import { Stack, StackItem, Card, CardTitle, SplitItem, Split, Label } from '@patternfly/react-core';
import { ResourceLink, ExternalLink } from '@console/internal/components/utils';
import GitOpsServiceDetailsSection from './GitOpsServiceDetailsSection';
import { GitOpsEnvironment } from '../utils/gitops-types';
import './GitOpsDetails.scss';

interface GitOpsDetailsProps {
  envs: GitOpsEnvironment[];
}

const GitOpsDetails: React.FC<GitOpsDetailsProps> = ({ envs }) => {
  return (
    <div className="odc-gitops-details">
      {_.map(envs, (env) => (
        <Stack className="odc-gitops-details__env-section" key={env.environment}>
          <StackItem>
            <Card>
              <CardTitle className="odc-gitops-details__env-section__header">
                <Stack hasGutter>
                  <StackItem>
                    <Split style={{ alignItems: 'center' }}>
                      <SplitItem className="odc-gitops-details__env-section__title" isFilled>
                        {env.environment}
                      </SplitItem>
                      <SplitItem>
                        <Label className="odc-gitops-details__env-section__timestamp" color="grey">
                          <span style={{ color: 'var(--pf-global--palette--black-600)' }}>
                            {env?.timestamp}
                          </span>
                        </Label>
                      </SplitItem>
                    </Split>
                  </StackItem>
                  <StackItem className="co-truncate co-nowrap">
                    <ExternalLink
                      additionalClassName="odc-gitops-details__env-section__url"
                      href={env?.cluster}
                      text={env?.cluster}
                    />
                  </StackItem>
                  <StackItem>
                    <ResourceLink kind="Project" name={env.environment} />
                  </StackItem>
                </Stack>
              </CardTitle>
            </Card>
          </StackItem>
          <GitOpsServiceDetailsSection services={env?.services} />
        </Stack>
      ))}
    </div>
  );
};

export default GitOpsDetails;
