import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { routeDecoratorIcon } from '@console/dev-console/src/components/import/render-utils';
import { BasePageHeading } from '@console/internal/components/utils/headings';

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
    <BasePageHeading
      breadcrumbs={breadcrumbs}
      title={appName}
      badge={badge}
      linkProps={{
        isExternal: true,
        href: manifestURL,
        label: (
          <>
            ({routeDecoratorIcon(manifestURL, 12, t)}&nbsp;
            {manifestURL}&nbsp; )
          </>
        ),
      }}
    />
  );
};

export default GitOpsDetailsPageHeading;
