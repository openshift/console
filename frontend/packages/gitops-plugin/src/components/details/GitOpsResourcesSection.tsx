import * as React from 'react';
import {
  Stack,
  StackItem,
  Split,
  SplitItem,
  Card,
  CardBody,
  Tooltip,
} from '@patternfly/react-core';
import { HeartBrokenIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { ResourceIcon } from '@console/internal/components/utils';
import { GitOpsEnvironmentService, GitOpsHealthResources } from '../utils/gitops-types';
import './GitOpsResourcesSection.scss';

interface GitOpsResourcesSectionProps {
  services: GitOpsEnvironmentService[];
  secrets: GitOpsHealthResources[];
  deployments: GitOpsHealthResources[];
  routes: GitOpsHealthResources[];
  roleBindings: GitOpsHealthResources[];
  clusterRoles: GitOpsHealthResources[];
  clusterRoleBindings: GitOpsHealthResources[];
}

const getUnhealthyResources = () => (acc: string[], current: GitOpsHealthResources): string[] =>
  current.health === 'Degraded' ||
  current.health === 'Progressing' ||
  current.health === 'Missing' ||
  current.health === 'Unknown'
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
  const degradedRoutes: string[] = routes ? routes.reduce(getNonSyncedResources(), []) : [];
  const degradedRoleBindings: string[] = roleBindings
    ? roleBindings.reduce(getNonSyncedResources(), [])
    : [];
  const degradedClusterRoles: string[] = clusterRoles
    ? clusterRoles.reduce(getNonSyncedResources(), [])
    : [];
  const degradedClusterRoleBindings: string[] = clusterRoleBindings
    ? clusterRoleBindings.reduce(getNonSyncedResources(), [])
    : [];

  const renderResource = (
    resources: GitOpsHealthResources[] | GitOpsEnvironmentService[],
    degradedResources: string[],
  ) => {
    return (
      <Tooltip
        content={t('gitops-plugin~{{x}} of {{total}} degraded', {
          x: degradedResources.length.toString(),
          total: resources ? resources.length.toString() : '0',
        })}
      >
        <StackItem>
          {degradedResources.length > 0 ? (
            <>
              {degradedResources.length}
              <HeartBrokenIcon
                color="#C9190B"
                style={{ marginLeft: 'var(--pf-global--spacer--sm)' }}
              />
            </>
          ) : (
            <>&nbsp;</>
          )}
        </StackItem>
      </Tooltip>
    );
  };
  return (
    <>
      <StackItem className="odc-gitops-resources">
        <Card>
          <h3 className="odc-gitops-resources__title co-nowrap">{t('gitops-plugin~Resources')}</h3>
          <CardBody>
            <Split style={{ justifyContent: 'space-between' }}>
              <span className="odc-gitops-resources__list">
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
                  {renderResource(deployments, degradedDeployments)}
                  {renderResource(secrets, degradedSecrets)}
                  {renderResource(services, degradedServices)}
                  {renderResource(routes, degradedRoutes)}
                  {renderResource(roleBindings, degradedRoleBindings)}
                  {renderResource(clusterRoles, degradedClusterRoles)}
                  {renderResource(clusterRoleBindings, degradedClusterRoleBindings)}
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
