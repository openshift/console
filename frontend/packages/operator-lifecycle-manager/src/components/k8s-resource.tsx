import * as React from 'react';
import * as _ from 'lodash';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { match } from 'react-router';
import { Status } from '@console/shared';
import {
  ResourceLink,
  Timestamp,
  MsgBox,
  FirehoseResource,
} from '@console/internal/components/utils';
import {
  MultiListPage,
  Table,
  TableRow,
  TableData,
  RowFunction,
} from '@console/internal/components/factory';
import {
  K8sResourceKind,
  GroupVersionKind,
  kindForReference,
  modelFor,
  referenceForGroupVersionKind,
} from '@console/internal/module/k8s';
import { CRDDescription, ClusterServiceVersionKind, ProvidedAPI } from '../types';
import { referenceForProvidedAPI, providedAPIsFor } from './index';
import { OperandLink } from './operand/operand-link';

const tableColumnClasses = [
  classNames('col-lg-4', 'col-md-4', 'col-sm-4', 'col-xs-6'),
  classNames('col-lg-2', 'col-md-2', 'col-sm-4', 'col-xs-6'),
  classNames('col-lg-2', 'hidden-md', 'hidden-sm', 'hidden-xs'),
  classNames('col-lg-4', 'col-md-4', 'col-sm-4', 'hidden-xs'),
];

export const ResourceTableHeader = () => [
  {
    title: 'Name',
    sortField: 'metadata.name',
    transforms: [sortable],
    props: { className: tableColumnClasses[0] },
  },
  {
    title: 'Kind',
    sortField: 'kind',
    transforms: [sortable],
    props: { className: tableColumnClasses[1] },
  },
  {
    title: 'Status',
    sortField: 'status.phase',
    transforms: [sortable],
    props: { className: tableColumnClasses[2] },
  },
  {
    title: 'Created',
    sortField: 'metadata.creationTimestamp',
    transforms: [sortable],
    props: { className: tableColumnClasses[3] },
  },
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
      <Status status={_.get(obj.status, 'phase', 'Created')} />
    </TableData>
    <TableData className={tableColumnClasses[3]}>
      <Timestamp timestamp={obj.metadata.creationTimestamp} />
    </TableData>
  </TableRow>
);

export const ResourceTable: React.FC<ResourceTableProps> = (props) => (
  <Table
    {...props}
    aria-label="Operand Resources"
    Header={ResourceTableHeader}
    Row={ResourceTableRow}
    EmptyMsg={() => (
      <MsgBox
        title="No Resources Found"
        detail="There are no Kubernetes resources used by this operand."
      />
    )}
    virtualize
  />
);

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
  _.get(providedAPI, 'resources', []).some(({ kind, name }) => name && kind === obj.kind) ? (
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
  const providedAPI = providedAPIsFor(props.clusterServiceVersion).find(
    (desc) => referenceForProvidedAPI(desc) === props.match.params.plural,
  );

  const defaultResources = ['Deployment', 'Service', 'ReplicaSet', 'Pod', 'Secret', 'ConfigMap'];
  const firehoseResources = _.get(
    providedAPI,
    'resources',
    defaultResources.map((kind) => ({
      kind,
    })) as CRDDescription['resources'],
  ).map(
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
      filterLabel="Resources by name"
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

ResourceTableHeader.displayName = 'ResourceTableHeader';
ResourceTable.displayName = 'ResourceTable';
Resources.displayName = 'Resources';
