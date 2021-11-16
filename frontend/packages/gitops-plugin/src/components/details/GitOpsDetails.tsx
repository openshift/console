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
import { ExternalLink, Timestamp } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { ConsoleLinkModel } from '@console/internal/models';
import { K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import {
  GreenCheckCircleIcon,
  YellowExclamationTriangleIcon,
  GrayUnknownIcon,
} from '@console/shared';
import * as argoIcon from '../../images/argo.png';
import { GitOpsEnvironment } from '../utils/gitops-types';
import GitOpsResourcesSection from './GitOpsResourcesSection';
import './GitOpsDetails.scss';

interface GitOpsDetailsProps {
  envs: GitOpsEnvironment[];
  appName: string;
}

const GitOpsDetails: React.FC<GitOpsDetailsProps> = ({ envs, appName }) => {
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

  const ref = React.useRef(null);
  const [windowWidth, setWindowWidth] = React.useState(0);
  const resizeWindow = () => {
    setWindowWidth(window.innerWidth);
  };
  React.useEffect(() => {
    if (ref.current) {
      document
        .getElementById('odc-gitops-details-card-container')
        .style.setProperty(
          '--cardRepeatingLenthPerRow',
          `${Math.floor((ref.current.offsetWidth - 64) / 365)}`,
        );
    }
    window.addEventListener('resize', resizeWindow);
    return () => window.removeEventListener('resize', resizeWindow);
  }, [windowWidth]);

  // eslint-disable-next-line no-shadow
  const renderStatusLabel = (status: string) => {
    switch (status) {
      case 'Synced':
        return (
          <Label icon={<GreenCheckCircleIcon />} isTruncated>
            Synced
          </Label>
        );
      case 'OutOfSync':
        return (
          <Label icon={<YellowExclamationTriangleIcon />} isTruncated>
            OutOfSync
          </Label>
        );
      case 'Unknown':
        return (
          <Label icon={<GrayUnknownIcon />} isTruncated>
            Unknown
          </Label>
        );
      default:
        return '';
    }
  };

  let oldAPI = false;
  if (envs && envs.length > 0) {
    oldAPI = envs[0] && envs[0].deployments ? envs[0].deployments === null : true;
  }

  return (
    <div className="odc-gitops-details" id="odc-gitops-details-card-container" ref={ref}>
      {oldAPI && (
        <>
          <Alert
            isInline
            title={t('gitops-plugin~Compatibility Issue')}
            className="odc-gitops-details__operator-upgrade-alert"
          >
            {t('gitops-plugin~Compatibility Issue Message')}
          </Alert>
        </>
      )}
      {_.map(
        envs,
        (env) =>
          env && (
            <Stack className="odc-gitops-details__env-section" key={env.environment}>
              <StackItem>
                <Card>
                  <CardTitle className="odc-gitops-details__env-section__header">
                    <Stack>
                      <StackItem>
                        <h2 className="co-section-heading co-truncate co-nowrap odc-gitops-details__env-section__app-name">
                          <Tooltip content={env.environment}>
                            <span>{env.environment}</span>
                          </Tooltip>
                        </h2>
                      </StackItem>
                      <StackItem className="co-truncate co-nowrap">
                        {env.cluster ? (
                          <ExternalLink
                            additionalClassName="odc-gitops-details__env-section__cluster-url"
                            href={env.cluster}
                          >
                            {env.cluster}
                          </ExternalLink>
                        ) : (
                          <div className="odc-gitops-details__env-section__cluster-url-empty-state">
                            {t('gitops-plugin~Cluster URL not available')}
                          </div>
                        )}
                      </StackItem>
                      {env.status && (
                        <StackItem className="odc-gitops-details__env-section__status-label">
                          <Tooltip content="Sync status">
                            <span>{renderStatusLabel(env.status)}</span>
                          </Tooltip>
                        </StackItem>
                      )}
                    </Stack>
                  </CardTitle>
                  <CardBody>
                    <Stack className="odc-gitops-details__revision">
                      {env.revision ? (
                        <>
                          {env.revision.message && (
                            <StackItem className="odc-gitops-details__message">
                              {t('gitops-plugin~{{message}}', { message: env.revision.message })}
                            </StackItem>
                          )}
                          <StackItem className="odc-gitops-details__author-sha">
                            {env.revision.author && (
                              <span className="odc-gitops-details__author">
                                {t('gitops-plugin~by {{author}}', { author: env.revision.author })}{' '}
                              </span>
                            )}
                            {env.revision.revision && (
                              <Label
                                className="odc-gitops-details__sha"
                                color="blue"
                                icon={<GitAltIcon />}
                                variant="outline"
                              >
                                {env.revision.revision.substring(0, 7)}
                              </Label>
                            )}
                          </StackItem>
                        </>
                      ) : (
                        <span>{t('gitops-plugin~Commit details not available')}</span>
                      )}
                      {env.lastDeployed && (
                        <StackItem className="co-truncate co-nowrap odc-gitops-details__env-section__time">
                          {t('gitops-plugin~Last deployed')}&nbsp;
                          <Timestamp timestamp={env.lastDeployed} />
                        </StackItem>
                      )}
                      {argocdLink && (
                        <StackItem>
                          <Split className="odc-gitops-details__env-section__deployment-history">
                            <Tooltip content="Argo CD">
                              <SplitItem className="odc-gitops-details__env-section__deployment-history__argocd-link">
                                <ExternalLink
                                  href={`${argocdLink.spec.href}/applications/${env.environment}-${appName}`}
                                >
                                  <span className="odc-gitops-details__env-section__argo-external-link">
                                    <img
                                      loading="lazy"
                                      src={argoIcon}
                                      alt="Argo CD"
                                      width="19px"
                                      height="24px"
                                    />
                                  </span>
                                </ExternalLink>
                              </SplitItem>
                            </Tooltip>
                          </Split>
                        </StackItem>
                      )}
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
