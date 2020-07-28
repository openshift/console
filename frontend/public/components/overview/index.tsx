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
  createDeploymentConfigItems,
  createDeploymentItems,
  createWorkloadItems,
  createPodItems,
  createCronJobItems,
  getStandaloneJobs,
  formatNamespacedRouteForResource,
} from '@console/shared';
import {
  OverviewCRD,
  isOverviewCRD,
  OverviewResourceUtil,
  isOverviewResourceUtil,
  useExtensions,
} from '@console/plugin-sdk';
import { coFetchJSON } from '../../co-fetch';
import { PROMETHEUS_TENANCY_BASE_PATH } from '../graphs';
import { TextFilter } from '../factory';
import * as UIActions from '../../actions/ui';
import {
  CronJobKind,
  DeploymentKind,
  JobKind,
  K8sResourceKind,
  PodKind,
  RouteKind,
} from '../../module/k8s';
import { CloseButton, Dropdown, Firehose, StatusBox, FirehoseResult, MsgBox } from '../utils';
import { ProjectOverview } from './project-overview';
import { ResourceOverviewPage } from './resource-overview-page';
import { OverviewSpecialGroup } from './constants';
import { DaemonSetModel, JobModel, StatefulSetModel } from '../../models';
import { Alerts, Alert } from '../monitoring/types';
import { getAlertsAndRules } from '../monitoring/utils';

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
  const monitoringAlerts = UI.getIn(['monitoring', 'devAlerts']);
  return { filterValue, labels, metrics, selectedGroup, monitoringAlerts };
};

const mainContentDispatchToProps = (dispatch): OverviewMainContentPropsFromDispatch => ({
  updateLabels: (labels: string[]) => dispatch(UIActions.updateOverviewLabels(labels)),
  updateMetrics: (metrics: OverviewMetrics) => dispatch(UIActions.updateOverviewMetrics(metrics)),
  updateResources: (items: OverviewItem[]) => dispatch(UIActions.updateOverviewResources(items)),
  updateSelectedGroup: (group: OverviewSpecialGroup) =>
    dispatch(UIActions.updateOverviewSelectedGroup(group)),
  updateMonitoringAlerts: (alerts: Alert[]) =>
    dispatch(UIActions.monitoringLoaded('devAlerts', alerts, 'dev')),
});

class OverviewMainContent_ extends React.Component<
  OverviewMainContentProps,
  OverviewMainContentState
> {
  private metricsInterval: any = null;
  private monitoringAlertTimeout: any = null;

  readonly state: OverviewMainContentState = {
    items: [],
    filteredItems: [],
    groupedItems: [],
    ...this.createOverviewData(),
  };

  componentDidMount(): void {
    this.fetchMetrics();
    this.fetchMonitoringAlerts();
  }

  componentWillUnmount(): void {
    clearInterval(this.metricsInterval);
    clearInterval(this.monitoringAlertTimeout);
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
      jobs,
      cronJobs,
      replicaSets,
      replicationControllers,
      routes,
      services,
      statefulSets,
      selectedGroup,
      monitoringAlerts,
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
      !_.isEqual(jobs, prevProps.jobs) ||
      !_.isEqual(cronJobs, prevProps.cronJobs) ||
      !_.isEqual(replicaSets, prevProps.replicaSets) ||
      !_.isEqual(replicationControllers, prevProps.replicationControllers) ||
      !_.isEqual(routes, prevProps.routes) ||
      !_.isEqual(services, prevProps.services) ||
      !_.isEqual(statefulSets, prevProps.statefulSets) ||
      !_.isEqual(monitoringAlerts, prevProps.monitoringAlerts)
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
    // Fetch new metrics and monitoring alerts when the namespace changes.
    if (namespace !== prevProps.namespace) {
      clearInterval(this.metricsInterval);
      clearInterval(this.monitoringAlertTimeout);
      this.fetchMetrics();
      this.fetchMonitoringAlerts();
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

  fetchMonitoringAlerts(): void {
    const { namespace } = this.props;
    if (!PROMETHEUS_TENANCY_BASE_PATH) {
      return;
    }
    const poller = (): void => {
      coFetchJSON(`${PROMETHEUS_TENANCY_BASE_PATH}/api/v1/rules?namespace=${namespace}`)
        .then(({ data }) => {
          const alerts = getAlertsAndRules(data).alerts;
          this.props.updateMonitoringAlerts(alerts);
        })
        .catch((e) => {
          console.error(e); // eslint-disable-line no-console
        })
        .then(() => {
          this.monitoringAlertTimeout = setTimeout(poller, 15 * 1000);
        });
    };
    poller();
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
      ...createWorkloadItems(
        DaemonSetModel,
        this.props.daemonSets.data,
        this.props,
        this.props.utils,
      ),
      ...createDeploymentItems(this.props.deployments.data, this.props, this.props.utils),
      ...createDeploymentConfigItems(
        this.props.deploymentConfigs.data,
        this.props,
        this.props.utils,
      ),
      ...createWorkloadItems(
        StatefulSetModel,
        this.props.statefulSets.data,
        this.props,
        this.props.utils,
      ),
      ...createPodItems(this.props.pods.data, this.props),
      ...createCronJobItems(this.props.cronJobs.data, this.props, this.props.utils),
      ...createWorkloadItems(
        JobModel,
        getStandaloneJobs(this.props.jobs.data),
        this.props,
        this.props.utils,
      ),
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
  const overviewUtils = useExtensions<OverviewResourceUtil>(isOverviewResourceUtil);
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

  const resources = getResourceList(namespace, resourceListExtensions);
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
              utils={overviewUtils}
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
  monitoringAlerts: Alerts;
};

type OverviewMainContentPropsFromDispatch = {
  updateLabels: (labels: string[]) => void;
  updateMetrics: (metrics: OverviewMetrics) => void;
  updateResources: (items: OverviewItem[]) => void;
  updateSelectedGroup: (group: OverviewSpecialGroup) => void;
  updateMonitoringAlerts: (alerts: Alert[]) => void;
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
  jobs?: FirehoseResult<JobKind[]>;
  cronJobs?: FirehoseResult<CronJobKind[]>;
  project?: FirehoseResult<K8sResourceKind>;
  replicationControllers?: FirehoseResult;
  replicaSets?: FirehoseResult;
  routes?: FirehoseResult<RouteKind[]>;
  services?: FirehoseResult;
  selectedItem: OverviewItem;
  statefulSets?: FirehoseResult;
  title?: string;
  EmptyMsg?: React.ComponentType;
  emptyBodyClass?: string;
  utils?: OverviewResourceUtil[];
  monitoringAlerts?: Alerts;
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
