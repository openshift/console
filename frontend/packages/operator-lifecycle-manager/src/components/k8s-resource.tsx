import * as React from 'react';
import { sortable } from '@patternfly/react-table';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { match } from 'react-router';
import {
  MultiListPage,
  Table,
  TableRow,
  TableData,
  RowFunction,
} from '@console/internal/components/factory';
import {
  ResourceLink,
  Timestamp,
  MsgBox,
  FirehoseResource,
} from '@console/internal/components/utils';
import {
  ConfigMapModel,
  DeploymentModel,
  JobModel,
  PodModel,
  ReplicaSetModel,
  SecretModel,
  ServiceModel,
} from '@console/internal/models';
import {
  K8sResourceKind,
  GroupVersionKind,
  kindForReference,
  modelFor,
  referenceForGroupVersionKind,
} from '@console/internal/module/k8s';
import { Status } from '@console/shared';
import { CRDDescription, ClusterServiceVersionKind, ProvidedAPI } from '../types';
import { OperandLink } from './operand/operand-link';
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

const tableColumnClasses = [
  '',
  'pf-u-w-16-on-md',
  'pf-m-hidden pf-m-visible-on-lg pf-u-w-16-on-lg',
  'pf-m-hidden pf-m-visible-on-sm',
];

export const ResourceTableRow: RowFunction<
  K8sResourceKind,
  {
    linkFor: (obj: K8sResourceKind, providedAPI: ProvidedAPI) => JSX.Element;
    providedAPI: ProvidedAPI;
  }
> = ({ obj, index, style, customData: { linkFor, providedAPI } }) => (
  <TableRow id={obj.metadata.uid} index={index} trKey={obj.metadata.uid} style={style}>
    <TableData className={tableColumnClasses[0]}>{linkFor(obj, providedAPI)}</TableData>
    <TableData className={tableColumnClasses[1]}>{obj.kind}</TableData>
    <TableData className={tableColumnClasses[2]}>
      <Status status={obj?.status?.phase ?? 'Created'} />
    </TableData>
    <TableData className={tableColumnClasses[3]}>
      <Timestamp timestamp={obj.metadata.creationTimestamp} />
    </TableData>
  </TableRow>
);

export const ResourceTable: React.FC<ResourceTableProps> = (props) => {
  const { t } = useTranslation();
  const ResourceTableHeader = () => [
    {
      title: t('olm~Name'),
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: t('olm~Kind'),
      sortField: 'kind',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: t('olm~Status'),
      sortField: 'status.phase',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: t('olm~Created'),
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
  ];

  return (
    <Table
      {...props}
      aria-label={t('olm~Operand Resources')}
      Header={ResourceTableHeader}
      Row={ResourceTableRow}
      EmptyMsg={() => (
        <MsgBox
          title={t('olm~No resources found')}
          detail={t('olm~There are no Kubernetes resources used by this operand.')}
        />
      )}
      virtualize
    />
  );
};

export const flattenCsvResources = (parentObj: K8sResourceKind) => (resources: {
  [kind: string]: { data: K8sResourceKind[] };
}): K8sResourceKind[] => {
  return _.flatMap(resources, (resource, kind: string) =>
    _.map(resource.data, (item) => ({ ...item, kind })),
  ).reduce((owned, resource) => {
    return (resource.metadata.ownerReferences || []).some(
      (ref) =>
        ref.uid === parentObj.metadata.uid ||
        owned.some(({ metadata }) => metadata.uid === ref.uid),
    )
      ? owned.concat([resource])
      : owned;
  }, [] as K8sResourceKind[]);
};

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
    <ResourceLink
      kind={obj.kind}
      name={obj.metadata.name}
      namespace={obj.metadata.namespace}
      title={obj.metadata.name}
    />
  );

export const Resources: React.FC<ResourcesProps> = (props) => {
  const { t } = useTranslation();
  const providedAPI = providedAPIForReference(
    props.clusterServiceVersion,
    props.match.params.plural,
  );

  const firehoseResources = (providedAPI?.resources ?? DEFAULT_RESOURCES).map(
    ({ name, kind, version }): FirehoseResource => {
      const group = name ? name.substring(name.indexOf('.') + 1) : '';
      const reference = group ? referenceForGroupVersionKind(group)(version)(kind) : kind;
      const model = modelFor(reference);
      return {
        kind: model && !model.crd ? kind : reference,
        namespaced: model ? model.namespaced : true,
        prop: kind,
      };
    },
  );

  return (
    <MultiListPage
      filterLabel={t('olm~Resources by name')}
      resources={firehoseResources}
      rowFilters={[
        {
          type: 'clusterserviceversion-resource-kind',
          filterGroupName: 'Kind',
          reducer: ({ kind }) => kindForReference(kind),
          items: firehoseResources.map(({ kind }) => ({
            id: kindForReference(kind),
            title: kindForReference(kind),
          })),
        },
      ]}
      flatten={flattenCsvResources(props.obj)}
      namespace={props.obj.metadata.namespace}
      ListComponent={ResourceTable}
      customData={{ linkFor: linkForCsvResource, providedAPI }}
    />
  );
};

export type ResourcesProps = {
  obj: K8sResourceKind;
  clusterServiceVersion: ClusterServiceVersionKind;
  match: match<{ plural: GroupVersionKind; ns: string; appName: string; name: string }>;
};

export type ResourceListProps = {};

export type ResourceTableProps = {
  loaded: boolean;
  loadError?: string;
  data: K8sResourceKind[];
  linkFor: (obj: K8sResourceKind, providedAPI: ProvidedAPI) => JSX.Element;
  providedAPI: ProvidedAPI;
};

ResourceTable.displayName = 'ResourceTable';
Resources.displayName = 'Resources';
