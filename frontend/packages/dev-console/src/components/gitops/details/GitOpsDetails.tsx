import * as React from 'react';
import * as _ from 'lodash';
import { Stack, StackItem, Card, CardTitle, SplitItem, Split, Label } from '@patternfly/react-core';
import { ResourceIcon } from '@console/internal/components/utils';
import GitOpsServiceDetailsSection from './GitOpsServiceDetailsSection';
import { GitOpsEnvironment } from '../utils/gitops-types';
import GitOpsEnvClusterLink from './GitOpsEnvClusterLink';
import useConsoleURL from '../utils/useConsoleURL';
import './GitOpsDetails.scss';

interface GitOpsDetailsProps {
  envs: GitOpsEnvironment[];
}

const GitOpsDetails: React.FC<GitOpsDetailsProps> = ({ envs }) => {
  const consoleURL = useConsoleURL();
  return (
    <div className="odc-gitops-details">
      {_.map(
        envs,
        (env) =>
          env && (
            <Stack className="odc-gitops-details__env-section" key={env.environment}>
              <StackItem>
                <Card>
                  <CardTitle className="odc-gitops-details__env-section__header">
                    <Stack hasGutter>
                      <StackItem>
                        <Split style={{ alignItems: 'center' }} hasGutter>
                          <SplitItem
                            className="odc-gitops-details__env-section__title co-truncate co-nowrap"
                            isFilled
                          >
                            {env.environment}
                          </SplitItem>
                          <SplitItem>
                            <Label
                              className="odc-gitops-details__env-section__timestamp"
                              color="grey"
                            >
                              <span style={{ color: 'var(--pf-global--palette--black-600)' }}>
                                {env.timestamp}
                              </span>
                            </Label>
                          </SplitItem>
                        </Split>
                      </StackItem>
                      <StackItem className="co-truncate co-nowrap">
                        {env.cluster ? (
                          <GitOpsEnvClusterLink
                            className="odc-gitops-details__env-section__url"
                            consoleURL={consoleURL}
                            url={env.cluster}
                          >
                            {env.cluster}
                          </GitOpsEnvClusterLink>
                        ) : (
                          <div className="odc-gitops-details__env-section__url-empty-state">
                            Cluster URL not available
                          </div>
                        )}
                      </StackItem>
                      <StackItem className="co-truncate co-nowrap">
                        <span className="co-resource-item">
                          <ResourceIcon kind="Project" />
                          {env.cluster ? (
                            <GitOpsEnvClusterLink
                              className="co-resource-item__resource-name"
                              consoleURL={consoleURL}
                              url={env.cluster}
                              path={`/topology/ns/${env.environment}`}
                            >
                              {env.environment}
                            </GitOpsEnvClusterLink>
                          ) : (
                            <span className="co-resource-item__resource-name">
                              {env.environment}
                            </span>
                          )}
                        </span>
                      </StackItem>
                    </Stack>
                  </CardTitle>
                </Card>
              </StackItem>
              <GitOpsServiceDetailsSection services={env.services} />
            </Stack>
          ),
      )}
    </div>
  );
};

export default GitOpsDetails;
