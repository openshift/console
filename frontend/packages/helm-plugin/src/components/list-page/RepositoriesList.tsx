import type { FC } from 'react';
import { Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { ConsoleDataView } from '@console/app/src/components/data-view/ConsoleDataView';
import type { TableProps } from '@console/internal/components/factory';
import { LoadingBox } from '@console/internal/components/utils';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { useRepositoriesColumns } from './RepositoriesHeader';
import { getDataViewRows } from './RepositoriesRow';

const RepositoriesList: FC<TableProps> = (props) => {
  const { t } = useTranslation('helm-plugin');
  const { columns } = useRepositoriesColumns();

  return (
    <Suspense fallback={<LoadingBox />}>
      <ConsoleDataView<K8sResourceKind>
        {...props}
        id="console.ui~v1~HelmRepositoriesCombinedList"
        data={props.data}
        loaded={props.loaded}
        label={t('HelmChartRepositories')}
        columns={columns}
        getDataViewRows={getDataViewRows}
        data-test="repositories-list"
      />
    </Suspense>
  );
};

export default RepositoriesList;
