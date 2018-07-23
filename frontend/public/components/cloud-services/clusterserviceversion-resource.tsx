/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import { Link, match } from 'react-router-dom';
import * as _ from 'lodash-es';
import { connect } from 'react-redux';

import { ClusterServiceVersionResourceKind, ALMStatusDescriptors, ClusterServiceVersionKind, referenceForCRDDesc, ClusterServiceVersionPhase } from './index';
import { Resources } from './k8s-resource';
import { StatusDescriptor, PodStatusChart, ClusterServiceVersionResourceStatus } from './status-descriptors';
import { ClusterServiceVersionResourceSpec, SpecDescriptor } from './spec-descriptors';
import { List, MultiListPage, ListHeader, ColHead, DetailsPage, CompactExpandButtons } from '../factory';
import { ResourceLink, ResourceSummary, StatusBox, navFactory, Timestamp, LabelList, humanizeNumber, ResourceIcon, MsgBox, ResourceCog, Cog } from '../utils';
import { connectToModel } from '../../kinds';
import { kindForReference, K8sResourceKind, OwnerReference, K8sKind, referenceFor, GroupVersionKind, referenceForModel } from '../../module/k8s';
import { ClusterServiceVersionModel } from '../../models';
import { Gauge, Scalar, Line, Bar } from '../graphs';

export const ClusterServiceVersionResourceHeader: React.SFC<ClusterServiceVersionResourceHeaderProps> = (props) => <ListHeader>
  <ColHead {...props} className="col-xs-2" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-xs-2" sortField="metadata.labels">Labels</ColHead>
  <ColHead {...props} className="col-xs-2" sortField="kind">Type</ColHead>
  <ColHead {...props} className="col-xs-2">Status</ColHead>
  <ColHead {...props} className="col-xs-2">Version</ColHead>
  <ColHead {...props} className="col-xs-2">Last Updated</ColHead>
</ListHeader>;

export const ClusterServiceVersionResourceLink: React.SFC<ClusterServiceVersionResourceLinkProps> = (props) => {
  const {namespace, name} = props.obj.metadata;
  // XXXX HORRIBLE HACK
  const appName = location.pathname.split('/').slice(-2, -1);

  return <span className="co-resource-link">
    <ResourceIcon kind={referenceFor(props.obj)} />
    <Link to={`/k8s/ns/${namespace}/${ClusterServiceVersionModel.plural}/${appName}/${referenceFor(props.obj)}/${name}`} className="co-resource-link__resource-name">{name}</Link>
  </span>;
};

export const ClusterServiceVersionResourceRow: React.SFC<ClusterServiceVersionResourceRowProps> = (props) => {
  const {obj} = props;

  return <div className="row co-resource-list__item">
    <div className="col-xs-2 co-resource-link-wrapper">
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

export const ClusterServiceVersionResourceList: React.SFC<ClusterServiceVersionResourceListProps> = (props) => {
  const EmptyMsg = () => <MsgBox title="No Application Resources Found" detail="Application resources are declarative components used to define the behavior of the application." />;

  return <List {...props} EmptyMsg={EmptyMsg} Header={ClusterServiceVersionResourceHeader} Row={ClusterServiceVersionResourceRow} label="Application Resources" />;
};

export const ClusterServiceVersionPrometheusGraph: React.SFC<ClusterServiceVersionPrometheusGraphProps> = (props) => {
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

const inFlightStateToProps = ({k8s}) => ({inFlight: k8s.getIn(['RESOURCES', 'inFlight'])});

export const ClusterServiceVersionResourcesPage = connect(inFlightStateToProps)(
  (props: ClusterServiceVersionResourcesPageProps) => {
    const {obj} = props;
    const {owned = []} = obj.spec.customresourcedefinitions;
    const firehoseResources = owned.map((desc) => ({kind: referenceForCRDDesc(desc), namespaced: true, prop: desc.kind}));

    const EmptyMsg = () => <MsgBox title="No Application Resources Defined" detail="This application was not properly installed or configured." />;
    const createLink = (name: string) => `/k8s/ns/${obj.metadata.namespace}/${ClusterServiceVersionModel.plural}/${obj.metadata.name}/${referenceForCRDDesc(_.find(owned, {name}))}/new`;
    const createProps = owned.length > 1
      ? {items: owned.reduce((acc, crd) => ({...acc, [crd.name]: crd.displayName}), {}), createLink}
      : {to: owned.length === 1 ? createLink(owned[0].name) : null};

    const owners = (ownerRefs: OwnerReference[], items: K8sResourceKind[]) => ownerRefs.filter(({uid}) => items.filter(({metadata}) => metadata.uid === uid).length > 0);
    const flatten = (resources: {[kind: string]: {data: K8sResourceKind[]}}) => _.flatMap(resources, (resource) => _.map(resource.data, item => item))
      .filter(({kind, metadata}, i, allResources) => owned.filter(item => item.kind === kind).length > 0 || owners(metadata.ownerReferences || [], allResources).length > 0);

    const rowFilters = [{
      type: 'clusterserviceversion-resource-kind',
      selected: firehoseResources.map(({kind}) => kind),
      reducer: ({kind}) => kind,
      items: firehoseResources.map(({kind}) => ({id: kindForReference(kind), title: kindForReference(kind)})),
    }];

    if (props.inFlight) {
      return null;
    }

    return firehoseResources.length > 0
      ? <MultiListPage
        {...props}
        ListComponent={ClusterServiceVersionResourceList}
        filterLabel="Resources by name"
        resources={firehoseResources}
        namespace={obj.metadata.namespace}
        canCreate={owned.length > 0 && obj.status.phase === ClusterServiceVersionPhase.CSVPhaseSucceeded}
        createProps={createProps}
        createButtonText={owned.length > 1 ? 'Create New' : `Create ${owned[0].displayName}`}
        flatten={flatten}
        rowFilters={firehoseResources.length > 1 ? rowFilters : null}
      />
      : <StatusBox loaded={true} EmptyMsg={EmptyMsg} />;
  });

export const ClusterServiceVersionResourceDetails = connectToModel(
  class ClusterServiceVersionResourceDetails extends React.Component<ClusterServiceVersionResourcesDetailsProps, ClusterServiceVersionResourcesDetailsState> {
    constructor(props) {
      super(props);
      this.state = {expanded: false};
    }

    render() {
      const isMainDescriptor = (descriptor: StatusDescriptor) => {
        return (descriptor['x-descriptors'] || []).some((type: ALMStatusDescriptors) => {
          switch (type) {
            case ALMStatusDescriptors.importantMetrics:
            case ALMStatusDescriptors.prometheus:
            case ALMStatusDescriptors.podStatuses:
              return true;
            default:
              return false;
          }
        });
      };

      const blockValue = (descriptor: StatusDescriptor | SpecDescriptor, block: {[key: string]: any}) => !_.isEmpty(descriptor)
        ? _.get(block, descriptor.path, descriptor.value)
        : undefined;

      const descriptorFor = (descriptors: StatusDescriptor[] = [], capability: ALMStatusDescriptors) => {
        return descriptors.find((descriptor) => (descriptor['x-descriptors'] || []).some((cap) => cap === capability));
      };

      const {kind, metadata, spec, status} = this.props.obj;

      // Find the matching CRD spec for the kind of this resource in the CSV.
      const ownedDefinitions = _.get(this.props.clusterServiceVersion, 'spec.customresourcedefinitions.owned', []);
      const reqDefinitions = _.get(this.props.clusterServiceVersion, 'spec.customresourcedefinitions.required', []);
      const thisDefinition = _.find(ownedDefinitions.concat(reqDefinitions), (def) => def.name.split('.')[0] === this.props.kindObj.path);
      const statusDescriptors = _.get<StatusDescriptor[]>(thisDefinition, 'statusDescriptors', []);
      const specDescriptors = _.get<SpecDescriptor[]>(thisDefinition, 'specDescriptors', []);

      // Find the important metrics and prometheus endpoints, if any.
      const metricsDescriptor = descriptorFor(statusDescriptors, ALMStatusDescriptors.importantMetrics);
      const promDescriptor = descriptorFor(statusDescriptors, ALMStatusDescriptors.prometheus);
      const podStatusesDescriptor = descriptorFor(statusDescriptors, ALMStatusDescriptors.podStatuses);

      const metricsValue = blockValue(metricsDescriptor, status);

      return <div className="co-clusterserviceversion-resource-details co-m-pane">
        <div className="co-m-pane__body">
          <h2 className="co-section-heading">{`${thisDefinition ? thisDefinition.displayName : kind} Overview`}</h2>
          <div className="row">
            { podStatusesDescriptor && <div className="col-sm-6 col-md-4"><PodStatusChart statusDescriptor={podStatusesDescriptor} fetcher={() => blockValue(podStatusesDescriptor, status)} /></div> }
            { metricsValue && metricsValue.queries.map((query: ClusterServiceVersionPrometheusQuery, i) => (
              <div key={i} className="col-sm-6 col-md-4 co-clusterserviceversion-resource-details__section__metric">
                <ClusterServiceVersionPrometheusGraph query={query} basePath={blockValue(promDescriptor, status)} />
              </div>)) }
          </div>
        </div>
        <div className="co-m-pane__body">
          <div className="co-clusterserviceversion-resource-details__compact-expand">
            <CompactExpandButtons expand={this.state.expanded} onExpandChange={(expanded) => this.setState({expanded})} />
          </div>
          <div className="co-clusterserviceversion-resource-details__section co-clusterserviceversion-resource-details__section--info">
            <div className="row">
              <div className="col-xs-6">
                { this.state.expanded
                  ? <ResourceSummary resource={this.props.obj} showPodSelector={false} />
                  : <dl className="co-m-pane__details">
                    <dt>Name</dt>
                    <dd>{metadata.name}</dd>
                    <dt>Namespace</dt>
                    <dd><ResourceLink namespace="" kind="Namespace" name={metadata.namespace} title={metadata.namespace} /></dd>
                    <dt>Created At</dt>
                    <dd><Timestamp timestamp={metadata.creationTimestamp} /></dd>
                  </dl> }
              </div>
              { specDescriptors.map((specDescriptor: SpecDescriptor, i) => <div key={i} className="col-xs-6">
                <ClusterServiceVersionResourceSpec namespace={metadata.namespace} resource={this.props.obj} kindObj={this.props.kindObj} specValue={blockValue(specDescriptor, spec)} specDescriptor={specDescriptor} />
              </div>) }

              { statusDescriptors.filter(descriptor => !isMainDescriptor(descriptor))
                .map((statusDescriptor: StatusDescriptor) => {
                  const statusValue = blockValue(statusDescriptor, status);
                  return !_.isEmpty(statusValue) || _.isNumber(statusValue) || this.state.expanded
                    ? <div className="col-xs-6" key={statusDescriptor.path}>
                      <ClusterServiceVersionResourceStatus namespace={metadata.namespace} statusDescriptor={statusDescriptor} statusValue={statusValue} />
                    </div>
                    : null;
                }) }
            </div>
          </div>
        </div>
      </div>;
    }
  });

export const ClusterServiceVersionResourcesDetailsPage: React.SFC<ClusterServiceVersionResourcesDetailsPageProps> = (props) => <DetailsPage
  {...props}
  resources={[
    {kind: referenceForModel(ClusterServiceVersionModel), name: props.match.params.appName, namespace: props.namespace, isList: false, prop: 'csv'},
  ]}
  menuActions={Cog.factory.common}
  breadcrumbsFor={() => [
    {name: props.match.params.appName, path: `${props.match.url.split('/').filter((v, i) => i <= props.match.path.split('/').indexOf(':appName')).join('/')}/instances`},
    {name: `${kindForReference(props.kind)} Details`, path: `${props.match.url}`},
  ]}
  pages={[
    navFactory.details((detailsProps) => <ClusterServiceVersionResourceDetails {...detailsProps} clusterServiceVersion={detailsProps.csv} appName={props.match.params.appName} />),
    navFactory.editYaml(),
    // eslint-disable-next-line react/display-name
    {name: 'Resources', href: 'resources', component: (resourcesProps) => <Resources {...resourcesProps} clusterServiceVersion={resourcesProps.csv} />},
  ]}
/>;

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
  inFlight?: boolean;
};

export type ClusterServiceVersionResourcesDetailsProps = {
  obj: ClusterServiceVersionResourceKind;
  appName: string;
  kindObj: K8sKind;
  clusterServiceVersion: ClusterServiceVersionKind;
};

export type ClusterServiceVersionResourcesDetailsPageProps = {
  kind: GroupVersionKind;
  name: string;
  namespace: string;
  match: match<any>;
};

export type CSVResourceDetailsProps = {
  csv?: {data: ClusterServiceVersionKind};
  kind: GroupVersionKind;
  name: string;
  namespace: string;
  match: match<{appName: string}>;
};

export type ClusterServiceVersionResourcesDetailsState = {
  expanded: boolean;
};

export type ClusterServiceVersionResourceLinkProps = {
  obj: ClusterServiceVersionResourceKind;
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
ClusterServiceVersionResourcesDetailsPage.displayName = 'ClusterServiceVersionResourcesDetailsPage';
Resources.displayName = 'Resources';
