import type { FC } from 'react';
import { useMemo } from 'react';
import { Label } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { ConsoleDataView } from '@console/app/src/components/data-view/ConsoleDataView';
import Status from '@console/dynamic-plugin-sdk/src/app/components/status/Status';
import type {
  ConsoleDataViewColumn,
  GetDataViewRows,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { ResourceLink } from '@console/internal/components/utils/resource-link';
import { ClusterExtensionModel } from '@console/internal/models';
import { referenceForModel } from '@console/internal/module/k8s';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { DASH } from '@console/shared/src/constants/ui';
import type { ClusterExtensionKind } from '../../types';

const tableColumnInfo = [
  { id: 'name' },
  { id: 'status' },
  { id: 'version' },
  { id: 'channel' },
  { id: 'namespace' },
  { id: 'package' },
  { id: '' },
];

const getDataViewRows: GetDataViewRows<ClusterExtensionKind> = (data, columns) =>
  data.map(({ obj }) => {
    const name = obj.metadata?.name ?? '';
    const namespace = obj.spec?.namespace ?? '';
    const packageName = obj.spec?.source?.catalog?.packageName ?? '';
    const version = obj.spec?.source?.catalog?.version ?? '';
    const channels = obj.spec?.source?.catalog?.channels;
    const status =
      obj.status?.conditions?.find((condition) => condition.type === 'Installed')?.reason || '';

    const resourceKind = referenceForModel(ClusterExtensionModel);

    const rowCells = {
      [tableColumnInfo[0].id]: {
        cell: <ResourceLink kind={resourceKind} name={name} />,
      },
      [tableColumnInfo[1].id]: {
        cell: status ? <Status status={status} /> : DASH,
      },
      [tableColumnInfo[2].id]: {
        cell: version || DASH,
      },
      [tableColumnInfo[3].id]: {
        cell:
          channels && channels.length > 0 ? (
            <>
              {channels.map((ch) => (
                <Label key={ch} color="grey" isCompact>
                  {ch}
                </Label>
              ))}
            </>
          ) : (
            DASH
          ),
      },
      [tableColumnInfo[4].id]: {
        cell: namespace ? <ResourceLink kind="Namespace" name={namespace} /> : DASH,
      },
      [tableColumnInfo[5].id]: {
        cell: packageName || DASH,
      },
    };

    return columns.map(({ id }) => {
      if (id === tableColumnInfo[6].id) return { id };
      const cell = rowCells[id]?.cell || DASH;
      return {
        id,
        cell,
      };
    });
  });

const useClusterExtensionColumns = (): ConsoleDataViewColumn<ClusterExtensionKind>[] => {
  const { t } = useTranslation('olm-v1');
  const columns = useMemo<ConsoleDataViewColumn<ClusterExtensionKind>[]>(
    () => [
      {
        type: 'name' as const,
        title: t('Name'),
        id: tableColumnInfo[0].id,
        sort: 'metadata.name',
        props: { hasRightBorder: false, modifier: 'nowrap' as const },
      },
      {
        title: t('Status'),
        id: tableColumnInfo[1].id,
        props: {
          modifier: 'nowrap' as const,
        },
      },
      {
        title: t('Version'),
        id: tableColumnInfo[2].id,
        props: {
          modifier: 'nowrap' as const,
        },
      },
      {
        title: t('Channels'),
        id: tableColumnInfo[3].id,
      },
      {
        title: t('Namespace'),
        id: tableColumnInfo[4].id,
        sort: 'spec.namespace',
        props: {
          modifier: 'nowrap' as const,
        },
      },
      {
        title: t('Package'),
        id: tableColumnInfo[5].id,
        props: {
          modifier: 'nowrap' as const,
        },
      },
      {
        type: 'actions' as const,
        id: tableColumnInfo[6].id,
        props: { hasLeftBorder: false },
      },
    ],
    [t],
  );

  return columns;
};

const ClusterExtensionListPage: FC = () => {
  const { t } = useTranslation('olm-v1');
  const [clusterExtensions, loaded, loadError] = useK8sWatchResource<ClusterExtensionKind[]>({
    kind: referenceForModel(ClusterExtensionModel),
    isList: true,
    namespaced: false,
  });

  const columns = useClusterExtensionColumns();

  return (
    <PaneBody>
      <ConsoleDataView<ClusterExtensionKind>
        isResizable={false}
        id={ClusterExtensionModel}
        label={t('ClusterExtensions')}
        data={clusterExtensions ?? []}
        loaded={loaded}
        loadError={loadError}
        columns={columns}
        getDataViewRows={getDataViewRows}
        showNamespaceOverride
      />
    </PaneBody>
  );
};

export default ClusterExtensionListPage;
