/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import * as _ from 'lodash-es';

import { connectToPlural } from '../../kinds';
import { CRDDescription, ClusterServiceVersionKind, ClusterServiceVersionResourceLink, ClusterServiceVersionResourceKind } from './index';
import { ResourceLink, Timestamp, MsgBox } from '../utils';
import { ColHead, ListHeader, MultiListPage, List } from '../factory';
import { K8sResourceKind, GroupVersionKind, kindForReference, K8sKind } from '../../module/k8s';

export const Resources = connectToPlural((props: ResourceProps) => {
  const {kindObj, clusterServiceVersion} = props;

  const resourceForCRD = (crdDesc) => ({
    kind: `${crdDesc.name.slice(crdDesc.name.indexOf('.') + 1)}:${crdDesc.version}:${crdDesc.kind}` as GroupVersionKind,
    namespaced: true,
    optional: true,
    prop: crdDesc.kind,
  });

  // If the CSV defines a resources list under the CRD, then we use that instead of the default.
  const thisDescription: CRDDescription[] = _.get(clusterServiceVersion, 'spec.customresourcedefinitions.owned', [])
    .find((def) => def.name.split('.')[0] === _.get(kindObj, 'path', ''));

  const crds = _.get(thisDescription, 'resources', []).filter(ref => ref.name).map(ref => ref.kind);
  const firehoseResources = _.get(thisDescription, 'resources', ['Deployment', 'Service', 'ReplicaSet', 'Pod', 'Secret', 'ConfigMap'].map(kind => ({kind})))
    .map(ref => _.get(ref, 'name') ? resourceForCRD(ref) : {kind: ref.kind, namespaced: true});

  const flattenFor = (parentObj: K8sResourceKind) => (resources: {[kind: string]: {data: K8sResourceKind[]}}) => {
    return _.flatMap(resources, (resource, kind: string) => resource.data.map(item => ({...item, kind})))
      .reduce((owned, resource) => {
        return (resource.metadata.ownerReferences || []).some(ref => ref.uid === parentObj.metadata.uid || owned.some(({metadata}) => metadata.uid === ref.uid))
          ? owned.concat([resource])
          : owned;
      }, [] as K8sResourceKind[]);
  };

  // FIXME: Comparing `kind` is not enough to determine if an object is a custom resource
  const isCR = (k8sObj) => crds.find((kind) => kind === k8sObj.kind);

  const ResourceHeader: React.SFC<ResourceHeaderProps> = (headerProps) => <ListHeader>
    <ColHead {...headerProps} className="col-xs-4" sortField="metadata.name">Name</ColHead>
    <ColHead {...headerProps} className="col-xs-2" sortField="kind">Type</ColHead>
    <ColHead {...headerProps} className="col-xs-2" sortField="status.phase">Status</ColHead>
    <ColHead {...headerProps} className="col-xs-4" sortField="metadata.creationTimestamp">Created</ColHead>
  </ListHeader>;

  const ResourceRow: React.SFC<ResourceRowProps> = ({obj}) => <div className="row co-resource-list__item">
    <div className="col-xs-4">
      { isCR(obj) ? <ClusterServiceVersionResourceLink obj={obj} /> : <ResourceLink kind={obj.kind} name={obj.metadata.name} namespace={obj.metadata.namespace} title={obj.metadata.name} /> }
    </div>
    <div className="col-xs-2">{obj.kind}</div>
    <div className="col-xs-2">{_.get(obj.status, 'phase', 'Created')}</div>
    <div className="col-xs-4"><Timestamp timestamp={obj.metadata.creationTimestamp} /></div>
  </div>;

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
    ListComponent={(listProps) => <List
      {...listProps}
      data={listProps.data.map(o => ({...o, rowKey: o.metadata.uid}))}
      EmptyMsg={() => <MsgBox title="No Resources Found" detail={`There are no Kubernetes resources used by this ${props.obj.kind}.`} />}
      Header={ResourceHeader}
      Row={ResourceRow} />}
  />;
});

export type ResourceHeaderProps = {
  data: K8sResourceKind[];
};

export type ResourceProps = {
  obj: ClusterServiceVersionResourceKind;
  kindObj: K8sKind;
  clusterServiceVersion: ClusterServiceVersionKind;
};

export type ResourceRowProps = {
  obj: K8sResourceKind;
};

export type ResourceListProps = {

};
