import type { FC, ReactNode } from 'react';
import { useMemo } from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import {
  ConsoleDataView,
  getNameCellProps,
  getNameColumnProps,
} from '@console/app/src/components/data-view/ConsoleDataView';
import type {
  ConsoleDataViewColumn,
  GetDataViewRows,
  WatchK8sResourceWithProp,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import type { Flatten } from '@console/internal/components/factory';
import { MultiListPage } from '@console/internal/components/factory';
import type { RowFilter } from '@console/internal/components/filter-toolbar';
import { ResourceLink, ConsoleEmptyState } from '@console/internal/components/utils';
import {
  ConfigMapModel,
  DeploymentModel,
  JobModel,
  PodModel,
  ReplicaSetModel,
  SecretModel,
  ServiceModel,
} from '@console/internal/models';
import type { K8sResourceKind, K8sResourceCommon } from '@console/internal/module/k8s';
import {
  kindForReference,
  modelFor,
  referenceForGroupVersionKind,
} from '@console/internal/module/k8s';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { Status } from '@console/shared/src/components/status/Status';
import type { RouteParams } from '@console/shared/src/types/route-params';
import type { CRDDescription, ProvidedAPI } from '../types';
import { sortByOptionalPath } from './dataViewSortHelpers';
import { OperandLink } from './operand/operand-link';
import { useOlmDataViewFilters } from './useOlmDataViewFilters';
import { providedAPIForReference } from './index';

const DEFAULT_RESOURCES: CRDDescription['resources'] = [
  { kind: DeploymentModel.kind, version: DeploymentModel.apiVersion },
  { kind: ServiceModel.kind, version: ServiceModel.apiVersion },
  { kind: ReplicaSetModel.kind, version: ReplicaSetModel.apiVersion },
  { kind: PodModel.kind, version: PodModel.apiVersion },
  { kind: SecretModel.kind, version: SecretModel.apiVersion },
  { kind: ConfigMapModel.kind, version: ConfigMapModel.apiVersion },
  { kind: JobModel.kind, version: JobModel.apiVersion },
];

export const useOperandResourceColumns = (): {
  columns: ConsoleDataViewColumn<K8sResourceKind>[];
} => {
  const { t } = useTranslation('olm');
  const columns = useMemo(
    () => [
      {
        id: 'name',
        title: t('Name'),
        sort: 'metadata.name',
        props: getNameColumnProps(),
      },
      {
        id: 'kind',
        title: t('Kind'),
        sort: 'kind',
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'status',
        title: t('Status'),
        sort: sortByOptionalPath<K8sResourceKind>('status.phase'),
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'created',
        title: t('Created'),
        sort: 'metadata.creationTimestamp',
        props: { modifier: 'nowrap' as const },
      },
    ],
    [t],
  );
  return { columns };
};

export const getOperandResourceDataViewRows: GetDataViewRows<
  K8sResourceKind,
  ResourceTableCustomData
> = (data, columns) =>
  data.map(({ obj, rowData: { linkFor, providedAPI } }) => {
    const rowCells = {
      name: {
        cell: linkFor(obj, providedAPI),
        props: getNameCellProps(obj.metadata.name),
      },
      kind: { cell: obj.kind },
      status: { cell: <Status status={obj?.status?.phase ?? 'Created'} /> },
      created: { cell: <Timestamp timestamp={obj.metadata.creationTimestamp} /> },
    };
    return columns.map(({ id }) => ({ id, ...rowCells[id] }));
  });

const ResourceTableEmptyMsg: FC = () => {
  const { t } = useTranslation('olm');
  return (
    <ConsoleEmptyState title={t('No resources found')}>
      {t('There are no Kubernetes resources used by this operand.')}
    </ConsoleEmptyState>
  );
};

const ResourceTable: FC<ResourceTableProps> = (props) => {
  const { t } = useTranslation('olm');
  const { columns } = useOperandResourceColumns();
  const dataViewFilters = useOlmDataViewFilters<K8sResourceKind>(props.rowFilters);

  // ConsoleDataView has a generic empty body state, so keep the operand-specific wording by
  // short-circuiting when nothing loaded at all. Filtering down to zero rows still uses the table.
  if (props.loaded && !props.loadError && props.data?.length === 0) {
    return <ResourceTableEmptyMsg />;
  }

  return (
    <ConsoleDataView<K8sResourceKind, ResourceTableCustomData>
      {...props}
      {...dataViewFilters}
      id="console.ui~v1~OperandResourcesList"
      label={t('Resources')}
      data={props.data || []}
      loaded={props.loaded}
      columns={columns}
      getDataViewRows={getOperandResourceDataViewRows}
      customRowData={props.customData}
    />
  );
};

export const flattenCsvResources =
  (
    parentObj: K8sResourceCommon,
  ): Flatten<{ [key: string]: K8sResourceCommon[] }, K8sResourceCommon[]> =>
  (resources) =>
    _.flatMap(resources, (resource, kind: string) =>
      _.map(resource.data, (item) => ({ ...item, kind })),
    ).reduce(
      (owned, resource) =>
        (resource.metadata.ownerReferences || []).some(
          (ref) =>
            ref.uid === parentObj.metadata.uid ||
            owned.some(({ metadata }) => metadata.uid === ref.uid),
        )
          ? owned.concat([resource])
          : owned,
      [],
    );

// NOTE: This is us building the `ownerReferences` graph client-side
// FIXME: Comparing `kind` is not enough to determine if an object is a custom resource
export const linkForCsvResource = (
  obj: K8sResourceKind,
  providedAPI: ProvidedAPI,
  csvName?: string,
) =>
  obj.metadata.namespace &&
  (providedAPI?.resources ?? []).some(({ kind, name }) => name && kind === obj.kind) ? (
    <OperandLink obj={obj} csvName={csvName} />
  ) : (
    <ResourceLink kind={obj.kind} name={obj.metadata.name} namespace={obj.metadata.namespace} />
  );

type ResourcesPageRouteParams = RouteParams<'plural'>;

export const Resources: FC<ResourcesProps> = (props) => {
  const { t } = useTranslation('olm');
  const { plural } = useParams<ResourcesPageRouteParams>();
  const providedAPI = providedAPIForReference(props.customData, plural);

  // Memoized because ConsoleDataView derives its filter state from `rowFilters`; a new array
  // every render would rebuild that state and defeat the filtered-data memo.
  const watchResources = useMemo(
    () =>
      (providedAPI?.resources ?? DEFAULT_RESOURCES).map(
        ({ name, kind, version }): WatchK8sResourceWithProp => {
          const group = name ? name.substring(name.indexOf('.') + 1) : '';
          const reference = group ? referenceForGroupVersionKind(group)(version)(kind) : kind;
          const model = modelFor(reference);
          return {
            kind: model && !model.crd ? kind : reference,
            namespaced: model ? model.namespaced : true,
            prop: kind,
          };
        },
      ),
    [providedAPI],
  );

  const rowFilters = useMemo(
    () => [
      {
        type: 'clusterserviceversion-resource-kind',
        filterGroupName: t('Kind'),
        reducer: ({ kind }) => kindForReference(kind),
        items: watchResources.map(({ kind }) => ({
          id: kindForReference(kind),
          title: kindForReference(kind),
        })),
      },
    ],
    [t, watchResources],
  );

  const customData = useMemo(
    () => ({
      linkFor: linkForCsvResource,
      providedAPI,
    }),
    [providedAPI],
  );

  return (
    <MultiListPage
      resources={watchResources}
      rowFilters={rowFilters}
      omitFilterToolbar
      flatten={flattenCsvResources(props.obj)}
      namespace={props.obj.metadata.namespace}
      ListComponent={ResourceTable}
      customData={customData}
    />
  );
};

export interface ResourcesProps {
  obj: K8sResourceKind;
  customData: any;
}

interface ResourceTableCustomData {
  linkFor: (obj: K8sResourceKind, providedAPI: ProvidedAPI) => ReactNode;
  providedAPI: ProvidedAPI;
}

interface ResourceTableProps {
  loaded: boolean;
  loadError?: string;
  data: K8sResourceKind[];
  customData: ResourceTableCustomData;
  rowFilters?: RowFilter<K8sResourceKind>[];
}

ResourceTable.displayName = 'ResourceTable';
Resources.displayName = 'Resources';
