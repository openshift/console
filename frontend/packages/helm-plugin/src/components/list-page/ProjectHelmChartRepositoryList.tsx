import type { FC } from 'react';
import { Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { ConsoleDataView } from '@console/app/src/components/data-view/ConsoleDataView';
import type { ConsoleDataViewProps } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { LoadingBox } from '@console/internal/components/utils';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { ProjectHelmChartRepositoryModel } from '../../models/helm';
import { getDataViewRows } from './ProjectHelmChartRepositoryRow';
import { useRepositoriesColumns } from './RepositoriesHeader';

type ProjectHelmChartRepositoryListProps = Omit<
  ConsoleDataViewProps<K8sResourceKind>,
  'id' | 'columns' | 'getDataViewRows'
>;

const ProjectHelmChartRepositoryList: FC<ProjectHelmChartRepositoryListProps> = (props) => {
  const { t } = useTranslation('helm-plugin');
  const { columns } = useRepositoriesColumns();

  return (
    <Suspense fallback={<LoadingBox />}>
      <ConsoleDataView<K8sResourceKind>
        {...props}
        id={ProjectHelmChartRepositoryModel}
        data={props.data}
        loaded={props.loaded}
        label={t('HelmChartRepositories')}
        columns={columns}
        getDataViewRows={getDataViewRows}
        data-test="project-helm-chart-repositories-list"
      />
    </Suspense>
  );
};

export default ProjectHelmChartRepositoryList;
