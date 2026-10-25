import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeading } from '@console/shared/src/components/heading/PageHeading';
import HelmReleaseList from './HelmReleaseList';

const HelmReleaseListPage: FC<{ mock?: boolean }> = ({ mock }) => {
  const { t } = useTranslation('helm-plugin');
  return (
    <div>
      <PageHeading title={t('Helm releases')} />
      <HelmReleaseList mock={mock} />
    </div>
  );
};

export default HelmReleaseListPage;
