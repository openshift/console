/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import { Link, match } from 'react-router-dom';
import * as _ from 'lodash';
import { connect } from 'react-redux';
import { Map as ImmutableMap } from 'immutable';

import { ClusterServiceVersionResourceKind, CustomResourceDefinitionKind, ALMStatusDescriptors, ClusterServiceVersionKind } from './index';
import { List, MultiListPage, ListHeader, ColHead, DetailsPage, CompactExpandButtons } from '../factory';
import { ResourceLink, ResourceSummary, StatusBox, navFactory, Timestamp, LabelList, humanizeNumber, ResourceIcon, MsgBox, ResourceCog, Cog } from '../utils';
import { connectToPlural, K8sKind, connectToKinds } from '../../kinds';
import { k8sGet, k8sKinds } from '../../module/k8s';
import { Gauge, Scalar, Line, Bar, Donut } from '../graphs';

export const PodStatusChart: React.StatelessComponent<PodStatusChartProps> = (props) => {
  const {statusDescriptor, fetcher} = props;
  const donutFetcher = () => {
    const fetched = fetcher();
    const values = Object.keys(fetched).map((key) => fetched[key].length);
    const labels = Object.keys(fetched);
    return Promise.resolve([values, labels]);
  };

  return <Donut fetch={donutFetcher} kind={statusDescriptor.path} title={statusDescriptor.displayName} />;
};

export const isFilledStatusValue = (value: string) => {
  return value !== undefined && value !== null && value !== '';
};

export const Phase: React.StatelessComponent<PhaseProps> = ({status}) => {
  if (status) {
    if (status === 'Failed') {
      return <span><i className="fa fa-ban phase-failed-icon" />&nbsp;{status}</span>;
    }
    return <span>{status}</span>;
  }
};

export const ClusterServiceVersionResourceStatus: React.StatelessComponent<ClusterServiceVersionResourceStatusProps> = (props) => {
  const {statusDescriptor, statusValue, namespace} = props;
  const descriptors = statusDescriptor['x-descriptors'] || [];
  if (!isFilledStatusValue(statusValue)) {
    return <dl>
      <dt>{statusDescriptor.displayName}</dt>
      <dd>None</dd>
    </dl>;
  }

  const valueElm = descriptors.reduce((result, statusCapability) => {
    switch (statusCapability) {
      case ALMStatusDescriptors.conditions:
        return <span>
          {statusValue.reduce((latest, next) => new Date(latest.lastUpdateTime) < new Date(next.lastUpdateTime) ? latest : next).phase}
        </span>;
      case ALMStatusDescriptors.tectonicLink:
      case ALMStatusDescriptors.w3Link:
        return <a href={statusValue}>{statusValue.replace(/https?:\/\//, '')}</a>;
      case ALMStatusDescriptors.k8sPhase:
        return <Phase status={statusValue} />;
      case ALMStatusDescriptors.k8sPhaseReason:
        return <pre>{statusValue}</pre>;
      default:
        if (statusCapability.startsWith(ALMStatusDescriptors.k8sResourcePrefix)) {
          let kind = statusCapability.substr(ALMStatusDescriptors.k8sResourcePrefix.length);
          return <ResourceLink kind={kind} name={statusValue} namespace={namespace} title={statusValue}/>;
        }

        return result;
    }
  }, <span>{statusValue || 'None'}</span>);

  return <dl>
    <dt>{statusDescriptor.displayName}</dt>
    <dd>{valueElm}</dd>
  </dl>;
};

export const ClusterServiceVersionResourceHeader: React.StatelessComponent<ClusterServiceVersionResourceHeaderProps> = (props) => <ListHeader>
  <ColHead {...props} className="col-xs-2" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-xs-2" sortField="metadata.labels">Labels</ColHead>
  <ColHead {...props} className="col-xs-2" sortField="kind">Type</ColHead>
  <ColHead {...props} className="col-xs-2">Status</ColHead>
  <ColHead {...props} className="col-xs-2">Version</ColHead>
  <ColHead {...props} className="col-xs-2">Last Updated</ColHead>
</ListHeader>;

export const ClusterServiceVersionResourceLink = connectToKinds()((props: ClusterServiceVersionResourceLinkProps) => {
  const {namespace, name} = props.obj.metadata;
  // FIXME(alecmerdler): Hack to pass the CSV name without using labels (/ns/:ns/clusterserviceversion-v1s/:appName/:plural/:name)
  const appName = location.pathname.split('/')[4];

  return <span className="co-resource-link">
    <ResourceIcon kind={props.obj.kind} />
    <Link to={`/ns/${namespace}/clusterserviceversion-v1s/${appName}/${props.kindObj.plural}/${name}`}>{name}</Link>
  </span>;
});

export const ClusterServiceVersionResourceRow: React.StatelessComponent<ClusterServiceVersionResourceRowProps> = (props) => {
  const {obj} = props;

  return <div className="row co-resource-list__item">
    <div className="col-xs-2">
      <ResourceCog actions={Cog.factory.common} kind={obj.kind} resource={obj} isDisabled={false} />
      <ClusterServiceVersionResourceLink obj={obj} kind={obj.kind} />
    </div>
    <div className="col-xs-2">
      <LabelList kind={obj.kind} labels={obj.metadata.labels} />
    </div>
    <div className="col-xs-2">
      {obj.kind}
    </div>
    <div className="col-xs-2">
      {obj.status.phase || <div className="text-muted">Unknown</div>}
    </div>
    <div className="col-xs-2">
      {obj.spec.version || 'None'}
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

const stateToProps = ({k8s}, {obj}) => ({
  data: _.values(k8s.getIn(['customresourcedefinitions', 'data'], ImmutableMap()).toJS())
    .filter((crd: CustomResourceDefinitionKind) => {
      const required = (obj.spec.customresourcedefinitions.required || []).map(crd => crd.name);
      const owned = (obj.spec.customresourcedefinitions.owned || []).map(crd => crd.name);
      return required.concat(owned).indexOf(crd.metadata.name) > -1;
    }),
});

export const ClusterServiceVersionResourcesPage = connect(stateToProps)((props: ClusterServiceVersionResourcesPageProps) => {
  const resources = props.data ? props.data.map((resource) => ({kind: resource.spec.names.kind, namespaced: true})) : [];
  const EmptyMsg = () => <MsgBox title="No Application Resources Defined" detail="This application was not properly installed or configured." />;

  const createLink = (name: string) => `/ns/${props.obj.metadata.namespace}/clusterserviceversion-v1s/${props.obj.metadata.name}/${name.split('.')[0]}/new`;
  const createProps = props.obj.spec.customresourcedefinitions.owned.length > 1
    ? {items: props.obj.spec.customresourcedefinitions.owned.reduce((acc, crd) => ({...acc, [crd.name]: crd.displayName}), {}), createLink}
    : {to: createLink(props.obj.spec.customresourcedefinitions.owned[0].name)};
  const rowFilters = [{
    type: 'clusterserviceversion-resource-kind',
    selected: props.data.map((resource) => resource.spec.names.kind),
    reducer: (obj) => obj.kind,
    items: props.data.map((resource) => ({id: resource.spec.names.kind, title: resource.spec.names.kind})),
  }];

  return props.loaded && props.data.length > 0
    ? <MultiListPage
      {...props}
      ListComponent={ClusterServiceVersionResourceList}
      filterLabel="Resources by name"
      resources={resources}
      namespace={props.obj.metadata.namespace}
      canCreate={true}
      createProps={createProps}
      createButtonText={props.obj.spec.customresourcedefinitions.owned.length > 1 ? 'Create New' : `Create ${props.obj.spec.customresourcedefinitions.owned[0].displayName}`}
      flatten={(resources) => _.flatMap(resources, (resource: any) => _.map(resource.data, item => item))}
      rowFilters={props.data.length > 1 ? rowFilters : null}
    />
    : <StatusBox loaded={props.loaded} EmptyMsg={EmptyMsg} />;
});

export const ClusterServiceVersionResourceDetails = connectToPlural(
  class ClusterServiceVersionResourceDetailsComponent extends React.Component<ClusterServiceVersionResourcesDetailsProps, ClusterServiceVersionResourcesDetailsState> {
    constructor(props) {
      super(props);
      this.state = {clusterServiceVersion: null, expanded: false};

      if (!_.isEmpty(props.appName)) {
        k8sGet(k8sKinds['ClusterServiceVersion-v1'], this.props.appName, props.obj.metadata.namespace).then((clusterServiceVersion) => {
          this.setState({clusterServiceVersion, expanded: this.state.expanded});
        });
      }
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

      const getStatusValue = (statusDescriptor: ClusterServiceVersionResourceStatusDescriptor, statusBlock) => {
        if (statusDescriptor === undefined) {
          return undefined;
        }

        const statusValue = _.get(statusBlock, statusDescriptor.path);
        if (statusValue === undefined) {
          return statusDescriptor.value;
        }

        return statusValue;
      };

      const findStatusDescriptorWithCapability = (statusDescriptors, capability) => {
        return _.find<ClusterServiceVersionResourceStatusDescriptor>(statusDescriptors, (descriptor) => {
          return _.find(descriptor['x-descriptors'], (cap) => cap === capability) !== undefined;
        });
      };

      const {kind, metadata, spec, status} = this.props.obj;
      const matchLabels = spec.selector ? _.map(spec.selector.matchLabels, (val, key) => `${key}=${val}`) : [];

      // Find the matching CRD spec for the kind of this resource in the CSV.
      const ownedDefinitions = _.get(this.state.clusterServiceVersion, 'spec.customresourcedefinitions.owned', []);
      const thisDefinition = _.find(ownedDefinitions, (def) => def.name.split('.')[0] === this.props.kindObj.path);
      const statusDescriptors = thisDefinition ? thisDefinition.statusDescriptors : [];
      const title = thisDefinition ? thisDefinition.displayName : kind;

      const filteredStatusDescriptors = _.filter(statusDescriptors, (descriptor) => {
        return _.find(descriptor['x-descriptors'], isFilteredDescriptor) === undefined;
      });

      // Find the important metrics and prometheus endpoints, if any.
      const metricsDescriptor = findStatusDescriptorWithCapability(statusDescriptors, ALMStatusDescriptors.importantMetrics);
      const promDescriptor = findStatusDescriptorWithCapability(statusDescriptors, ALMStatusDescriptors.prometheus);
      const podStatusesDescriptor = findStatusDescriptorWithCapability(statusDescriptors, ALMStatusDescriptors.podStatuses);

      const metricsValue = getStatusValue(metricsDescriptor, status);
      const promBasePath = getStatusValue(promDescriptor, status);
      const podStatusesFetcher = () => getStatusValue(podStatusesDescriptor, status);

      return <div className="co-clusterserviceversion-resource-details co-m-pane">
        <div className="co-m-pane__body">
          <h1 className="co-section-title">{`${title} Overview`}</h1>
          <div className="row">
            { !podStatusesDescriptor && !metricsValue ? <div className="text-muted">No metrics defined</div> : null }
            { podStatusesDescriptor ? <div className="col-xs-3"><PodStatusChart statusDescriptor={podStatusesDescriptor} fetcher={podStatusesFetcher} /></div> : null }
            { metricsValue
              ? metricsValue.queries.map((query: ClusterServiceVersionPrometheusQuery) => (
                <div key={query.query} className="col-xs-3 co-clusterserviceversion-resource-details__section__metric">
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
              { matchLabels.length > 0 && <div className="col-xs-6">
                <dt>Resources</dt>
                <dd>
                  <Link to={`/ns/${metadata.namespace}/search?q=${matchLabels.map(pair => `${pair},`)}`} title="View resources">
                    View resources
                  </Link>
                </dd>
              </div> }
              { filteredStatusDescriptors.map((statusDescriptor: ClusterServiceVersionResourceStatusDescriptor) => {
                const statusValue = getStatusValue(statusDescriptor, status);
                const showStatus = isFilledStatusValue(statusValue);
                return showStatus ? <div className="col-xs-6" key={statusDescriptor.path}><ClusterServiceVersionResourceStatus namespace={metadata.namespace} statusDescriptor={statusDescriptor} statusValue={statusValue} /></div> : null;
              }) }
              { filteredStatusDescriptors.map((statusDescriptor: ClusterServiceVersionResourceStatusDescriptor) => {
                const statusValue = getStatusValue(statusDescriptor, status);
                const showStatus = !isFilledStatusValue(statusValue) && this.state.expanded;
                return showStatus ? <div className="col-xs-6 text-muted" key={statusDescriptor.path}><ClusterServiceVersionResourceStatus namespace={metadata.namespace} statusDescriptor={statusDescriptor} statusValue={statusValue} /></div> : null;
              }) }
            </div>
          </div>
        </div>
      </div>;
    }
  });

export const ClusterServiceVersionResourcesDetailsPage: React.StatelessComponent<ClusterServiceVersionResourcesDetailsPageProps> = (props) => <DetailsPage
  {...props}
  menuActions={Cog.factory.common}
  breadcrumbs={[
    {name: props.match.params.appName, path: `${props.match.url.split('/').filter((_, i) => i <= props.match.path.split('/').indexOf(':appName')).join('/')}`},
    {name: `${props.kind} Details`, path: `${props.match.url}`},
  ]}
  pages={[
    navFactory.details((props) => <ClusterServiceVersionResourceDetails {...props} appName={props.match.params.appName} />),
    navFactory.editYaml(),
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

export type ClusterServiceVersionResourceStatusDescriptor = {
  path: string;
  displayName: string;
  description: string;
  'x-descriptors': string[];
  value?: any;
};

export type PodStatusChartProps = {
  statusDescriptor: ClusterServiceVersionResourceStatusDescriptor;
  fetcher: () => any;
};

export type ClusterServiceVersionResourceStatusProps = {
  statusDescriptor: ClusterServiceVersionResourceStatusDescriptor;
  statusValue: any;
  namespace?: string;
};

export type ClusterServiceVersionResourcesPageProps = {
  data: CustomResourceDefinitionKind[];
  loaded: boolean;
  obj: ClusterServiceVersionKind;
};

export type ClusterServiceVersionResourcesDetailsProps = {
  obj: ClusterServiceVersionResourceKind;
  appName: string;
  kindObj: K8sKind;
  kindsInFlight: boolean;
};

export type ClusterServiceVersionResourcesDetailsPageProps = {
  kind: string;
  name: string;
  namespace: string;
  match: match<any>;
};

export type ClusterServiceVersionResourcesDetailsState = {
  clusterServiceVersion: ClusterServiceVersionKind;
  expanded: boolean;
};

export type ClusterServiceVersionResourceLinkProps = {
  obj: ClusterServiceVersionResourceKind;
  kindObj: K8sKind;
};

export type PhaseProps = {
  status: string;
};

// TODO(alecmerdler): Find Webpack loader/plugin to add `displayName` to React components automagically
ClusterServiceVersionResourceList.displayName = 'ClusterServiceVersionResourceList';
ClusterServiceVersionResourceHeader.displayName = 'ClusterServiceVersionResourceHeader';
ClusterServiceVersionResourceRow.displayName = 'ClusterServiceVersionResourceRow';
ClusterServiceVersionResourceStatus.displayName = 'ClusterServiceVersionResourceStatus';
ClusterServiceVersionResourceDetails.displayName = 'ClusterServiceVersionResourceDetails';
ClusterServiceVersionResourcesDetailsPage.displayName = 'ClusterServiceVersionResourcesDetailsPage';
ClusterServiceVersionResourceList.displayName = 'ClusterServiceVersionResourceList';
ClusterServiceVersionPrometheusGraph.displayName = 'ClusterServiceVersionPrometheusGraph';
ClusterServiceVersionResourceLink.displayName = 'ClusterServiceVersionResourceLink';
ClusterServiceVersionResourcesPage.displayName = 'ClusterServiceVersionResourcesPage';

