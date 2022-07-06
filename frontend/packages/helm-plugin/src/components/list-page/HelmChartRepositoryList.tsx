import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Table, TableProps } from '@console/internal/components/factory';
import HelmChartRepositoryRow from './HelmChartRepositoryRow';
import RepositoriesHeader from './RepositoriesHeader';

const HelmChartRepositoryList: React.FC<TableProps> = (props) => {
  const { t } = useTranslation();
  return (
    <Table
      {...props}
      aria-label={t('helm-plugin~Helm Chart Repositories')}
      Header={RepositoriesHeader(t)}
      Row={HelmChartRepositoryRow}
      virtualize
    />
  );
};

export default HelmChartRepositoryList;
