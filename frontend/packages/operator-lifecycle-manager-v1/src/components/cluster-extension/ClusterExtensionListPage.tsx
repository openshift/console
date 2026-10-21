import type { FC } from 'react';
import { useMemo } from 'react';
import { Label } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import {
  actionsCellProps,
  cellIsStickyProps,
  getNameCellProps,
  ConsoleDataView,
} from '@console/app/src/components/data-view/ConsoleDataView';
import type { GetDataViewRows } from '@console/app/src/components/data-view/types';
import Status from '@console/dynamic-plugin-sdk/src/app/components/status/Status';
import type { TableColumn } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { ResourceLink } from '@console/internal/components/utils/resource-link';
import { referenceForModel } from '@console/internal/module/k8s';
import LazyActionMenu from '@console/shared/src/components/actions/LazyActionMenu';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { DASH } from '@console/shared/src/constants/ui';
import { ClusterExtensionModel } from '../../models';
import type { ClusterExtensionKind } from '../../types';

export const tableColumnInfo = [
  { id: 'name' },
  { id: 'status' },
  { id: 'version' },
  { id: 'channel' },
  { id: 'namespace' },
  { id: 'package' },
  { id: '' },
];

const getDataViewRows: GetDataViewRows<ClusterExtensionKind> = (data, columns) => {
  return data.map(({ obj }) => {
    const name = obj.metadata?.name ?? '';
    const namespace = obj.spec?.namespace ?? '';
    const packageName = obj.spec?.source?.catalog?.packageName ?? '';
    const version = obj.spec?.source?.catalog?.version ?? '';
    const channels = obj.spec?.source?.catalog?.channels;
    const status =
      obj.status?.conditions?.find((condition) => condition.type === 'Installed')?.reason || '';

    const resourceKind = referenceForModel(ClusterExtensionModel);
    const context = { [resourceKind]: obj };

    const rowCells = {
      [tableColumnInfo[0].id]: {
        cell: <ResourceLink kind={resourceKind} name={name} />,
        props: getNameCellProps(name),
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
      [tableColumnInfo[6].id]: {
        cell: <LazyActionMenu context={context} />,
        props: actionsCellProps,
      },
    };

    return columns.map(({ id }) => {
      const cell = rowCells[id]?.cell || DASH;
      return {
        id,
        props: rowCells[id]?.props,
        cell,
      };
    });
  });
};

const useClusterExtensionColumns = (): TableColumn<ClusterExtensionKind>[] => {
  const { t } = useTranslation();
  const columns = useMemo<TableColumn<ClusterExtensionKind>[]>(
    () => [
      {
        title: t('olm-v1~Name'),
        id: tableColumnInfo[0].id,
        sort: 'metadata.name',
        props: {
          ...cellIsStickyProps,
          modifier: 'nowrap',
        },
      },
      {
        title: t('olm-v1~Status'),
        id: tableColumnInfo[1].id,
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('olm-v1~Version'),
        id: tableColumnInfo[2].id,
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('olm-v1~Channels'),
        id: tableColumnInfo[3].id,
      },
      {
        title: t('olm-v1~Namespace'),
        id: tableColumnInfo[4].id,
        sort: 'spec.namespace',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('olm-v1~Package'),
        id: tableColumnInfo[5].id,
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: '',
        id: tableColumnInfo[6].id,
        props: {
          ...cellIsStickyProps,
        },
      },
    ],
    [t],
  );

  return columns;
};

const ClusterExtensionListPage: FC = () => {
  const { t } = useTranslation();
  const [clusterExtensions, loaded, loadError] = useK8sWatchResource<ClusterExtensionKind[]>({
    kind: referenceForModel(ClusterExtensionModel),
    isList: true,
    namespaced: false,
  });

  const columns = useClusterExtensionColumns();

  return (
    <PaneBody>
      <ConsoleDataView<ClusterExtensionKind>
        label={t('olm-v1~ClusterExtensions')}
        data={clusterExtensions ?? []}
        loaded={loaded}
        loadError={loadError}
        columns={columns}
        getDataViewRows={getDataViewRows}
        hideColumnManagement
        showNamespaceOverride
      />
    </PaneBody>
  );
};

export default ClusterExtensionListPage;
