import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ConsoleDataView } from '@console/app/src/components/data-view/ConsoleDataView';
import { TableProps } from '@console/internal/components/factory';
import { LoadingBox } from '@console/internal/components/utils';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { getDataViewRows } from './HelmChartRepositoryRow';
import { useRepositoriesColumns } from './RepositoriesHeader';

const HelmChartRepositoryList: React.FC<TableProps> = (props) => {
  const { t } = useTranslation();
  const columns = useRepositoriesColumns();

  return (
    <React.Suspense fallback={<LoadingBox />}>
      <ConsoleDataView<K8sResourceKind>
        {...props}
        data={props.data}
        loaded={props.loaded}
        label={t('helm-plugin~HelmChartRepositories')}
        columns={columns}
        getDataViewRows={getDataViewRows}
        hideColumnManagement
        data-test="helm-chart-repositories-list"
      />
    </React.Suspense>
  );
};

export default HelmChartRepositoryList;
