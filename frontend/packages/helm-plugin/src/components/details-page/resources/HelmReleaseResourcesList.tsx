import type { FC } from 'react';
import { Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { ConsoleDataView } from '@console/app/src/components/data-view/ConsoleDataView';
import type { TableProps } from '@console/internal/components/factory';
import { LoadingBox } from '@console/internal/components/utils';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { useHelmReleaseResourcesColumns } from './HelmReleaseResourcesHeader';
import { getDataViewRows } from './HelmReleaseResourcesRow';

const HelmReleaseResourcesList: FC<TableProps> = (props) => {
  const { t } = useTranslation();
  const columns = useHelmReleaseResourcesColumns();

  return (
    <Suspense fallback={<LoadingBox />}>
      <ConsoleDataView<K8sResourceKind>
        {...props}
        data={props.data}
        loaded={props.loaded}
        label={t('helm-plugin~Resources')}
        columns={columns}
        getDataViewRows={getDataViewRows}
        hideColumnManagement
        data-test="helm-resources-list"
      />
    </Suspense>
  );
};

export default HelmReleaseResourcesList;
