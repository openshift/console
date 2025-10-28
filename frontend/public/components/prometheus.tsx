import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { ListPage, ListPageProps } from './factory';
import { LabelList, ResourceLink, Selector, LoadingBox } from './utils';
import { PrometheusModel } from '../models';
import { referenceForModel, referenceFor, K8sResourceKind } from '../module/k8s';
import LazyActionMenu from '@console/shared/src/components/actions/LazyActionMenu';
import {
  ConsoleDataView,
  initialFiltersDefault,
  getNameCellProps,
  actionsCellProps,
  cellIsStickyProps,
} from '@console/app/src/components/data-view/ConsoleDataView';
import { TableColumn } from '@console/internal/module/k8s';
import {
  ConsoleDataViewColumn,
  ConsoleDataViewRow,
  GetDataViewRows,
} from '@console/app/src/components/data-view/types';
import { RowProps } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { DASH } from '@console/shared/src';

const tableColumnInfo = [
  { id: 'name' },
  { id: 'namespace' },
  { id: 'labels' },
  { id: 'version' },
  { id: 'serviceMonitorSelector' },
  { id: 'actions' },
];

const getDataViewRows: GetDataViewRows<K8sResourceKind, undefined> = (
  data: RowProps<K8sResourceKind, undefined>[],
  columns: ConsoleDataViewColumn<K8sResourceKind>[],
): ConsoleDataViewRow[] => {
  return data.map(({ obj }) => {
    const { metadata, spec } = obj;
    const resourceKind = referenceFor(obj);
    const context = { [resourceKind]: obj };

    const rowCells = {
      [tableColumnInfo[0].id]: {
        cell: (
          <ResourceLink
            kind={referenceForModel(PrometheusModel)}
            name={metadata.name}
            namespace={metadata.namespace}
            title={metadata.uid}
          />
        ),
        props: getNameCellProps(metadata.name),
      },
      [tableColumnInfo[1].id]: {
        cell: (
          <ResourceLink kind="Namespace" name={metadata.namespace} title={metadata.namespace} />
        ),
      },
      [tableColumnInfo[2].id]: {
        cell: <LabelList kind={PrometheusModel.kind} labels={metadata.labels} />,
      },
      [tableColumnInfo[3].id]: {
        cell: spec.version,
      },
      [tableColumnInfo[4].id]: {
        cell: (
          <Selector
            selector={spec.serviceMonitorSelector}
            kind="ServiceMonitor"
            namespace={metadata.namespace}
          />
        ),
      },
      [tableColumnInfo[5].id]: {
        cell: <LazyActionMenu context={context} />,
        props: {
          ...actionsCellProps,
        },
      },
    };

    return columns.map(({ id }) => {
      const cell = rowCells[id]?.cell || DASH;
      const props = rowCells[id]?.props || undefined;
      return {
        id,
        props,
        cell,
      };
    });
  });
};

const usePrometheusColumns = (): TableColumn<K8sResourceKind>[] => {
  const { t } = useTranslation();
  return React.useMemo(
    () => [
      {
        title: t('public~Name'),
        id: tableColumnInfo[0].id,
        sort: 'metadata.name',
        props: {
          ...cellIsStickyProps,
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Namespace'),
        id: tableColumnInfo[1].id,
        sort: 'metadata.namespace',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Labels'),
        id: tableColumnInfo[2].id,
        sort: 'metadata.labels',
        props: {
          modifier: 'nowrap',
          width: 20,
        },
      },
      {
        title: t('public~Version'),
        id: tableColumnInfo[3].id,
        sort: 'spec.version',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Service monitor selector'),
        id: tableColumnInfo[4].id,
        sort: 'spec.serviceMonitorSelector',
        props: {
          modifier: 'nowrap',
          width: 20,
        },
      },
      {
        title: '',
        id: tableColumnInfo[5].id,
        props: {
          ...cellIsStickyProps,
        },
      },
    ],
    [t],
  );
};

export const PrometheusInstancesList: React.FC<{ data: K8sResourceKind[]; loaded: boolean }> = (
  props,
) => {
  const { data, loaded } = props;
  const columns = usePrometheusColumns();

  return (
    <React.Suspense fallback={<LoadingBox />}>
      <ConsoleDataView<K8sResourceKind>
        {...props}
        data={data}
        loaded={loaded}
        label={PrometheusModel.labelPlural}
        columns={columns}
        initialFilters={initialFiltersDefault}
        getDataViewRows={getDataViewRows}
        hideColumnManagement={true}
      />
    </React.Suspense>
  );
};

export const PrometheusInstancesPage = (props: Partial<ListPageProps<never>>) => (
  <ListPage
    {...props}
    ListComponent={PrometheusInstancesList}
    canCreate={true}
    kind={referenceForModel(PrometheusModel)}
    omitFilterToolbar={true}
  />
);
