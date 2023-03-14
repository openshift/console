import * as React from 'react';
import {
  Stack,
  StackItem,
  Split,
  SplitItem,
  Tooltip,
  Card,
  CardTitle,
  CardBody,
  Label,
  Alert,
} from '@patternfly/react-core';
import { GitAltIcon } from '@patternfly/react-icons';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ExternalLink, Timestamp } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { ConsoleLinkModel } from '@console/internal/models';
import { K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import { GitOpsEnvironment } from '../utils/gitops-types';
import ArgoCdLink from './ArgoCdLink';
import GitOpsRenderStatusLabel from './GitOpsRenderStatusLabel';
import GitOpsResourcesSection from './GitOpsResourcesSection';
import './GitOpsDetails.scss';

interface GitOpsDetailsProps {
  envs: GitOpsEnvironment[];
  appName: string;
  manifestURL: string;
  error: Error;
}

const GitOpsDetails: React.FC<GitOpsDetailsProps> = ({ envs, appName, manifestURL, error }) => {
  const { t } = useTranslation();
  const [consoleLinks] = useK8sWatchResource<K8sResourceKind[]>({
    isList: true,
    kind: referenceForModel(ConsoleLinkModel),
    optional: true,
  });
  const argocdLink = _.find(
    consoleLinks,
    (link: K8sResourceKind) =>
      link.metadata?.name === 'argocd' && link.spec?.location === 'ApplicationMenu',
  );

  let oldAPI = false;
  if (envs && envs.length > 0) {
    oldAPI = envs[0] && envs[0].deployments ? envs[0].deployments === null : true;
  }
  let errMsg = '';
  if (error != null) {
    errMsg = t('gitops-plugin~Error cannot retrieve environments');
  }
  return (
    <div className="gop-gitops-details">
      {oldAPI && (
        <Alert
          isInline
          title={t('gitops-plugin~Compatibility Issue')}
          className="gop-gitops-details__special-message-alert"
        >
          {t('gitops-plugin~Compatibility Issue Message')}
        </Alert>
      )}
      {error != null && (
        <Alert
          isInline
          title={t('gitops-plugin~Error Encountered')}
          className="gop-gitops-details__special-message-alert"
        >
          {errMsg}
        </Alert>
      )}
      {_.map(
        envs,
        (env) =>
          env && (
            <Stack className="gop-gitops-details__env-section" key={env.environment}>
              <StackItem>
                <Card>
                  <CardTitle className="gop-gitops-details__env-section__header">
                    <Stack>
                      <StackItem>
                        <h2 className="co-section-heading co-truncate co-nowrap gop-gitops-details__env-section__app-name">
                          <Tooltip content={env.environment}>
                            <span>{env.environment}</span>
                          </Tooltip>
                        </h2>
                      </StackItem>
                      <StackItem className="co-truncate co-nowrap">
                        {env.cluster ? (
                          <ExternalLink
                            additionalClassName="gop-gitops-details__env-section__cluster-url"
                            href={env.cluster}
                          >
                            {env.cluster}
                          </ExternalLink>
                        ) : (
                          <div className="gop-gitops-details__env-section__cluster-url-empty-state">
                            {t('gitops-plugin~Cluster URL not available')}
                          </div>
                        )}
                      </StackItem>
                      {env.status && (
                        <StackItem className="gop-gitops-details__env-section__status-label">
                          <Tooltip content="Sync status">
                            <GitOpsRenderStatusLabel status={env.status} />
                          </Tooltip>
                        </StackItem>
                      )}
                    </Stack>
                  </CardTitle>
                  <CardBody>
                    <Stack className="gop-gitops-details__revision">
                      {env.revision ? (
                        <>
                          {env.revision.message ? (
                            <StackItem className="gop-gitops-details__message">
                              {t('gitops-plugin~{{message}}', { message: env.revision.message })}
                            </StackItem>
                          ) : (
                            <StackItem className="gop-gitops-details__warning-message">
                              {t('gitops-plugin~Commit message not available')}
                            </StackItem>
                          )}
                          <StackItem className="gop-gitops-details__author-sha">
                            {env.revision.author ? (
                              <span className="gop-gitops-details__author">
                                {t('gitops-plugin~by {{author}}', { author: env.revision.author })}{' '}
                              </span>
                            ) : (
                              <span className="gop-gitops-details__author-unavailable">
                                {t('gitops-plugin~Commit author not available')}{' '}
                              </span>
                            )}
                            {env.revision.revision ? (
                              <Label
                                className="gop-gitops-details__sha"
                                color="blue"
                                icon={<GitAltIcon />}
                                variant="outline"
                              >
                                {env.revision.revision.substring(0, 7)}
                              </Label>
                            ) : (
                              <Label
                                className="gop-gitops-details__sha"
                                color="blue"
                                icon={<GitAltIcon />}
                                variant="outline"
                              >
                                N/A
                              </Label>
                            )}
                          </StackItem>
                        </>
                      ) : (
                        <span>{t('gitops-plugin~Commit details not available')}</span>
                      )}
                      {env.lastDeployed ? (
                        <StackItem className="co-truncate co-nowrap gop-gitops-details__env-section__time">
                          {t('gitops-plugin~Last deployed')}&nbsp;
                          <Timestamp timestamp={env.lastDeployed} />
                        </StackItem>
                      ) : (
                        <StackItem className="co-truncate co-nowrap gop-gitops-details__env-section__time-unavailable">
                          {t('gitops-plugin~Last deployed time not available')}
                        </StackItem>
                      )}
                      <StackItem>
                        <Split className="gop-gitops-details__env-section__deployment-history">
                          <SplitItem className="gop-gitops-details__env-section__deployment-history__deploymentHistoryPageLink">
                            <Link
                              to={`/environments/${appName}/deploymenthistory?url=${manifestURL}&rowFilter-environment=${env.environment}`}
                              title={t('gitops-plugin~Deployment history')}
                            >
                              {t('gitops-plugin~Deployment history')}
                            </Link>
                          </SplitItem>
                          {argocdLink && (
                            <Tooltip content="Argo CD">
                              <ArgoCdLink
                                appName={appName}
                                envName={env.environment}
                                argocdLink={argocdLink}
                              />
                            </Tooltip>
                          )}
                        </Split>
                      </StackItem>
                    </Stack>
                  </CardBody>
                </Card>
              </StackItem>
              <GitOpsResourcesSection
                services={env.services}
                secrets={env.secrets}
                deployments={env.deployments}
                routes={env.routes}
                roleBindings={env.roleBindings}
                clusterRoles={env.clusterRoles}
                clusterRoleBindings={env.clusterRoleBindings}
              />
            </Stack>
          ),
      )}
    </div>
  );
};

export default GitOpsDetails;
