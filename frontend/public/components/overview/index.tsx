import * as _ from 'lodash-es';
import * as classnames from 'classnames';
import * as fuzzy from 'fuzzysearch';
import * as React from 'react';
import { connect } from 'react-redux';
import { CSSTransition } from 'react-transition-group';
import { Link } from 'react-router-dom';
import {
  DEFAULT_GROUP_NAME,
  METRICS_POLL_INTERVAL,
  OverviewItem,
  getResourceList,
  createDaemonSetItems,
  createDeploymentConfigItems,
  createDeploymentItems,
  createPodItems,
  createStatefulSetItems,
  formatNamespacedRouteForResource,
} from '@console/shared';
import { OverviewCRD, isOverviewCRD, useExtensions } from '@console/plugin-sdk';
import { ClusterServiceVersionKind } from '@console/operator-lifecycle-manager';
import { coFetchJSON } from '../../co-fetch';
import { PROMETHEUS_TENANCY_BASE_PATH } from '../graphs';
import { TextFilter } from '../factory';
import * as UIActions from '../../actions/ui';
import { DeploymentKind, K8sResourceKind, PodKind, RouteKind } from '../../module/k8s';
import { CloseButton, Dropdown, Firehose, StatusBox, FirehoseResult, MsgBox } from '../utils';
import { ProjectOverview } from './project-overview';
import { ResourceOverviewPage } from './resource-overview-page';
import { OverviewSpecialGroup } from './constants';

const asOverviewGroups = (keyedItems: { [name: string]: OverviewItem[] }): OverviewGroup[] => {
  const compareGroups = (a: OverviewGroup, b: OverviewGroup) => {
    if (a.name === DEFAULT_GROUP_NAME) {
      return 1;
    }
    if (b.name === DEFAULT_GROUP_NAME) {
      return -1;
    }
    return a.name.localeCompare(b.name);
  };

  return _.map(
    keyedItems,
    (group: OverviewItem[], name: string): OverviewGroup => {
      return {
        name,
        items: group,
      };
    },
  ).sort(compareGroups);
};

const getApplication = (item: OverviewItem): string => {
  const labels = _.get(item, 'obj.metadata.labels') || {};
  return (
    labels['app.kubernetes.io/part-of'] ||
    labels['app.kubernetes.io/name'] ||
    labels.app ||
    DEFAULT_GROUP_NAME
  );
};

const groupByApplication = (items: OverviewItem[]): OverviewGroup[] => {
  const byApplication = _.groupBy(items, getApplication);
  return asOverviewGroups(byApplication);
};

const groupByResource = (items: OverviewItem[]): OverviewGroup[] => {
  const byResource = _.groupBy(items, (item) => _.startCase(item.obj.kind));
  return asOverviewGroups(byResource);
};

const groupByLabel = (items: OverviewItem[], label: string): OverviewGroup[] => {
  const byLabel = _.groupBy(
    items,
    (item): string => _.get(item, ['obj', 'metadata', 'labels', label]) || DEFAULT_GROUP_NAME,
  );
  return asOverviewGroups(byLabel);
};

const groupItems = (items: OverviewItem[], selectedGroup: string): OverviewGroup[] => {
  switch (selectedGroup) {
    case OverviewSpecialGroup.GROUP_BY_APPLICATION:
      return groupByApplication(items);
    case OverviewSpecialGroup.GROUP_BY_RESOURCE:
      return groupByResource(items);
    default:
      return groupByLabel(items, selectedGroup);
  }
};

const headingStateToProps = ({ UI }): OverviewHeadingPropsFromState => {
  const { selectedGroup, labels, filterValue } = UI.get('overview').toJS();
  return { labels, selectedGroup, filterValue };
};

const headingDispatchToProps = (dispatch): OverviewHeadingPropsFromDispatch => ({
  selectGroup: (group: OverviewSpecialGroup) =>
    dispatch(UIActions.updateOverviewSelectedGroup(group)),
  changeFilter: (value: string) => dispatch(UIActions.updateOverviewFilterValue(value)),
});

class OverviewHeading_ extends React.Component<OverviewHeadingProps> {
  componentWillUnmount() {
    // Resets the filter value so that it is not retained when navigating to other pages.
    this.props.changeFilter('');
  }

  render() {
    const { changeFilter, filterValue, labels, selectGroup, selectedGroup } = this.props;
    const firstLabel = _.first(labels) || '';
    const dropdownItems = {
      [OverviewSpecialGroup.GROUP_BY_APPLICATION]: 'Application',
      [OverviewSpecialGroup.GROUP_BY_RESOURCE]: 'Resource',
      ..._.zipObject(labels, labels),
    };

    return (
      <div className="co-m-pane__filter-bar">
        <div className="co-m-pane__filter-bar-group">
          <Dropdown
            className="btn-group"
            menuClassName="dropdown-menu--text-wrap"
            items={dropdownItems}
            onChange={selectGroup}
            titlePrefix="Group by"
            title={dropdownItems[selectedGroup] || 'Select Category'}
            spacerBefore={new Set([firstLabel])}
            headerBefore={{ [firstLabel]: 'Label' }}
          />
        </div>
        <div className="co-m-pane__filter-bar-group co-m-pane__filter-bar-group--filter">
          <TextFilter defaultValue={filterValue} label="by name" onChange={changeFilter} />
        </div>
      </div>
    );
  }
}

const OverviewHeading = connect<
  OverviewHeadingPropsFromState,
  OverviewHeadingPropsFromDispatch,
  OverviewHeadingOwnProps
>(
  headingStateToProps,
  headingDispatchToProps,
)(OverviewHeading_);

const mainContentStateToProps = ({ UI }): OverviewMainContentPropsFromState => {
  const { filterValue, metrics, selectedGroup, labels } = UI.get('overview').toJS();
  return { filterValue, labels, metrics, selectedGroup };
};

const mainContentDispatchToProps = (dispatch): OverviewMainContentPropsFromDispatch => ({
  updateLabels: (labels: string[]) => dispatch(UIActions.updateOverviewLabels(labels)),
  updateMetrics: (metrics: OverviewMetrics) => dispatch(UIActions.updateOverviewMetrics(metrics)),
  updateResources: (items: OverviewItem[]) => dispatch(UIActions.updateOverviewResources(items)),
  updateSelectedGroup: (group: OverviewSpecialGroup) =>
    dispatch(UIActions.updateOverviewSelectedGroup(group)),
});

class OverviewMainContent_ extends React.Component<
  OverviewMainContentProps,
  OverviewMainContentState
> {
  private metricsInterval: any = null;

  readonly state: OverviewMainContentState = {
    items: [],
    filteredItems: [],
    groupedItems: [],
    ...this.createOverviewData(),
  };

  componentDidMount(): void {
    this.fetchMetrics();
  }

  componentWillUnmount(): void {
    clearInterval(this.metricsInterval);
  }

  componentDidUpdate(prevProps: OverviewMainContentProps): void {
    const {
      builds,
      buildConfigs,
      daemonSets,
      deployments,
      deploymentConfigs,
      filterValue,
      loaded,
      namespace,
      pods,
      replicaSets,
      replicationControllers,
      routes,
      services,
      statefulSets,
      selectedGroup,
    } = this.props;

    if (
      namespace !== prevProps.namespace ||
      loaded !== prevProps.loaded ||
      !_.isEqual(buildConfigs, prevProps.buildConfigs) ||
      !_.isEqual(builds, prevProps.builds) ||
      !_.isEqual(daemonSets, prevProps.daemonSets) ||
      !_.isEqual(deploymentConfigs, prevProps.deploymentConfigs) ||
      !_.isEqual(deployments, prevProps.deployments) ||
      !_.isEqual(pods, prevProps.pods) ||
      !_.isEqual(replicaSets, prevProps.replicaSets) ||
      !_.isEqual(replicationControllers, prevProps.replicationControllers) ||
      !_.isEqual(routes, prevProps.routes) ||
      !_.isEqual(services, prevProps.services) ||
      !_.isEqual(statefulSets, prevProps.statefulSets)
    ) {
      this.setState(this.createOverviewData());
    } else if (filterValue !== prevProps.filterValue) {
      const filteredItems = this.filterItems(this.state.items);
      this.setState({
        filteredItems,
        groupedItems: groupItems(filteredItems, selectedGroup),
      });
    } else if (selectedGroup !== prevProps.selectedGroup) {
      this.setState({
        groupedItems: groupItems(this.state.filteredItems, selectedGroup),
      });
    }
    // Fetch new metrics when the namespace changes.
    if (namespace !== prevProps.namespace) {
      clearInterval(this.metricsInterval);
      this.fetchMetrics();
    }
  }

  fetchMetrics = (): void => {
    if (!PROMETHEUS_TENANCY_BASE_PATH) {
      return;
    }

    const { metrics: previousMetrics, namespace } = this.props;
    const queries = {
      memory: `sum(container_memory_working_set_bytes{namespace='${namespace}',container='',pod!=''}) BY (pod, namespace)`,
      cpu: `pod:container_cpu_usage:sum{namespace="${namespace}"}`,
    };

    const promises = _.map(queries, (query, name) => {
      const url = `${PROMETHEUS_TENANCY_BASE_PATH}/api/v1/query?namespace=${namespace}&query=${encodeURIComponent(
        query,
      )}`;
      return coFetchJSON(url).then(({ data: { result } }) => {
        const byPod: MetricValuesByPod = result.reduce((acc, { metric, value }) => {
          acc[metric.pod] = Number(value[1]);
          return acc;
        }, {});
        return { [name]: byPod };
      });
    });

    Promise.all(promises)
      .then((data) => {
        const metrics = data.reduce(
          (acc: OverviewMetrics, metric): OverviewMetrics => _.assign(acc, metric),
          {},
        );
        this.props.updateMetrics(metrics);
      })
      .catch((res) => {
        const status = _.get(res, 'response.status');
        // eslint-disable-next-line no-console
        console.error('Could not fetch metrics, status:', status);
        // Don't retry on some status codes unless a previous request succeeded.
        if (_.includes([401, 403, 502, 503], status) && _.isEmpty(previousMetrics)) {
          throw new Error(`Could not fetch metrics, status: ${status}`);
        }
      })
      .then(() => {
        this.metricsInterval = setTimeout(this.fetchMetrics, METRICS_POLL_INTERVAL);
      });
  };

  filterItems(items: OverviewItem[]): OverviewItem[] {
    const { filterValue, selectedItem } = this.props;

    if (!filterValue) {
      return items;
    }

    const filterString = filterValue.toLowerCase();
    return _.filter(items, (item) => {
      return (
        fuzzy(filterString, _.get(item, 'obj.metadata.name', '')) ||
        _.get(item, 'obj.metadata.uid') === _.get(selectedItem, 'obj.metadata.uid')
      );
    });
  }

  getLabels(items: OverviewItem[]): string[] {
    const labelSet = new Set<string>();
    _.each(items, (i: OverviewItem) => {
      const itemLabels = _.get(i, 'obj.metadata.labels') as K8sResourceKind['metadata']['labels'];
      _.each(itemLabels, (v: string, k: string) => labelSet.add(k));
    });
    return [...labelSet].sort();
  }

  createOverviewData(): OverviewMainContentState {
    const {
      loaded,
      mock,
      selectedGroup,
      updateLabels,
      updateSelectedGroup,
      updateResources,
    } = this.props;
    if (!loaded) {
      return;
    }
    // keeps deleted bookmarked projects from attempting to generate data
    if (mock) {
      return;
    }

    const items = [
      ...createDaemonSetItems(
        this.props.daemonSets.data,
        this.props,
        this.props?.clusterServiceVersions?.data,
        this.props.utils,
      ),
      ...createDeploymentItems(
        this.props.deployments.data,
        this.props,
        this.props?.clusterServiceVersions?.data,
        this.props.utils,
      ),
      ...createDeploymentConfigItems(
        this.props.deploymentConfigs.data,
        this.props,
        this.props?.clusterServiceVersions?.data,
        this.props.utils,
      ),
      ...createStatefulSetItems(
        this.props.statefulSets.data,
        this.props,
        this.props?.clusterServiceVersions?.data,
        this.props.utils,
      ),
      ...createPodItems(this.props),
    ];

    updateResources(items);

    const filteredItems = this.filterItems(items);
    const labels = this.getLabels(filteredItems);
    if (
      selectedGroup !== OverviewSpecialGroup.GROUP_BY_APPLICATION &&
      selectedGroup !== OverviewSpecialGroup.GROUP_BY_RESOURCE &&
      !_.includes(labels, selectedGroup)
    ) {
      updateSelectedGroup(OverviewSpecialGroup.GROUP_BY_APPLICATION);
    }

    updateLabels(labels);
    const groupedItems = groupItems(filteredItems, selectedGroup);
    return {
      filteredItems,
      groupedItems,
      items,
    };
  }

  render() {
    const { loaded, loadError, project, namespace, EmptyMsg, emptyBodyClass } = this.props;
    const { items, filteredItems, groupedItems } = this.state;
    const OverviewEmptyState = () => (
      <MsgBox
        title="No Workloads Found."
        detail={
          <div>
            <Link to={formatNamespacedRouteForResource('import', namespace)}>Import YAML</Link> or{' '}
            <Link to={`/add/ns/${namespace}`}>add other content</Link> to your project.
          </div>
        }
      />
    );

    const skeletonOverview = (
      <div className="skeleton-overview">
        <div className="skeleton-overview--head" />
        <div className="skeleton-overview--tile" />
        <div className="skeleton-overview--tile" />
        <div className="skeleton-overview--tile" />
      </div>
    );

    const hasItems = items?.length > 0;
    return (
      <div className="co-m-pane">
        {hasItems && <OverviewHeading project={_.get(project, 'data')} />}
        <div
          className={
            (!hasItems && emptyBodyClass) || 'co-m-pane__body co-m-pane__body--no-top-margin'
          }
        >
          <StatusBox
            skeleton={skeletonOverview}
            data={filteredItems}
            label="Resources"
            loaded={loaded}
            loadError={loadError}
            EmptyMsg={EmptyMsg || OverviewEmptyState}
          >
            <ProjectOverview groups={groupedItems} />
          </StatusBox>
        </div>
      </div>
    );
  }
}

const OverviewMainContent = connect<
  OverviewMainContentPropsFromState,
  OverviewMainContentPropsFromDispatch,
  OverviewMainContentOwnProps
>(
  mainContentStateToProps,
  mainContentDispatchToProps,
)(OverviewMainContent_);

const overviewStateToProps = ({ UI }): OverviewPropsFromState => {
  const selectedUID = UI.getIn(['overview', 'selectedUID']);
  const resources = UI.getIn(['overview', 'resources']);
  const selectedItem = !!resources && resources.get(selectedUID);
  return { selectedItem };
};

const overviewDispatchToProps = (dispatch): OverviewPropsFromDispatch => {
  return {
    dismissDetails: () => dispatch(UIActions.dismissOverviewDetails()),
  };
};

const Overview_: React.SFC<OverviewProps> = ({
  mock,
  match,
  selectedItem,
  title,
  dismissDetails,
  EmptyMsg,
  emptyBodyClass,
}) => {
  const resourceListExtensions = useExtensions<OverviewCRD>(isOverviewCRD);
  const namespace = _.get(match, 'params.name');
  const sidebarOpen = !_.isEmpty(selectedItem);
  const className = classnames('overview', { 'overview--sidebar-shown': sidebarOpen });
  const ref = React.useRef();
  const [height, setHeight] = React.useState(500);
  const calcHeight = (node) => {
    setHeight(
      document.getElementsByClassName('pf-c-page')[0].getBoundingClientRect().bottom -
        node.current.getBoundingClientRect().top,
    );
  };
  React.useLayoutEffect(() => {
    calcHeight(ref);
    const handleResize = () => calcHeight(ref);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  });

  const { resources, utils } = getResourceList(namespace, resourceListExtensions);
  resources.push({
    isList: false,
    kind: 'Project',
    name: namespace,
    prop: 'project',
  });
  return (
    <div className={className}>
      <div className="overview__main-column" ref={ref} style={{ height }}>
        <div className="overview__main-column-section">
          <Firehose resources={mock ? [] : resources}>
            <OverviewMainContent
              mock={mock}
              namespace={namespace}
              selectedItem={selectedItem}
              title={title}
              utils={utils}
              EmptyMsg={EmptyMsg}
              emptyBodyClass={emptyBodyClass}
            />
          </Firehose>
        </div>
      </div>
      {sidebarOpen && (
        <CSSTransition appear={true} in timeout={225} classNames="overview__sidebar">
          <div className="overview__sidebar">
            <div className="co-sidebar-dismiss clearfix">
              <CloseButton onClick={dismissDetails} />
            </div>
            <ResourceOverviewPage item={selectedItem} kind={selectedItem.obj.kind} />
          </div>
        </CSSTransition>
      )}
    </div>
  );
};

export const Overview = connect<
  OverviewPropsFromState,
  OverviewPropsFromDispatch,
  OverviewOwnProps
>(
  overviewStateToProps,
  overviewDispatchToProps,
)(Overview_);

export type PodOverviewItem = {
  obj: PodKind;
} & OverviewItem;

export type OverviewGroup = {
  name: string;
  items: OverviewItem[];
};

type MetricValuesByPod = {
  [podName: string]: number;
};

export type OverviewMetrics = {
  cpu?: MetricValuesByPod;
  memory?: MetricValuesByPod;
};

type OverviewHeadingPropsFromState = {
  filterValue: string;
  labels: string[];
  selectedGroup: string;
};

type OverviewHeadingPropsFromDispatch = {
  selectGroup: (selectedLabel: OverviewSpecialGroup) => void;
  changeFilter: (value: string) => void;
};

type OverviewHeadingOwnProps = {
  project: K8sResourceKind;
};

type OverviewHeadingProps = OverviewHeadingPropsFromState &
  OverviewHeadingPropsFromDispatch &
  OverviewHeadingOwnProps;

type OverviewMainContentPropsFromState = {
  filterValue: string;
  labels: string[];
  metrics: OverviewMetrics;
  selectedGroup: string;
};

type OverviewMainContentPropsFromDispatch = {
  updateLabels: (labels: string[]) => void;
  updateMetrics: (metrics: OverviewMetrics) => void;
  updateResources: (items: OverviewItem[]) => void;
  updateSelectedGroup: (group: OverviewSpecialGroup) => void;
};

type OverviewMainContentOwnProps = {
  builds?: FirehoseResult;
  buildConfigs?: FirehoseResult;
  daemonSets?: FirehoseResult;
  deploymentConfigs?: FirehoseResult;
  deployments?: FirehoseResult<DeploymentKind[]>;
  mock: boolean;
  loaded?: boolean;
  loadError?: any;
  namespace: string;
  pods?: FirehoseResult<PodKind[]>;
  project?: FirehoseResult<K8sResourceKind>;
  replicationControllers?: FirehoseResult;
  replicaSets?: FirehoseResult;
  routes?: FirehoseResult<RouteKind[]>;
  services?: FirehoseResult;
  selectedItem: OverviewItem;
  statefulSets?: FirehoseResult;
  title?: string;
  clusterServiceVersions?: FirehoseResult<ClusterServiceVersionKind[]>;
  utils?: Function[];
  EmptyMsg?: React.ComponentType;
  emptyBodyClass?: string;
};

export type OverviewMainContentProps = OverviewMainContentPropsFromState &
  OverviewMainContentPropsFromDispatch &
  OverviewMainContentOwnProps;

type OverviewMainContentState = {
  readonly items: any[];
  readonly filteredItems: any[];
  readonly groupedItems: any[];
};

type OverviewPropsFromState = {
  selectedItem: any;
};

type OverviewPropsFromDispatch = {
  dismissDetails: () => void;
};

type OverviewOwnProps = {
  mock: boolean;
  match: any;
  title: string;
  EmptyMsg?: React.ComponentType;
  emptyBodyClass?: string;
};

type OverviewProps = OverviewPropsFromState & OverviewPropsFromDispatch & OverviewOwnProps;
