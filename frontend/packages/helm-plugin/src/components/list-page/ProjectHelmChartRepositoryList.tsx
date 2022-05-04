import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Table, TableProps } from '@console/internal/components/factory';
import ProjectHelmChartRepositoryHeader from './ProjectHelmChartRepositoryHeader';
import ProjectHelmChartRepositoryRow from './ProjectHelmChartRepositoryRow';

const ProjectHelmChartRepositoryList: React.FC<TableProps> = (props) => {
  const { t } = useTranslation();
  return (
    <Table
      {...props}
      aria-label={t('helm-plugin~Project Helm Chart Repositories')}
      Header={ProjectHelmChartRepositoryHeader(t)}
      Row={ProjectHelmChartRepositoryRow}
      virtualize
    />
  );
};

export default ProjectHelmChartRepositoryList;
