import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ListPage } from '@console/internal/components/factory';
import { referenceForModel } from '@console/internal/module/k8s';
import { ProjectHelmChartRepositoryModel } from '../../models';
import ProjectHelmChartRepositoryList from './ProjectHelmChartRepositoryList';

const ProjectHelmChartRepositoryListPage: React.FC<React.ComponentProps<typeof ListPage>> = (
  props,
) => {
  const { t } = useTranslation();
  const createProps = {
    to: `/ns/${
      props.namespace || 'default'
    }/helmchartrepositories/~new/form?kind=${referenceForModel(ProjectHelmChartRepositoryModel)}`,
  };
  return (
    <ListPage
      {...props}
      canCreate
      createProps={createProps}
      aria-label={t('helm-plugin~Project Helm Chart Repositories')}
      kind={referenceForModel(ProjectHelmChartRepositoryModel)}
      ListComponent={ProjectHelmChartRepositoryList}
    />
  );
};
export default ProjectHelmChartRepositoryListPage;
