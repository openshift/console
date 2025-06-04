import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { routeDecoratorIcon } from '@console/dev-console/src/components/import/render-utils';
import { PageHeading } from '@console/shared/src/components/heading/PageHeading';

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

  const PageHeadingLabel = (
    <>
      ({routeDecoratorIcon(manifestURL, 12, t)}&nbsp;
      {manifestURL}&nbsp; )
    </>
  );

  return (
    <PageHeading
      breadcrumbs={breadcrumbs}
      title={appName}
      badge={badge}
      linkProps={{
        isExternal: true,
        href: manifestURL,
        label: PageHeadingLabel,
      }}
    />
  );
};

export default GitOpsDetailsPageHeading;
