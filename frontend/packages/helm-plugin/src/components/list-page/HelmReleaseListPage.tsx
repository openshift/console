import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { RouteComponentProps } from 'react-router';
import { PageHeading } from '@console/internal/components/utils';
import HelmReleaseList from './HelmReleaseList';

type HelmReleaseListPageProps = RouteComponentProps<{ ns: string }>;

const HelmReleaseListPage: React.FC<HelmReleaseListPageProps> = (props) => {
  const { t } = useTranslation();
  return (
    <div>
      <PageHeading title={t('helm-plugin~Helm Releases')} />
      <HelmReleaseList match={props.match} />
    </div>
  );
};

export default HelmReleaseListPage;
