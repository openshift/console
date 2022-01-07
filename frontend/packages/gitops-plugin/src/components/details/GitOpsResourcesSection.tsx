import * as React from 'react';
import { Stack, StackItem, Split, SplitItem, Card, CardBody } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { ResourceIcon } from '@console/internal/components/utils';
import { GitOpsEnvironmentService, GitOpsHealthResources } from '../utils/gitops-types';
import './GitOpsResourcesSection.scss';
import GitOpsResourceRow from './GitOpsResourceRow';

interface GitOpsResourcesSectionProps {
  services: GitOpsEnvironmentService[];
  secrets: GitOpsHealthResources[];
  deployments: GitOpsHealthResources[];
  routes: GitOpsHealthResources[];
  roleBindings: GitOpsHealthResources[];
  clusterRoles: GitOpsHealthResources[];
  clusterRoleBindings: GitOpsHealthResources[];
}

export enum HealthStatus {
  DEGRADED = 'Degraded',
  PROGRESSING = 'Progressing',
  MISSING = 'Missing',
  UNKNOWN = 'Unknown',
}

const getUnhealthyResources = () => (acc: string[], current: GitOpsHealthResources): string[] =>
  current.health === HealthStatus.DEGRADED ||
  current.health === HealthStatus.PROGRESSING ||
  current.health === HealthStatus.MISSING ||
  current.health === HealthStatus.UNKNOWN
    ? [...acc, current.health]
    : acc;

const getNonSyncedResources = () => (acc: string[], current: GitOpsHealthResources): string[] =>
  current.status !== 'Synced' ? [...acc, current.status] : acc;

const GitOpsResourcesSection: React.FC<GitOpsResourcesSectionProps> = ({
  services,
  secrets,
  deployments,
  routes,
  roleBindings,
  clusterRoles,
  clusterRoleBindings,
}) => {
  const { t } = useTranslation();
  const degradedServices: string[] = services ? services.reduce(getUnhealthyResources(), []) : [];
  const degradedDeployments: string[] = deployments
    ? deployments.reduce(getUnhealthyResources(), [])
    : [];
  const degradedSecrets: string[] = secrets ? secrets.reduce(getUnhealthyResources(), []) : [];
  const degradedRoutes: string[] = routes ? routes.reduce(getUnhealthyResources(), []) : [];

  const nonSyncedSyncServices: string[] = services
    ? services.reduce(getNonSyncedResources(), [])
    : [];
  const nonSyncedDeployments: string[] = deployments
    ? deployments.reduce(getNonSyncedResources(), [])
    : [];
  const nonSyncedSecrets: string[] = secrets ? secrets.reduce(getNonSyncedResources(), []) : [];
  const nonSyncedRoutes: string[] = routes ? routes.reduce(getNonSyncedResources(), []) : [];
  const nonSyncedRoleBindings: string[] = roleBindings
    ? roleBindings.reduce(getNonSyncedResources(), [])
    : [];
  const nonSyncedClusterRoles: string[] = clusterRoles
    ? clusterRoles.reduce(getNonSyncedResources(), [])
    : [];
  const nonSyncedClusterRoleBindings: string[] = clusterRoleBindings
    ? clusterRoleBindings.reduce(getNonSyncedResources(), [])
    : [];

  return (
    <>
      <StackItem className="gop-gitops-resources">
        <Card>
          <h3 className="gop-gitops-resources__title co-nowrap">{t('gitops-plugin~Resources')}</h3>
          <CardBody>
            <Split hasGutter>
              <span className="gop-gitops-resources__list">
                <SplitItem>
                  <Stack style={{ marginRight: 'var(--pf-global--spacer--sm)' }}>
                    <StackItem>{deployments ? deployments.length : 'N/A'}</StackItem>
                    <StackItem>{secrets ? secrets.length : 'N/A'}</StackItem>
                    <StackItem>{services ? services.length : 'N/A'}</StackItem>
                    <StackItem>{routes ? routes.length : 'N/A'}</StackItem>
                    <StackItem>{roleBindings ? roleBindings.length : 'N/A'}</StackItem>
                    <StackItem>{clusterRoles ? clusterRoles.length : 'N/A'}</StackItem>
                    <StackItem>
                      {clusterRoleBindings ? clusterRoleBindings.length : 'N/A'}
                    </StackItem>
                  </Stack>
                </SplitItem>
                <SplitItem>
                  <Stack style={{ marginRight: 'var(--pf-global--spacer--sm)' }}>
                    <StackItem>
                      <ResourceIcon kind="Deployment" /> {t('gitops-plugin~Deployments')}
                    </StackItem>
                    <StackItem>
                      <ResourceIcon kind="Secret" /> {t('gitops-plugin~Secrets')}
                    </StackItem>
                    <StackItem>
                      <ResourceIcon kind="Service" /> {t('gitops-plugin~Services')}
                    </StackItem>
                    <StackItem>
                      <ResourceIcon kind="Route" /> {t('gitops-plugin~Routes')}
                    </StackItem>
                    <StackItem>
                      <ResourceIcon kind="RoleBinding" /> {t('gitops-plugin~Role Bindings')}
                    </StackItem>
                    <StackItem>
                      <ResourceIcon kind="ClusterRole" /> {t('gitops-plugin~Cluster Roles')}
                    </StackItem>
                    <StackItem>
                      <ResourceIcon kind="ClusterRoleBinding" />{' '}
                      {t('gitops-plugin~Cluster Role Bindings')}
                    </StackItem>
                  </Stack>
                </SplitItem>
              </span>
              <SplitItem>
                <Stack style={{ alignItems: 'flex-end' }}>
                  <GitOpsResourceRow
                    resources={deployments}
                    degradedResources={degradedDeployments}
                    nonSyncedResources={nonSyncedDeployments}
                  />
                  <GitOpsResourceRow
                    resources={secrets}
                    degradedResources={degradedSecrets}
                    nonSyncedResources={nonSyncedSecrets}
                  />
                  <GitOpsResourceRow
                    resources={services}
                    degradedResources={degradedServices}
                    nonSyncedResources={nonSyncedSyncServices}
                  />
                  <GitOpsResourceRow
                    resources={routes}
                    degradedResources={degradedRoutes}
                    nonSyncedResources={nonSyncedRoutes}
                  />
                  <GitOpsResourceRow
                    resources={roleBindings}
                    degradedResources={null}
                    nonSyncedResources={nonSyncedRoleBindings}
                  />
                  <GitOpsResourceRow
                    resources={clusterRoles}
                    degradedResources={null}
                    nonSyncedResources={nonSyncedClusterRoles}
                  />
                  <GitOpsResourceRow
                    resources={clusterRoleBindings}
                    degradedResources={null}
                    nonSyncedResources={nonSyncedClusterRoleBindings}
                  />
                </Stack>
              </SplitItem>
            </Split>
          </CardBody>
        </Card>
      </StackItem>
    </>
  );
};

export default GitOpsResourcesSection;
