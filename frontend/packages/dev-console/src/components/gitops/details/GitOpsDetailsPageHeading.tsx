import * as React from 'react';
import { BreadCrumbs, ResourceIcon } from '@console/internal/components/utils';
import { Split, SplitItem, Label } from '@patternfly/react-core';
import { routeDecoratorIcon } from '../../import/render-utils';
import './GitOpsDetailsPageHeading.scss';

interface GitOpsDetailsPageHeadingProps {
  url: string;
  appName: string;
  manifestURL: string;
  badge?: React.ReactNode;
}

const GitOpsDetailsPageHeading: React.FC<GitOpsDetailsPageHeadingProps> = ({
  url,
  appName,
  manifestURL,
  badge,
}) => {
  const breadcrumbs = [
    {
      name: 'Application Stages',
      path: '/applicationstages',
    },
    {
      name: 'Application Details',
      path: `${url}`,
    },
  ];

  return (
    <div className="odc-gitops-details-page-heading co-m-nav-title co-m-nav-title--breadcrumbs">
      <BreadCrumbs breadcrumbs={breadcrumbs} />
      <h1 className="co-m-pane__heading">
        <div className="co-m-pane__name co-resource-item">
          <ResourceIcon kind="application" className="co-m-resource-icon--lg" />
          <span className="co-resource-item__resource-name">{appName}</span>
        </div>
        {badge && <span className="co-m-pane__heading-badge">{badge}</span>}
      </h1>
      <Split className="odc-gitops-details-page-heading__repo" hasGutter>
        <SplitItem>Manifest File Repo:</SplitItem>
        <SplitItem isFilled>
          <Label
            style={{ fontSize: '12px' }}
            color="blue"
            icon={routeDecoratorIcon(manifestURL, 12)}
          >
            <a
              style={{ color: 'var(--pf-c-label__content--Color)' }}
              href={manifestURL}
              rel="noopener noreferrer"
              target="_blank"
            >
              {manifestURL}
            </a>
          </Label>
        </SplitItem>
      </Split>
    </div>
  );
};

export default GitOpsDetailsPageHeading;
