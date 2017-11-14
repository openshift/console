/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import { Link, match } from 'react-router-dom';
import * as _ from 'lodash';

import { ClusterServiceVersionResourceKind, K8sResourceKind, ALMStatusDescriptors, ALMSpecDescriptors, ClusterServiceVersionKind, OwnerReference } from './index';
import { List, MultiListPage, ListHeader, ColHead, DetailsPage, CompactExpandButtons } from '../factory';
import { ResourceLink, ResourceSummary, StatusBox, navFactory, Timestamp, LabelList, humanizeNumber, ResourceIcon, MsgBox, ResourceCog, Cog, LoadingInline } from '../utils';
import { connectToPlural, K8sKind, connectToKinds } from '../../kinds';
import { k8sGet, k8sKinds } from '../../module/k8s';
import { configureCountModal } from '../modals';
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

export const isFilledStatusValue = (value: string) => value !== undefined && value !== null && value !== '';

export const Phase: React.StatelessComponent<PhaseProps> = ({status}) => {
  if (status === 'Failed') {
    return <span><i className="fa fa-ban phase-failed-icon" />&nbsp;{status}</span>;
  }

  return <span>{status}</span>;
};

const configureSizeModal = (kindObj, resource, specDescriptor, specValue, wasChanged) => {
  return configureCountModal({
    resourceKind: kindObj,
    resource: resource,
    defaultValue: specValue || 0,
    title: `Modify ${specDescriptor.displayName}`,
    message: specDescriptor.description,
    path: `/spec/${specDescriptor.path}`,
    buttonText: `Update ${specDescriptor.displayName}`,
    invalidateState: (isInvalid) => {
      // NOTE: Necessary until https://github.com/kubernetes/kubernetes/pull/53345 fixes
      // WebSocket loading of the custom resources.
      if (isInvalid) {
        wasChanged();
      }
    },
  });
};

export class ClusterServiceVersionResourceModifier extends React.Component<ClusterServiceVersionResourceModifierProps, ClusterServiceVersionResourceModifierState> {
  constructor(props) {
    super(props);
    this.state = {changing: false};
  }

  render() {
    const {kindObj, resource, specDescriptor, specValue} = this.props;
    const descriptors = specDescriptor['x-descriptors'] || [];
    const wasChanged = () => this.setState({changing: true, });
    const controlElm = descriptors.reduce((result, specCapability) => {
      switch (specCapability) {
        case ALMSpecDescriptors.podCount:
          return <a onClick={() => configureSizeModal(kindObj, resource, specDescriptor, specValue, wasChanged)} className="co-m-modal-link">{specValue} pods</a>;
        default:
          return <span>(Unsupported)</span>;
      }
    }, <span />);

    return <dl>
      <dt>{specDescriptor.displayName}</dt>
      <dd>{this.state.changing ? <LoadingInline /> : controlElm}</dd>
    </dl>;
  }
}

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
      case ALMSpecDescriptors.podCount:
        return <span>{statusValue} pods</span>;
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
  const appName = location.pathname.split('/')[location.pathname.split('/').indexOf('clusterserviceversion-v1s') + 1];

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

export const ClusterServiceVersionResourcesPage: React.StatelessComponent<ClusterServiceVersionResourcesPageProps> = (props) => {
  const {obj} = props;
  const {owned = [], required = []} = obj.spec.customresourcedefinitions;
  const firehoseResources = owned.concat(required).map((crdDesc) => ({kind: crdDesc.kind, namespaced: true}));

  const EmptyMsg = () => <MsgBox title="No Application Resources Defined" detail="This application was not properly installed or configured." />;
  const createLink = (name: string) => `/ns/${obj.metadata.namespace}/clusterserviceversion-v1s/${obj.metadata.name}/${name.split('.')[0]}/new`;
  const createProps = owned.length > 1
    ? {items: owned.reduce((acc, crd) => ({...acc, [crd.name]: crd.displayName}), {}), createLink}
    : {to: createLink(owned.length > 0 ? owned[0].name : '')};

  const owners = (ownerRefs: OwnerReference[], items: K8sResourceKind[]) => ownerRefs.filter(({uid}) => items.filter(({metadata}) => metadata.uid === uid).length > 0);
  const flatten = (resources: {[kind: string]: {data: K8sResourceKind[]}}) => _.flatMap(resources, (resource) => _.map(resource.data, item => item))
    .filter(({kind, metadata}, _, allResources) => owned.filter(item => item.kind === kind).length > 0 || owners(metadata.ownerReferences || [], allResources).length > 0);

  const rowFilters = [{
    type: 'clusterserviceversion-resource-kind',
    selected: firehoseResources.map(({kind}) => kind),
    reducer: (obj) => obj.kind,
    items: firehoseResources.map(({kind}) => ({id: kind, title: kind})),
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

      const getBlockValue = (descriptor: ClusterServiceVersionResourceDescriptor, block) => {
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
      const matchLabels = spec.selector ? _.map(spec.selector.matchLabels, (val, key) => `${key}=${val}`) : [];

      // Find the matching CRD spec for the kind of this resource in the CSV.
      const ownedDefinitions = _.get(this.state.clusterServiceVersion, 'spec.customresourcedefinitions.owned', []);
      const thisDefinition = _.find(ownedDefinitions, (def) => def.name.split('.')[0] === this.props.kindObj.path);
      const statusDescriptors = thisDefinition ? thisDefinition.statusDescriptors : [];
      const specDescriptors = thisDefinition ? thisDefinition.specDescriptors : [];
      const title = thisDefinition ? thisDefinition.displayName : kind;

      const filteredStatusDescriptors = _.filter(statusDescriptors, (descriptor) => {
        return _.find(descriptor['x-descriptors'], isFilteredDescriptor) === undefined;
      });

      const findAssociatedSpecDescriptor = (statusDescriptor) => {
        return _.find<ClusterServiceVersionResourceSpecDescriptor>(specDescriptors, (descriptor) => descriptor.path === statusDescriptor.path);
      };

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
                const statusValue = getBlockValue(statusDescriptor, status);
                const showStatus = isFilledStatusValue(statusValue);
                const specDescriptor = findAssociatedSpecDescriptor(statusDescriptor);
                const specValue = getBlockValue(specDescriptor, spec);

                return showStatus ? <div className="col-xs-6" key={statusDescriptor.path}>
                  <ClusterServiceVersionResourceStatus namespace={metadata.namespace} statusDescriptor={statusDescriptor} statusValue={statusValue} />
                  { specDescriptor ? <ClusterServiceVersionResourceModifier namespace={metadata.namespace} resource={this.props.obj} kindObj={this.props.kindObj} specValue={specValue} specDescriptor={specDescriptor} /> : null }
                </div> : null;
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

export type ClusterServiceVersionResourceSpecDescriptor = {
  path: string;
  displayName: string;
  description: string;
  'x-descriptors': string[];
  value?: any;
};

export type ClusterServiceVersionResourceDescriptor = ClusterServiceVersionResourceStatusDescriptor | ClusterServiceVersionResourceSpecDescriptor;

export type PodStatusChartProps = {
  statusDescriptor: ClusterServiceVersionResourceStatusDescriptor;
  fetcher: () => any;
};

export type ClusterServiceVersionResourceStatusProps = {
  statusDescriptor: ClusterServiceVersionResourceStatusDescriptor;
  statusValue: any;
  namespace?: string;
};

export type ClusterServiceVersionResourceModifierProps = {
  kindObj: K8sKind;
  resource: ClusterServiceVersionResourceKind;
  specDescriptor: ClusterServiceVersionResourceSpecDescriptor;
  specValue?: any;
  namespace?: string;
};

export type ClusterServiceVersionResourcesPageProps = {
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

export type ClusterServiceVersionResourceModifierState = {
  changing: boolean;
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

