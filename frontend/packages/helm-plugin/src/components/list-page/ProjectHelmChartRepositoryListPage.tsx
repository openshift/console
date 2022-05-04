import * as React from 'react';
import { ListPage } from '@console/internal/components/factory';
import { referenceForModel } from '@console/internal/module/k8s';
import { ProjectHelmChartRepositoryModel } from '../../models';
import ProjectHelmChartRepositoryList from './ProjectHelmChartRepositoryList';

const ProjectHelmChartRepositoryPage: React.FC<React.ComponentProps<typeof ListPage>> = (props) => {
  const createProps = {
    to: `/ns/${props.namespace || 'default'}/projecthelmchartrepositories/~new`,
  };
  return (
    <ListPage
      {...props}
      canCreate
      createProps={createProps}
      kind={referenceForModel(ProjectHelmChartRepositoryModel)}
      ListComponent={ProjectHelmChartRepositoryList}
    />
  );
};
export default ProjectHelmChartRepositoryPage;
