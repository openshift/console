import type { ComponentProps, FC } from 'react';
import { useTranslation } from 'react-i18next';
import { ListPage } from '@console/internal/components/factory';
import { referenceForModel } from '@console/internal/module/k8s';
import { ProjectHelmChartRepositoryModel } from '../../models';
import ProjectHelmChartRepositoryList from './ProjectHelmChartRepositoryList';

const ProjectHelmChartRepositoryListPage: FC<ComponentProps<typeof ListPage>> = (props) => {
  const { t } = useTranslation();
  const createProps = {
    to: `/helm-repositories/ns/${props.namespace || 'default'}/~new/form?kind=${referenceForModel(
      ProjectHelmChartRepositoryModel,
    )}`,
  };
  return (
    <ListPage
      {...props}
      canCreate
      createProps={createProps}
      aria-label={t('helm-plugin~ProjectHelmChartRepositories')}
      kind={referenceForModel(ProjectHelmChartRepositoryModel)}
      ListComponent={ProjectHelmChartRepositoryList}
      omitFilterToolbar
    />
  );
};
export default ProjectHelmChartRepositoryListPage;
