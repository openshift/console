/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import { Link } from 'react-router-dom';
import * as _ from 'lodash';

import { ClusterServiceVersionResourceKind, CustomResourceDefinitionKind, ALMStatusDescriptors, ClusterServiceVersionKind } from './index';
import { List, MultiListPage, ListHeader, ColHead, DetailsPage, CompactExpandButtons } from '../factory';
import { ResourceLink, ResourceSummary, StatusBox, navFactory, Timestamp, LabelList, humanizeNumber, ResourceIcon } from '../utils';
import { connectToPlural, K8sKind, connectToKinds } from '../../kinds';
import { k8sGet, k8sKinds } from '../../module/k8s';
import { Gauge, Scalar, Line, Bar } from '../graphs';

export const ClusterServiceVersionResourceStatus: React.StatelessComponent<ClusterServiceVersionResourceStatusProps> = (props) => {
  const {statusDescriptor, statusValue} = props;
  const descriptors = statusDescriptor['x-descriptors'] || [];
  if (statusValue === null || statusValue === undefined) {
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
      default:
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
  const {namespace, labels, name} = props.obj.metadata;

  return <span className="co-resource-link">
    <ResourceIcon kind={props.obj.kind} />
    <Link to={`/ns/${namespace}/clusterserviceversion-v1s/${labels['operated-by']}/${props.kindObj.plural}/${name}/details`}>{name}</Link>
  </span>;
});

export const ClusterServiceVersionResourceRow: React.StatelessComponent<ClusterServiceVersionResourceRowProps> = (props) => {
  const {obj} = props;

  return <div className="row co-resource-list__item">
    <div className="col-xs-2">
      <ClusterServiceVersionResourceLink obj={obj} kind={obj.kind} />
    </div>
    <div className="col-xs-2">
      <LabelList kind={obj.kind} labels={obj.metadata.labels} />
    </div>
    <div className="col-xs-2">
      {obj.kind}
    </div>
    <div className="col-xs-2">
      {/* FIXME(alecmerdler): Get actual status */}
      {'Running'}
    </div>
    <div className="col-xs-2">
      {obj.spec.version || 'None'}
    </div>
    <div className="col-xs-2">
      <Timestamp timestamp={obj.metadata.creationTimestamp} />
    </div>
  </div>;
};

export const ClusterServiceVersionResourceList: React.StatelessComponent<ClusterServiceVersionResourceListProps> = (props) => (
  <List {...props} Header={ClusterServiceVersionResourceHeader} Row={ClusterServiceVersionResourceRow} />
);

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

export const ClusterServiceVersionResourcesPage: React.StatelessComponent<ClusterServiceVersionResourcesPageProps> = (props) => {
  const resources = props.data ? props.data.map((resource) => ({kind: resource.spec.names.kind, namespaced: true})) : [];

  return props.loaded && props.data.length > 0
    ? <MultiListPage
      {...props}
      createButtonText="New resource"
      ListComponent={ClusterServiceVersionResourceList}
      filterLabel="Resources by name"
      resources={resources}
      flatten={(resources) => _.flatMap(resources, (resource: any) => _.map(resource.data, item => item))}
      rowFilters={[{
        type: 'clusterserviceversion-resource-kind',
        selected: props.data.map((resource) => resource.spec.names.kind),
        reducer: (obj) => obj.kind,
        items: props.data.map((resource) => ({id: resource.spec.names.kind, title: resource.spec.names.kind})),
      }]}
    />
    : <StatusBox label="Application Resources" loaded={props.loaded} />;
};

export const ClusterServiceVersionResourceDetails = connectToPlural(
  class ClusterServiceVersionResourceDetailsComponent extends React.Component<ClusterServiceVersionResourcesDetailsProps, ClusterServiceVersionResourcesDetailsState> {
    constructor(props) {
      super(props);
      this.state = {clusterServiceVersion: null, expanded: false};

      // Fetch CSV that defines metadata associated with current app resource using the `alm-status-descriptors` label.
      const {metadata} = props.obj;
      if (metadata.labels['alm-status-descriptors']) {
        k8sGet(k8sKinds['ClusterServiceVersion-v1'], metadata.labels['alm-status-descriptors'], metadata.namespace).then((result) => {
          this.setState({clusterServiceVersion: result, expanded: this.state.expanded});
        });
      }
    }

    public render() {
      const isFilteredDescriptor = (kind: ALMStatusDescriptors) => {
        switch (kind) {
          case ALMStatusDescriptors.importantMetrics:
          case ALMStatusDescriptors.prometheus:
            return true;
        }

        return false;
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

      const metricsValue = getStatusValue(metricsDescriptor, status);
      const promBasePath = getStatusValue(promDescriptor, status);

      return <div className="co-clusterserviceversion-resource-details co-m-pane">
        <div className="co-m-pane__body">
          <h1 className="co-section-title">{`${title} Overview`}</h1>
          { metricsValue
            ? <div className="row">{ metricsValue.queries.map((query: ClusterServiceVersionPrometheusQuery) => (
              <div key={query.query} className="col-xs-3 co-clusterserviceversion-resource-details__section__metric">
                <ClusterServiceVersionPrometheusGraph query={query} basePath={promBasePath} />
              </div>)) }
            </div>
            : <div className="text-muted">No metrics defined</div> }
        </div>
        <div className="co-m-pane__body">
          <div className="co-clusterserviceversion-resource-details__section co-clusterserviceversion-resource-details__section--info">
            <div className="row">
              <div className="col-xs-12" style={{paddingBottom: '20px'}}>
                <div className="pull-right">
                  <CompactExpandButtons expand={this.state.expanded} onExpandChange={(expanded) => this.setState({expanded})} />
                </div>
              </div>
            </div>
            <div className="row">
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
                const showStatus = statusValue != null;
                return showStatus ? <div className="col-xs-6" key={statusDescriptor.path}><ClusterServiceVersionResourceStatus statusDescriptor={statusDescriptor} statusValue={statusValue} /></div> : null;
              }) }
              { filteredStatusDescriptors.map((statusDescriptor: ClusterServiceVersionResourceStatusDescriptor) => {
                const statusValue = getStatusValue(statusDescriptor, status);
                const showStatus = statusValue === undefined && this.state.expanded;
                return showStatus ? <div className="col-xs-6 text-muted" key={statusDescriptor.path}><ClusterServiceVersionResourceStatus statusDescriptor={statusDescriptor} statusValue={statusValue} /></div> : null;
              }) }
            </div>
          </div>
        </div>
      </div>;
    }
  });

export const ClusterServiceVersionResourcesDetailsPage: React.StatelessComponent<ClusterServiceVersionResourcesDetailsPageProps> = (props) => <DetailsPage
  {...props}
  pages={[
    navFactory.details(ClusterServiceVersionResourceDetails),
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

export type ClusterServiceVersionResourceStatusProps = {
  statusDescriptor: ClusterServiceVersionResourceStatusDescriptor;
  statusValue: any;
};

export type ClusterServiceVersionResourcesPageProps = {
  data: CustomResourceDefinitionKind[]
  loaded: boolean;
  appType: ClusterServiceVersionKind;
};

export type ClusterServiceVersionResourcesDetailsProps = {
  obj: ClusterServiceVersionResourceKind;
  kindObj: K8sKind;
  kindsInFlight: boolean;
};

export type ClusterServiceVersionResourcesDetailsPageProps = {
  kind: string;
  name: string;
  namespace: string;
};

export type ClusterServiceVersionResourcesDetailsState = {
  clusterServiceVersion: ClusterServiceVersionKind;
  expanded: boolean;
};

export type ClusterServiceVersionResourceLinkProps = {
  obj: ClusterServiceVersionResourceKind;
  kindObj: K8sKind;
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

