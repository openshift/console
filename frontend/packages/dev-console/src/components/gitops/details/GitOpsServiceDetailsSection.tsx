import * as React from 'react';
import * as _ from 'lodash';
import {
  StackItem,
  Card,
  CardTitle,
  CardBody,
  Label,
  Split,
  SplitItem,
} from '@patternfly/react-core';
import { ResourceLink, ExternalLink } from '@console/internal/components/utils';
import { GitOpsEnvironmentService } from '../utils/gitops-types';
import './GitOpsServiceDetailsSection.scss';

interface GitOpsServiceDetailsSectionProps {
  services: GitOpsEnvironmentService[];
}

const GitOpsServiceDetailsSection: React.FC<GitOpsServiceDetailsSectionProps> = ({ services }) => {
  return (
    <>
      {_.map(services, (service) => (
        <StackItem className="odc-gitops-service" key={service.name}>
          <Card>
            <CardTitle className="odc-gitops-service__title co-nowrap">
              {service?.workloadKind ? (
                <ResourceLink kind={service?.workloadKind} name={service.name} linkTo={false} />
              ) : (
                <span className="co-resource-item__resource-name">{service.name}</span>
              )}
            </CardTitle>
            <CardBody>
              <Label className="co-nowrap" style={{ fontSize: '12px' }} color="cyan">
                {service?.image}
              </Label>
              <Split className="odc-gitops-service__details">
                <SplitItem>
                  <div className="odc-gitops-service__pod">{service?.podRing}</div>
                </SplitItem>
                <SplitItem className="odc-gitops-service__pr" isFilled>
                  {service?.commitDetails}
                </SplitItem>
              </Split>
              <ExternalLink
                additionalClassName="odc-gitops-service__url co-truncate co-nowrap"
                href={service?.source?.url}
                text={
                  <>
                    {service?.source?.icon}&nbsp;
                    {service?.source?.url}
                  </>
                }
              />
            </CardBody>
          </Card>
        </StackItem>
      ))}
    </>
  );
};

export default GitOpsServiceDetailsSection;
