import type { FC } from 'react';
import { useMemo, Suspense } from 'react';
import { Label } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom-v5-compat';
import {
  actionsCellProps,
  cellIsStickyProps,
  getNameCellProps,
  ConsoleDataView,
} from '@console/app/src/components/data-view/ConsoleDataView';
import type { GetDataViewRows } from '@console/app/src/components/data-view/types';
import type { TableColumn } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { ResourceLink } from '@console/internal/components/utils/resource-link';
import { LoadingBox } from '@console/internal/components/utils/status-box';
import { referenceForModel } from '@console/internal/module/k8s';
import { ALL_NAMESPACES_KEY, Status } from '@console/shared';
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
        cell: <ResourceLink kind={resourceKind} name={name} namespace={undefined} />,
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

const useClusterExtensionColumns = (
  showNamespace: boolean,
): TableColumn<ClusterExtensionKind>[] => {
  const { t } = useTranslation();
  const columns = useMemo(() => {
    const baseColumns: TableColumn<ClusterExtensionKind>[] = [
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
    ];

    if (showNamespace) {
      baseColumns.push({
        title: t('olm-v1~Namespace'),
        id: tableColumnInfo[4].id,
        sort: 'spec.namespace',
        props: {
          modifier: 'nowrap',
        },
      });
    }

    baseColumns.push(
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
    );

    return baseColumns;
  }, [t, showNamespace]);

  return columns;
};

interface ClusterExtensionListPageProps {
  namespace?: string;
}

const ClusterExtensionListPage: FC<ClusterExtensionListPageProps> = ({ namespace }) => {
  const { t } = useTranslation();
  const { ns } = useParams<{ ns?: string }>();
  const activeNamespace = namespace || ns;
  const showNamespace = activeNamespace === ALL_NAMESPACES_KEY || !activeNamespace;

  const [clusterExtensions, loaded, loadError] = useK8sWatchResource<ClusterExtensionKind[]>({
    kind: referenceForModel(ClusterExtensionModel),
    isList: true,
    namespaced: false,
  });

  // Filter by spec.namespace when in a specific namespace context
  const filteredData = useMemo(() => {
    if (!activeNamespace || activeNamespace === ALL_NAMESPACES_KEY) {
      return clusterExtensions;
    }
    return clusterExtensions.filter((ce) => ce.spec?.namespace === activeNamespace);
  }, [clusterExtensions, activeNamespace]);

  const columns = useClusterExtensionColumns(showNamespace);

  return (
    <PaneBody>
      <Suspense fallback={<LoadingBox />}>
        <ConsoleDataView<ClusterExtensionKind>
          label={t('olm-v1~ClusterExtensions')}
          data={filteredData}
          loaded={loaded}
          loadError={loadError}
          columns={columns}
          getDataViewRows={getDataViewRows}
          hideColumnManagement
        />
      </Suspense>
    </PaneBody>
  );
};

export default ClusterExtensionListPage;
