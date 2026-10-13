import type { FC } from 'react';
import { Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { ConsoleDataView } from '@console/app/src/components/data-view/ConsoleDataView';
import type { ConsoleDataViewProps } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { LoadingBox } from '@console/internal/components/utils';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { useHelmReleaseResourcesColumns } from './HelmReleaseResourcesHeader';
import { getDataViewRows } from './HelmReleaseResourcesRow';

type HelmReleaseResourcesListProps = Omit<
  ConsoleDataViewProps<K8sResourceKind>,
  'id' | 'columns' | 'getDataViewRows'
>;

const HelmReleaseResourcesList: FC<HelmReleaseResourcesListProps> = (props) => {
  const { t } = useTranslation('helm-plugin');
  const columns = useHelmReleaseResourcesColumns();

  return (
    <Suspense fallback={<LoadingBox />}>
      <ConsoleDataView<K8sResourceKind>
        {...props}
        isResizable={false}
        id="console.ui~v1~HelmReleaseResourcesList"
        data={props.data}
        loaded={props.loaded}
        label={t('Resources')}
        columns={columns}
        getDataViewRows={getDataViewRows}
        data-test="helm-resources-list"
      />
    </Suspense>
  );
};

export default HelmReleaseResourcesList;
