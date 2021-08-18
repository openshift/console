import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { routeDecoratorIcon } from '@console/dev-console/src/components/import/render-utils';
import { BreadCrumbs, ExternalLink } from '@console/internal/components/utils';
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
  const { t } = useTranslation();
  const breadcrumbs = [
    {
      name: t('gitops-plugin~Environments'),
      path: '/environments',
    },
    {
      name: t('gitops-plugin~Application environments'),
      path: `${url}`,
    },
  ];

  return (
    <div className="odc-gitops-details-page-heading co-m-nav-title co-m-nav-title--breadcrumbs">
      <BreadCrumbs breadcrumbs={breadcrumbs} />
      <h1 className="co-m-pane__heading" style={{ marginRight: 'var(--pf-global--spacer--sm)' }}>
        <div className="co-m-pane__name co-resource-item">
          <span className="co-resource-item__resource-name">{appName}</span>
        </div>
        {badge && <span className="co-m-pane__heading-badge">{badge}</span>}
      </h1>
      <ExternalLink href={manifestURL} additionalClassName={'co-break-all'}>
        {routeDecoratorIcon(manifestURL, 12, t)}&nbsp;
        {manifestURL}&nbsp;
      </ExternalLink>
    </div>
  );
};

export default GitOpsDetailsPageHeading;
