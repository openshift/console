import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ConsoleDataView,
  initialFiltersDefault,
} from '@console/app/src/components/data-view/ConsoleDataView';
import { TableProps } from '@console/internal/components/factory';
import { LoadingBox } from '@console/internal/components/utils';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { useRepositoriesColumns } from './RepositoriesHeader';
import { getDataViewRows } from './RepositoriesRow';

const RepositoriesList: React.FC<TableProps> = (props) => {
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
        initialFilters={initialFiltersDefault}
        getDataViewRows={getDataViewRows}
        hideColumnManagement
        data-test="repositories-list"
      />
    </React.Suspense>
  );
};

export default RepositoriesList;
