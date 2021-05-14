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
} from '@patternfly/react-core';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ExternalLink } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { ConsoleLinkModel } from '@console/internal/models';
import { K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import {
  GreenCheckCircleIcon,
  YellowExclamationTriangleIcon,
  GrayUnknownIcon,
} from '@console/shared';
import { GitOpsEnvironment } from '../utils/gitops-types';
import GitOpsDeploymentSuccessSection from './GitOpsDeploymentSuccessSection';
import GitOpsResourcesSection from './GitOpsResourcesSection';
import GitOpsServiceDetailsSection from './GitOpsServiceDetailsSection';
import './GitOpsDetails.scss';

interface GitOpsDetailsProps {
  customData: {
    envs: GitOpsEnvironment[];
    appName: string;
  };
}

const GitOpsDetails: React.FC<GitOpsDetailsProps> = ({ customData: { envs, appName } }) => {
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

  type Status = 'Synced' | 'OutOfSync' | 'Unknown';

  const status = 'Unknown';
  // eslint-disable-next-line no-shadow
  const renderStatusLabel = (status: Status) => {
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
                      <StackItem className="odc-gitops-details__env-section__status-label">
                        <Tooltip content="Sync status">
                          <span>{renderStatusLabel(status)}</span>
                        </Tooltip>
                      </StackItem>
                    </Stack>
                  </CardTitle>
                  <CardBody>
                    <Stack>
                      <StackItem>
                        <GitOpsServiceDetailsSection services={env.services} />
                      </StackItem>
                      <StackItem className="co-truncate co-nowrap odc-gitops-details__env-section__time">
                        {t('gitops-plugin~Last deployed')}&nbsp;{env.timestamp}
                      </StackItem>
                      <StackItem>
                        <Split className="odc-gitops-details__env-section__deployment-history">
                          <SplitItem className="odc-gitops-details__env-section__deployment-history__page-link">
                            <Link
                              // replace with Deployment history tab link for this env
                              to="https://www.google.com"
                              style={{ fontSize: '14px' }}
                            >
                              {t('gitops-plugin~Deployment history')}
                            </Link>
                          </SplitItem>
                          <Tooltip content="Argo CD">
                            <SplitItem className="odc-gitops-details__env-section__deployment-history__argocd-link">
                              <ExternalLink
                                href={`${argocdLink.spec.href}/applications/${env.environment}-${appName}`}
                              >
                                <span style={{ marginRight: 'var(--pf-global--spacer--xs)' }}>
                                  <img
                                    loading="lazy"
                                    src="/api/kubernetes/apis/packages.operators.coreos.com/v1/namespaces/openshift-marketplace/packagemanifests/argocd-operator/icon?resourceVersion=argocd-operator.alpha.argocd-operator.v0.0.14"
                                    alt=""
                                    width="19px"
                                    height="24px"
                                  />
                                </span>
                              </ExternalLink>
                            </SplitItem>
                          </Tooltip>
                        </Split>
                      </StackItem>
                    </Stack>
                  </CardBody>
                </Card>
              </StackItem>
              <GitOpsDeploymentSuccessSection />
              <GitOpsResourcesSection services={env.services} />
            </Stack>
          ),
      )}
    </div>
  );
};

export default GitOpsDetails;
