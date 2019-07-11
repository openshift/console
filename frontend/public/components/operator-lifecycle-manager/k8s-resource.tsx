import * as React from 'react';
import * as _ from 'lodash-es';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { match } from 'react-router';

import { CRDDescription, ClusterServiceVersionKind, referenceForProvidedAPI, providedAPIsFor } from './index';
import { OperandLink } from './operand';
import { ResourceLink, Timestamp, MsgBox, FirehoseResource } from '../utils';
import { MultiListPage, VirtualTable, VirtualTableRow, VirtualTableData } from '../factory';
import { K8sResourceKind, GroupVersionKind, kindForReference } from '../../module/k8s';

const tableColumnClasses = [
  classNames('col-lg-4', 'col-md-4', 'col-sm-4', 'col-xs-6'),
  classNames('col-lg-2', 'col-md-2', 'col-sm-4', 'col-xs-6'),
  classNames('col-lg-2', 'hidden-md', 'hidden-sm', 'hidden-xs'),
  classNames('col-lg-4', 'col-md-4', 'col-sm-4', 'hidden-xs'),
];

export const ResourceTableHeader = () => [
  {
    title: 'Name', sortField: 'metadata.name', transforms: [sortable],
    props: { className: tableColumnClasses[0] },
  },
  {
    title: 'Kind', sortField: 'kind', transforms: [sortable],
    props: { className: tableColumnClasses[1] },
  },
  {
    title: 'Status',
    props: { className: tableColumnClasses[2] },
  },
  {
    title: 'Created', sortField: 'metadata.creationTimestamp', transforms: [sortable],
    props: { className: tableColumnClasses[3] },
  },
];

export const ResourceTableRow: React.FC<ResourceTableRowProps> = ({obj, index, key, style, linkFor}) => <VirtualTableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
  <VirtualTableData className={tableColumnClasses[0]}>
    {linkFor(obj)}
  </VirtualTableData>
  <VirtualTableData className={tableColumnClasses[1]}>
    {obj.kind}
  </VirtualTableData>
  <VirtualTableData className={tableColumnClasses[2]}>
    {_.get(obj.status, 'phase', 'Created')}
  </VirtualTableData>
  <VirtualTableData className={tableColumnClasses[3]}>
    <Timestamp timestamp={obj.metadata.creationTimestamp} />
  </VirtualTableData>
</VirtualTableRow>;

export const ResourceTable: React.FC<ResourceTableProps> = (props) => <VirtualTable
  {...props}
  aria-label="Operand Resources"
  Header={ResourceTableHeader}
  Row={rowProps => <ResourceTableRow {...rowProps} linkFor={props.linkFor} />}
  EmptyMsg={() => <MsgBox title="No Resources Found" detail="There are no Kubernetes resources used by this operand." />} />;

export const Resources: React.FC<ResourcesProps> = (props) => {
  const providedAPI = providedAPIsFor(props.clusterServiceVersion).find(desc => referenceForProvidedAPI(desc) === props.match.params.plural);

  const defaultResources = ['Deployment', 'Service', 'ReplicaSet', 'Pod', 'Secret', 'ConfigMap'];
  const firehoseResources = _.get(providedAPI, 'resources', defaultResources.map(kind => ({kind})) as CRDDescription['resources'])
    .map(ref => ({kind: ref.kind, namespaced: true}) as FirehoseResource);

  // NOTE: This is us building the `ownerReferences` graph client-side
  const flattenFor = (parentObj: K8sResourceKind) => (resources: {[kind: string]: {data: K8sResourceKind[]}}) => {
    return _.flatMap(resources, (resource, kind: string) => resource.data.map(item => ({...item, kind})))
      .reduce((owned, resource) => {
        return (resource.metadata.ownerReferences || []).some(ref => ref.uid === parentObj.metadata.uid || owned.some(({metadata}) => metadata.uid === ref.uid))
          ? owned.concat([resource])
          : owned;
      }, [] as K8sResourceKind[]);
  };

  // FIXME: Comparing `kind` is not enough to determine if an object is a custom resource
  const linkFor = (obj: K8sResourceKind) => _.get(providedAPI, 'resources', []).some(({kind, name}) => name && kind === obj.kind)
    ? <OperandLink obj={obj} />
    : <ResourceLink kind={obj.kind} name={obj.metadata.name} namespace={obj.metadata.namespace} title={obj.metadata.name} />;

  return <MultiListPage
    filterLabel="Resources by name"
    resources={firehoseResources}
    rowFilters={[{
      type: 'clusterserviceversion-resource-kind',
      selected: firehoseResources.map(({kind}) => kind),
      reducer: ({kind}) => kind,
      items: firehoseResources.map(({kind}) => ({id: kindForReference(kind), title: kindForReference(kind)})),
    }]}
    flatten={flattenFor(props.obj)}
    namespace={props.obj.metadata.namespace}
    ListComponent={listProps => <ResourceTable {...listProps} linkFor={linkFor} />}
  />;
};

export type ResourcesProps = {
  obj: K8sResourceKind;
  clusterServiceVersion: ClusterServiceVersionKind;
  match: match<{plural: GroupVersionKind, ns: string, appName: string, name: string}>;
};

export type ResourceTableRowProps = {
  obj: K8sResourceKind;
  linkFor: (obj: K8sResourceKind) => JSX.Element;
  index: number;
  key?: string;
  style: object;
};

export type ResourceListProps = {

};

export type ResourceTableProps = {
  loaded: boolean;
  loadError?: string;
  data: K8sResourceKind[];
  linkFor: (obj: K8sResourceKind) => JSX.Element;
};

ResourceTableHeader.displayName = 'ResourceTableHeader';
ResourceTable.displayName = 'ResourceTable';
Resources.displayName = 'Resources';
