import * as React from 'react';
import { Stack, StackItem, Card, CardTitle, CardBody, Label } from '@patternfly/react-core';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { ExternalLink, ResourceIcon } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { ConsoleLinkModel } from '@console/internal/models';
import { K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import { GitOpsEnvironment } from '../utils/gitops-types';
import GitOpsServiceDetailsSection from './GitOpsServiceDetailsSection';
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
                      <StackItem className="co-truncate co-nowrap odc-gitops-details__env-section__title">
                        <Label className="odc-gitops-details__env-section__env" isTruncated>
                          {env.environment}
                        </Label>
                      </StackItem>
                      <StackItem className="co-truncate co-nowrap odc-gitops-details__env-section__time">
                        <Label className="odc-gitops-details__env-section__timestamp" color="grey">
                          <span style={{ color: 'var(--pf-global--palette--black-600)' }}>
                            {env.timestamp}
                          </span>
                        </Label>
                      </StackItem>
                    </Stack>
                  </CardTitle>
                  <CardBody>
                    <Stack>
                      <StackItem className="co-truncate co-nowrap">
                        {env.cluster ? (
                          <ExternalLink
                            additionalClassName="odc-gitops-details__env-section__url"
                            href={env.cluster}
                          >
                            <Label
                              className="odc-gitops-details__env-section__url-label"
                              isTruncated
                            >
                              {env.cluster}
                            </Label>
                          </ExternalLink>
                        ) : (
                          <div className="odc-gitops-details__env-section__url-empty-state">
                            {t('gitops-plugin~Cluster URL not available')}
                          </div>
                        )}
                      </StackItem>
                      <StackItem className="co-truncate co-nowrap">
                        <span className="co-resource-item odc-gitops-details__env-section__co-resource-item">
                          <ResourceIcon kind="Project" />
                          <Label className="co-resource-item__resource-name" isTruncated>
                            {env.environment}
                          </Label>
                        </span>
                      </StackItem>
                      {env.environment && argocdLink && (
                        <StackItem className="co-truncate co-nowrap">
                          <ExternalLink
                            href={`${argocdLink.spec.href}/applications/${env.environment}-${appName}`}
                            text="Argo CD"
                            additionalClassName="odc-gitops-details__env-section__argocd-link"
                          />
                        </StackItem>
                      )}
                    </Stack>
                  </CardBody>
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
