import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Table, TableProps } from '@console/internal/components/factory';
import ProjectHelmChartRepositoryRow from './ProjectHelmChartRepositoryRow';
import RepositoriesHeader from './RepositoriesHeader';

const ProjectHelmChartRepositoryList: React.FC<TableProps> = (props) => {
  const { t } = useTranslation();
  return (
    <Table
      {...props}
      Header={RepositoriesHeader(t)}
      Row={ProjectHelmChartRepositoryRow}
      virtualize
    />
  );
};

export default ProjectHelmChartRepositoryList;
