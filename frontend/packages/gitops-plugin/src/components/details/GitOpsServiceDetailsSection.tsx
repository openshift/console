import * as React from 'react';
import {
  StackItem,
  Card,
  CardTitle,
  CardBody,
  Label,
  Split,
  SplitItem,
} from '@patternfly/react-core';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { ResourceLink, ExternalLink } from '@console/internal/components/utils';
import { GitOpsEnvironmentService } from '../utils/gitops-types';
import './GitOpsServiceDetailsSection.scss';

interface GitOpsServiceDetailsSectionProps {
  services: GitOpsEnvironmentService[];
}

const GitOpsServiceDetailsSection: React.FC<GitOpsServiceDetailsSectionProps> = ({ services }) => {
  const { t } = useTranslation();
  return (
    <>
      {_.map(
        services,
        (service) =>
          service && (
            <StackItem className="odc-gitops-service" key={service.name}>
              <Card>
                <CardTitle className="odc-gitops-service__title co-nowrap">
                  {service.workloadKind ? (
                    <ResourceLink kind={service.workloadKind} linkTo={false}>
                      <Label className="odc-gitops-service__title__label" isTruncated>
                        {service.name}
                      </Label>
                    </ResourceLink>
                  ) : (
                    <Label className="odc-gitops-service__title__name" isTruncated>
                      <span className="co-resource-item__resource-name">{service.name}</span>
                    </Label>
                  )}
                </CardTitle>
                <CardBody>
                  <Label className="co-nowrap odc-gitops-service__image" color="cyan" isTruncated>
                    {service.image || <div>{t('gitops-plugin~Image not available')}</div>}
                  </Label>
                  <Split className="odc-gitops-service__details">
                    <SplitItem>
                      <div className="odc-gitops-service__pod">{service.podRing}</div>
                    </SplitItem>
                    <SplitItem className="odc-gitops-service__pr" isFilled>
                      {service.commitDetails}
                    </SplitItem>
                  </Split>
                  {service.source?.url ? (
                    <ExternalLink
                      additionalClassName="odc-gitops-service__url co-truncate co-nowrap"
                      href={service.source?.url}
                    >
                      <>
                        {service.source?.icon}&nbsp;
                        <Label className="odc-gitops-service__url-label" isTruncated>
                          {service.source?.url}
                        </Label>
                      </>
                    </ExternalLink>
                  ) : (
                    <div className="odc-gitops-service__details">
                      {t('gitops-plugin~Service source URL not available')}
                    </div>
                  )}
                </CardBody>
              </Card>
            </StackItem>
          ),
      )}
    </>
  );
};

export default GitOpsServiceDetailsSection;
