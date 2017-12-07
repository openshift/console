/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import { Link, match } from 'react-router-dom';
import * as _ from 'lodash';

import { ClusterServiceVersionResourceKind, ALMStatusDescriptors, ClusterServiceVersionKind } from './index';
import { isFilledStatusValue, ClusterServiceVersionResourceStatusDescriptor, PodStatusChart, ClusterServiceVersionResourceStatus } from './status-descriptors';
import { ClusterServiceVersionResourceSpecDescriptor, SpecDescriptor } from './spec-descriptors';
import { List, MultiListPage, ListHeader, ColHead, DetailsPage, CompactExpandButtons } from '../factory';
import { ResourceLink, ResourceSummary, StatusBox, navFactory, Timestamp, LabelList, humanizeNumber, ResourceIcon, MsgBox, ResourceCog, Cog } from '../utils';
import { connectToPlural } from '../../kinds';
import { k8sGet, kindForReference, K8sResourceKind, OwnerReference, K8sKind, referenceFor, K8sFullyQualifiedResourceReference } from '../../module/k8s';
import { ClusterServiceVersionModel } from '../../models';
import { Gauge, Scalar, Line, Bar } from '../graphs';

export const ClusterServiceVersionResourceHeader: React.StatelessComponent<ClusterServiceVersionResourceHeaderProps> = (props) => <ListHeader>
  <ColHead {...props} className="col-xs-2" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-xs-2" sortField="metadata.labels">Labels</ColHead>
  <ColHead {...props} className="col-xs-2" sortField="kind">Type</ColHead>
  <ColHead {...props} className="col-xs-2">Status</ColHead>
  <ColHead {...props} className="col-xs-2">Version</ColHead>
  <ColHead {...props} className="col-xs-2">Last Updated</ColHead>
</ListHeader>;

export const ClusterServiceVersionResourceLink: React.StatelessComponent<ClusterServiceVersionResourceLinkProps> = (props) => {
  const {namespace, name} = props.obj.metadata;
  const appName = location.pathname.split('/')[location.pathname.split('/').indexOf('clusterserviceversion-v1s') + 1];

  return <span className="co-resource-link">
    <ResourceIcon kind={referenceFor(props.obj)} />
    <Link to={`/ns/${namespace}/clusterserviceversion-v1s/${appName}/${referenceFor(props.obj)}/${name}`}>{name}</Link>
  </span>;
};

export const ClusterServiceVersionResourceRow: React.StatelessComponent<ClusterServiceVersionResourceRowProps> = (props) => {
  const {obj} = props;

  return <div className="row co-resource-list__item">
    <div className="col-xs-2">
      <ResourceCog actions={Cog.factory.common} kind={referenceFor(obj)} resource={obj} />
      <ClusterServiceVersionResourceLink obj={obj} />
    </div>
    <div className="col-xs-2">
      <LabelList kind={obj.kind} labels={obj.metadata.labels} />
    </div>
    <div className="col-xs-2">
      {obj.kind}
    </div>
    <div className="col-xs-2">
      {_.get(obj.status, 'phase') || <div className="text-muted">Unknown</div>}
    </div>
    <div className="col-xs-2">
      {_.get(obj.spec, 'version') || <div className="text-muted">Unknown</div>}
    </div>
    <div className="col-xs-2">
      <Timestamp timestamp={obj.metadata.creationTimestamp} />
    </div>
  </div>;
};

export const ClusterServiceVersionResourceList: React.StatelessComponent<ClusterServiceVersionResourceListProps> = (props) => {
  const EmptyMsg = () => <MsgBox title="No Application Resources Found" detail="Application resources are declarative components used to define the behavior of the application." />;

  return <List {...props} EmptyMsg={EmptyMsg} Header={ClusterServiceVersionResourceHeader} Row={ClusterServiceVersionResourceRow} label="Application Resources" />;
};

export const ClusterServiceVersionPrometheusGraph: React.StatelessComponent<ClusterServiceVersionPrometheusGraphProps> = (props) => {
  switch (props.query.type) {
    case PrometheusQueryTypes.Counter:
      return <Scalar title={props.query.name} unit={props.query.unit} query={props.query.query} basePath={props.basePath} />;
    case PrometheusQueryTypes.Gauge:
      return <Gauge title={props.query.name} query={props.query.query} basePath={props.basePath} />;
    case PrometheusQueryTypes.Line:
      return <Line title={props.query.name} query={props.query.query} basePath={props.basePath} />;
    case PrometheusQueryTypes.Bar:
      return <Bar title={props.query.name} query={props.query.query} metric={props.query.metric} humanize={humanizeNumber} basePath={props.basePath} />;
    default:
      return <span>Unknown graph type: {props.query.type}</span>;
  }
};

const resourceForCRD = (crdDesc) => ({
  kind: `${crdDesc.kind}:${crdDesc.name.slice(crdDesc.name.indexOf('.') + 1)}:${crdDesc.version}` as K8sFullyQualifiedResourceReference,
  namespaced: true,
  optional: true,
  prop: crdDesc.kind,
});

export const ClusterServiceVersionResourcesPage: React.StatelessComponent<ClusterServiceVersionResourcesPageProps> = (props) => {
  const {obj} = props;
  const {owned = []} = obj.spec.customresourcedefinitions;
  const firehoseResources = owned.map(resourceForCRD);

  const EmptyMsg = () => <MsgBox title="No Application Resources Defined" detail="This application was not properly installed or configured." />;
  const createLink = (name: string) => `/ns/${obj.metadata.namespace}/clusterserviceversion-v1s/${obj.metadata.name}/${name.split('.')[0]}/new`;
  const createProps = owned.length > 1
    ? {items: owned.reduce((acc, crd) => ({...acc, [crd.name]: crd.displayName}), {}), createLink}
    : {to: createLink(owned.length > 0 ? owned[0].name : '')};

  const owners = (ownerRefs: OwnerReference[], items: K8sResourceKind[]) => ownerRefs.filter(({uid}) => items.filter(({metadata}) => metadata.uid === uid).length > 0);
  const flatten = (resources: {[kind: string]: {data: K8sResourceKind[]}}) => _.flatMap(resources, (resource) => _.map(resource.data, item => item))
    .filter(({kind, metadata}, i, allResources) => owned.filter(item => item.kind === kind).length > 0 || owners(metadata.ownerReferences || [], allResources).length > 0);

  const rowFilters = [{
    type: 'clusterserviceversion-resource-kind',
    selected: firehoseResources.map(({kind}) => kind),
    reducer: ({kind}) => kind,
    items: firehoseResources.map(({kind}) => ({id: kindForReference(kind), title: kindForReference(kind)})),
  }];

  return firehoseResources.length > 0
    ? <MultiListPage
      {...props}
      ListComponent={ClusterServiceVersionResourceList}
      filterLabel="Resources by name"
      resources={firehoseResources}
      namespace={obj.metadata.namespace}
      canCreate={owned.length > 0}
      createProps={createProps}
      createButtonText={owned.length > 1 ? 'Create New' : `Create ${owned[0].displayName}`}
      flatten={flatten}
      rowFilters={firehoseResources.length > 1 ? rowFilters : null}
    />
    : <StatusBox loaded={true} EmptyMsg={EmptyMsg} />;
};

export const ClusterServiceVersionResourceDetails = connectToPlural(
  class ClusterServiceVersionResourceDetailsComponent extends React.Component<ClusterServiceVersionResourcesDetailsProps, ClusterServiceVersionResourcesDetailsState> {
    constructor(props) {
      super(props);
      this.state = {expanded: false};
    }

    public render() {
      const isFilteredDescriptor = (kind: ALMStatusDescriptors) => {
        switch (kind) {
          case ALMStatusDescriptors.importantMetrics:
          case ALMStatusDescriptors.prometheus:
          case ALMStatusDescriptors.podStatuses:
            return true;
          default:
            return false;
        }
      };

      const getBlockValue = (descriptor: ClusterServiceVersionResourceStatusDescriptor | ClusterServiceVersionResourceSpecDescriptor, block) => {
        if (descriptor === undefined) {
          return undefined;
        }

        const value = _.get(block, descriptor.path);
        if (value === undefined) {
          return descriptor.value;
        }

        return value;
      };

      const findStatusDescriptorWithCapability = (statusDescriptors, capability) => {
        return _.find<ClusterServiceVersionResourceStatusDescriptor>(statusDescriptors, (descriptor) => {
          return _.find(descriptor['x-descriptors'], (cap) => cap === capability) !== undefined;
        });
      };

      const {kind, metadata, spec, status} = this.props.obj;

      // Find the matching CRD spec for the kind of this resource in the CSV.
      const ownedDefinitions = _.get(this.props.clusterServiceVersion, 'spec.customresourcedefinitions.owned', []);
      const thisDefinition = _.find(ownedDefinitions, (def) => def.name.split('.')[0] === this.props.kindObj.path);
      const statusDescriptors = _.get(thisDefinition, 'statusDescriptors', []);
      const specDescriptors = _.get(thisDefinition, 'specDescriptors', []);
      const title = thisDefinition ? thisDefinition.displayName : kind;

      const filteredStatusDescriptors = _.filter(statusDescriptors, (descriptor) => {
        return _.find(descriptor['x-descriptors'], isFilteredDescriptor) === undefined;
      });

      // Find the important metrics and prometheus endpoints, if any.
      const metricsDescriptor = findStatusDescriptorWithCapability(statusDescriptors, ALMStatusDescriptors.importantMetrics);
      const promDescriptor = findStatusDescriptorWithCapability(statusDescriptors, ALMStatusDescriptors.prometheus);
      const podStatusesDescriptor = findStatusDescriptorWithCapability(statusDescriptors, ALMStatusDescriptors.podStatuses);

      const metricsValue = getBlockValue(metricsDescriptor, status);
      const promBasePath = getBlockValue(promDescriptor, status);
      const podStatusesFetcher = () => getBlockValue(podStatusesDescriptor, status);

      return <div className="co-clusterserviceversion-resource-details co-m-pane">
        <div className="co-m-pane__body">
          <h1 className="co-section-title">{`${title} Overview`}</h1>
          <div className="row">
            { podStatusesDescriptor ? <div className="col-xs-3"><PodStatusChart statusDescriptor={podStatusesDescriptor} fetcher={podStatusesFetcher} /></div> : null }
            { metricsValue
              ? metricsValue.queries.map((query: ClusterServiceVersionPrometheusQuery, i) => (
                <div key={i} className="col-xs-3 co-clusterserviceversion-resource-details__section__metric">
                  <ClusterServiceVersionPrometheusGraph query={query} basePath={promBasePath} />
                </div>)) : null }
          </div>
        </div>
        <div className="co-m-pane__body">
          <div className="co-clusterserviceversion-resource-details__section co-clusterserviceversion-resource-details__section--info">
            <div className="row">
              <div className="pull-right">
                <CompactExpandButtons expand={this.state.expanded} onExpandChange={(expanded) => this.setState({expanded})} />
              </div>
              <div className="col-xs-6">
                { this.state.expanded ?
                  <ResourceSummary resource={this.props.obj} showPodSelector={false} /> :
                  <div>
                    <dt>Name</dt>
                    <dd>{metadata.name}</dd>
                    <dt>Namespace</dt>
                    <dd><ResourceLink namespace="" kind="Namespace" name={metadata.namespace} title={metadata.namespace} /></dd>
                    <dt>Created At</dt>
                    <dd><Timestamp timestamp={metadata.creationTimestamp} /></dd>
                  </div>
                }
              </div>
              { specDescriptors.map((specDescriptor: ClusterServiceVersionResourceSpecDescriptor, i) => {
                const specValue = getBlockValue(specDescriptor, spec);

                return <div key={i} className="col-xs-6">
                  <SpecDescriptor namespace={metadata.namespace} resource={this.props.obj} kindObj={this.props.kindObj} specValue={specValue} specDescriptor={specDescriptor} />
                </div>;
              }) }

              { filteredStatusDescriptors.map((statusDescriptor: ClusterServiceVersionResourceStatusDescriptor) => {
                const statusValue = getBlockValue(statusDescriptor, status);
                const showStatus = !isFilledStatusValue(statusValue) && this.state.expanded;
                return showStatus ? <div className="col-xs-6 text-muted" key={statusDescriptor.path}><ClusterServiceVersionResourceStatus namespace={metadata.namespace} statusDescriptor={statusDescriptor} statusValue={statusValue} /></div> : null;
              }) }
            </div>
          </div>
        </div>
      </div>;
    }
  });

const flattenFor = (parentObj: K8sResourceKind) => (resources: {[kind: string]: {data: K8sResourceKind[]}}) => {
  return _.flatMap(resources, (resource, kind) => resource.data.map(item => ({...item, kind})))
    .reduce((owned, resource) => {
      return (resource.metadata.ownerReferences || []).some(ref => ref.uid === parentObj.metadata.uid || owned.some(({metadata}) => metadata.uid === ref.uid))
        ? owned.concat([resource])
        : owned;
    }, [] as K8sResourceKind[]);
};

export const Resources = connectToPlural((resourceprops: ResourceProps) => {
  const kindObj = resourceprops.kindObj;
  const clusterServiceVersion = resourceprops.clusterServiceVersion;

  // If the CSV defines a resources list under the CRD, then we use that instead of the default.
  const ownedDefinitions = _.get(clusterServiceVersion, 'spec.customresourcedefinitions.owned', []);
  const thisDefinition = _.find(ownedDefinitions, (def) => def.name.split('.')[0] === kindObj ? kindObj.path : '(none)');

  let resources = ['Deployment', 'Service', 'ReplicaSet', 'Pod', 'Secret', 'ConfigMap'].map(kind => ({kind, namespaced: true}));
  let crds = [];

  if (thisDefinition && thisDefinition.resources) {
    resources = thisDefinition.resources.map(ref => {
      if (ref.name) {
        return resourceForCRD(ref);
      }
      return {kind: ref.kind, namespaced: true};
    });

    crds = thisDefinition.resources.filter(ref => ref.name).map(ref => ref.kind);
  }

  const isCR = (obj) => crds.find((kind) => kind === obj.kind);

  const ResourceHeader: React.StatelessComponent<ResourceHeaderProps> = (props) => <ListHeader>
    <ColHead {...props} className="col-xs-4" sortField="metadata.name">Name</ColHead>
    <ColHead {...props} className="col-xs-2" sortField="kind">Type</ColHead>
    <ColHead {...props} className="col-xs-2" sortField="status.phase">Status</ColHead>
    <ColHead {...props} className="col-xs-4" sortField="metadata.creationTimestamp">Created</ColHead>
  </ListHeader>;

  const ResourceRow: React.StatelessComponent<ResourceRowProps> = ({obj}) => <div className="row co-resource-list__item">
    <div className="col-xs-4">
      { isCR(obj) ? <ClusterServiceVersionResourceLink obj={obj} /> :
        <ResourceLink kind={obj.kind} name={obj.metadata.name} namespace={obj.metadata.namespace} title={obj.metadata.name} />
      }
    </div>
    <div className="col-xs-2">{obj.kind}</div>
    <div className="col-xs-2">{_.get(obj.status, 'phase', 'Created')}</div>
    <div className="col-xs-4"><Timestamp timestamp={obj.metadata.creationTimestamp} /></div>
  </div>;

  const obj = resourceprops.obj;
  return <MultiListPage
    filterLabel="Resources by name"
    resources={resources}
    rowFilters={[{
      type: 'clusterserviceversion-resource-kind',
      selected: resources.map(({kind}) => kind),
      reducer: ({kind}) => kind,
      items: resources.map(({kind}) => ({id: kindForReference(kind), title: kindForReference(kind)})),
    }]}
    flatten={flattenFor(obj)}
    namespace={obj.metadata.namespace}
    ListComponent={(props) => <List
      {...props}
      data={props.data.map(o => ({...o, rowKey: o.metadata.uid}))}
      EmptyMsg={() => <MsgBox title="No Resources Found" detail="Resources are dependent servcies and Kubernetes primitives used by this instance." />}
      Header={ResourceHeader}
      Row={ResourceRow} />}
  />;
});
Resources.displayName = 'Resources';

export const ClusterServiceVersionResourcesDetailsPage =
  class ClusterServiceVersionResourcesDetailsComponent extends React.Component<ClusterServiceVersionResourcesDetailsPageProps, ClusterServiceVersionResourcesDetailsPageState> {
    constructor(props) {
      super(props);
      this.state = {clusterServiceVersion: null};

      const appName = props.match.params.appName;
      if (!_.isEmpty(appName)) {
        k8sGet(ClusterServiceVersionModel, appName, props.namespace).then((clusterServiceVersion) => {
          this.setState({clusterServiceVersion});
        });
      }
    }

    render() {
      // TODO(alecmerdler): Make first breadcrumb `name` the `displayName` of ClusterServiceVersion
      return <DetailsPage
        {...this.props}
        menuActions={Cog.factory.common}
        breadcrumbs={[
          {name: this.props.match.params.appName, path: `${this.props.match.url.split('/').filter((v, i) => i <= this.props.match.path.split('/').indexOf(':appName')).join('/')}/instances`},
          {name: `${kindForReference(this.props.kind)} Details`, path: `${this.props.match.url}`},
        ]}
        pages={[
          navFactory.details((props) => <ClusterServiceVersionResourceDetails {...props} clusterServiceVersion={this.state.clusterServiceVersion} appName={props.match.params.appName} />),
          navFactory.editYaml(),
          {name: 'Resources', href: 'resources', component: (props) => <Resources {...props} clusterServiceVersion={this.state.clusterServiceVersion} />},
        ]}
      />;
    }
  };

export type ClusterServiceVersionResourceListProps = {
  loaded: boolean;
  data: ClusterServiceVersionResourceKind[];
  filters: {[key: string]: any};
  reduxID?: string;
  reduxIDs?: string[];
  rowSplitter?: any;
  staticFilters?: any;
};

export type ClusterServiceVersionResourceHeaderProps = {
  data: ClusterServiceVersionResourceKind[];
};

export type ClusterServiceVersionResourceRowProps = {
  obj: ClusterServiceVersionResourceKind;
};

export type ClusterServiceVersionResourcesPageProps = {
  obj: ClusterServiceVersionKind;
};

export type ClusterServiceVersionResourcesDetailsProps = {
  obj: ClusterServiceVersionResourceKind;
  appName: string;
  kindObj: K8sKind;
  kindsInFlight: boolean;
  clusterServiceVersion: ClusterServiceVersionKind;
};

export type ClusterServiceVersionResourcesDetailsPageProps = {
  kind: K8sFullyQualifiedResourceReference;
  name: string;
  namespace: string;
  match: match<any>;
};

export type ClusterServiceVersionResourcesDetailsPageState = {
  clusterServiceVersion: ClusterServiceVersionKind;
};

export type ClusterServiceVersionResourcesDetailsState = {
  expanded: boolean;
};

export type ClusterServiceVersionResourceLinkProps = {
  obj: ClusterServiceVersionResourceKind;
};

export type ResourceHeaderProps = {
  data: K8sResourceKind[];
};

export type ResourceProps = {
  obj: ClusterServiceVersionResourceKind;
  kindObj: K8sKind;
  kindsInFlight: boolean;
  clusterServiceVersion: ClusterServiceVersionKind;
};

export type ResourceRowProps = {
  obj: K8sResourceKind;
};

export type ResourceListProps = {

};

export enum PrometheusQueryTypes {
  Gauge = 'Gauge',
  Counter = 'Counter',
  Line = 'Line',
  Bar = 'Bar',
}

export type ClusterServiceVersionPrometheusQuery = {
  query: string;
  name: string;
  type: PrometheusQueryTypes;
  unit?: string;
  metric?: string;
};

export type ClusterServiceVersionPrometheusGraphProps = {
  query: ClusterServiceVersionPrometheusQuery;
  basePath?: string;
};

// TODO(alecmerdler): Find Webpack loader/plugin to add `displayName` to React components automagically
ClusterServiceVersionResourceList.displayName = 'ClusterServiceVersionResourceList';
ClusterServiceVersionResourceHeader.displayName = 'ClusterServiceVersionResourceHeader';
ClusterServiceVersionResourceRow.displayName = 'ClusterServiceVersionResourceRow';
ClusterServiceVersionResourceDetails.displayName = 'ClusterServiceVersionResourceDetails';
ClusterServiceVersionResourceList.displayName = 'ClusterServiceVersionResourceList';
ClusterServiceVersionPrometheusGraph.displayName = 'ClusterServiceVersionPrometheusGraph';
ClusterServiceVersionResourceLink.displayName = 'ClusterServiceVersionResourceLink';
ClusterServiceVersionResourcesPage.displayName = 'ClusterServiceVersionResourcesPage';

