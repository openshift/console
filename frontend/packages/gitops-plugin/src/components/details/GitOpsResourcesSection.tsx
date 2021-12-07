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
import { HeartBrokenIcon, ExclamationTriangleIcon } from '@patternfly/react-icons';
import {
  global_danger_color_100 as RedColor,
  global_warning_color_100 as YellowColor,
} from '@patternfly/react-tokens';
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

  const renderResource = (
    resources: GitOpsHealthResources[] | GitOpsEnvironmentService[],
    degradedResources: string[] | null,
    nonSyncedResources: string[],
  ) => {
    return (
      <Split hasGutter>
        {degradedResources?.length > 0 && (
          <Tooltip
            content={t('gitops-plugin~{{x}} of {{total}} Unhealthy', {
              x: degradedResources.length.toString(),
              total: resources?.length.toString() ?? '0',
            })}
          >
            <SplitItem>
              <>
                {degradedResources.length}
                &nbsp;
                <HeartBrokenIcon color={RedColor.value} className="co-icon-space-r" />
              </>
            </SplitItem>
          </Tooltip>
        )}
        {nonSyncedResources.length > 0 && (
          <Tooltip
            content={t('gitops-plugin~{{x}} of {{total}} OutOfSync', {
              x: nonSyncedResources.length.toString(),
              total: resources?.length.toString() ?? '0',
            })}
          >
            <SplitItem>
              <>
                {nonSyncedResources.length}
                &nbsp;
                <ExclamationTriangleIcon color={YellowColor.value} className="co-icon-space-r" />
              </>
            </SplitItem>
          </Tooltip>
        )}
        {degradedResources?.length === 0 && nonSyncedResources.length === 0 && <>&nbsp;</>}
      </Split>
    );
  };
  return (
    <>
      <StackItem className="odc-gitops-resources">
        <Card>
          <h3 className="odc-gitops-resources__title co-nowrap">{t('gitops-plugin~Resources')}</h3>
          <CardBody>
            <Split hasGutter>
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
                  {renderResource(deployments, degradedDeployments, nonSyncedDeployments)}
                  {renderResource(secrets, degradedSecrets, nonSyncedSecrets)}
                  {renderResource(services, degradedServices, nonSyncedSyncServices)}
                  {renderResource(routes, degradedRoutes, nonSyncedRoutes)}
                  {renderResource(roleBindings, null, nonSyncedRoleBindings)}
                  {renderResource(clusterRoles, null, nonSyncedClusterRoles)}
                  {renderResource(clusterRoleBindings, null, nonSyncedClusterRoleBindings)}
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
