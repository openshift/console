/* eslint-disable no-unused-vars, no-undef */

import * as _ from 'lodash-es';
import * as classnames from 'classnames';
import * as fuzzy from 'fuzzysearch';
import * as React from 'react';
import { connect } from 'react-redux';
import { CSSTransition } from 'react-transition-group';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Toolbar, EmptyState } from 'patternfly-react';

import { coFetchJSON } from '../../co-fetch';
import { getBuildNumber } from '../../module/k8s/builds';
import { prometheusBasePath } from '../graphs';
import { TextFilter } from '../factory';
import { UIActions, formatNamespacedRouteForResource } from '../../ui/ui-actions';
import {
  K8sResourceKind,
  LabelSelector,
} from '../../module/k8s';
import {
  withStartGuide,
  WithStartGuideProps,
} from '../start-guide';
import {
  DaemonSetModel,
  DeploymentModel,
  DeploymentConfigModel,
  PodModel,
  ProjectModel,
  ReplicationControllerModel,
  ReplicaSetModel,
  StatefulSetModel,
} from '../../models';
import {
  ActionsMenu,
  CloseButton,
  KebabAction,
  Dropdown,
  Firehose,
  StatusBox,
  EmptyBox,
  resourceObjPath,
} from '../utils';

import { overviewMenuActions, OverviewNamespaceDashboard } from './namespace-overview';
import { ProjectOverview } from './project-overview';
import { ResourceOverviewPage } from './resource-overview-page';
import { PodStatus } from '../pod';

enum View {
  Resources = 'resources',
  Dashboard = 'dashboard',
}

// The following values should not be valid label keys to avoid conflicts.
// https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/#syntax-and-character-set
const GROUP_BY_APPLICATION = '#GROUP_BY_APPLICATION#';
const GROUP_BY_RESOURCE = '#GROUP_BY_RESOURCE#';
const EMPTY_GROUP_NAME = 'other resources';

const DEPLOYMENT_REVISION_ANNOTATION = 'deployment.kubernetes.io/revision';
const DEPLOYMENT_CONFIG_LATEST_VERSION_ANNOTATION = 'openshift.io/deployment-config.latest-version';
const DEPLOYMENT_PHASE_ANNOTATION = 'openshift.io/deployment.phase';
const TRIGGERS_ANNOTATION = 'image.openshift.io/triggers';
const METRICS_POLL_INTERVAL = 30 * 1000;

const asOverviewGroups = (keyedItems: { [name: string]: OverviewItem[] }): OverviewGroup[] => {
  const compareGroups = (a: OverviewGroup, b: OverviewGroup) => {
    if (a.name === EMPTY_GROUP_NAME) {
      return 1;
    }
    if (b.name === EMPTY_GROUP_NAME) {
      return -1;
    }
    return a.name.localeCompare(b.name);
  };

  return _.map(keyedItems, (group: OverviewItem[], name: string): OverviewGroup => {
    return {
      name,
      items: group,
    };
  }).sort(compareGroups);
};

const getApplication = (item: OverviewItem): string => {
  const labels = _.get(item, 'obj.metadata.labels') || {};
  return labels['app.kubernetes.io/part-of'] || labels['app.kubernetes.io/name'] || labels.app || EMPTY_GROUP_NAME;
};

const groupByApplication = (items: OverviewItem[]): OverviewGroup[] => {
  const byApplication = _.groupBy(items, getApplication);
  return asOverviewGroups(byApplication);
};

const groupByResource = (items: OverviewItem[]): OverviewGroup[] => {
  const byResource = _.groupBy(items, item => _.startCase(item.obj.kind));
  return asOverviewGroups(byResource);
};

const groupByLabel = (items: OverviewItem[], label: string): OverviewGroup[] => {
  const byLabel = _.groupBy(items, (item): string => _.get(item, ['obj', 'metadata', 'labels', label]) || EMPTY_GROUP_NAME);
  return asOverviewGroups(byLabel);
};

const groupItems = (items: OverviewItem[], selectedGroup: string): OverviewGroup[] => {
  switch (selectedGroup) {
    case GROUP_BY_APPLICATION:
      return groupByApplication(items);
    case GROUP_BY_RESOURCE:
      return groupByResource(items);
    default:
      return groupByLabel(items, selectedGroup);
  }
};

// List of container status waiting reason values that we should call out as errors in overview rows.
const CONTAINER_WAITING_STATE_ERROR_REASONS = ['CrashLoopBackOff', 'ErrImagePull', 'ImagePullBackOff'];

const getAnnotation = (obj: K8sResourceKind, annotation: string): string => {
  return _.get(obj, ['metadata', 'annotations', annotation]);
};

const getDeploymentRevision = (obj: K8sResourceKind): number => {
  const revision = getAnnotation(obj, DEPLOYMENT_REVISION_ANNOTATION);
  return revision && parseInt(revision, 10);
};

const getDeploymentConfigVersion = (obj: K8sResourceKind): number => {
  const version = getAnnotation(obj, DEPLOYMENT_CONFIG_LATEST_VERSION_ANNOTATION);
  return version && parseInt(version, 10);
};

const getAnnotatedTriggers = (obj: K8sResourceKind) => {
  const triggersJSON = getAnnotation(obj, TRIGGERS_ANNOTATION) || '[]';
  try {
    return JSON.parse(triggersJSON);
  } catch (e) {
    /* eslint-disable-next-line no-console */
    console.warn('Error parsing triggers annotation', e);
    return [];
  }
};

const getDeploymentPhase = (rc: K8sResourceKind): string => _.get(rc, ['metadata', 'annotations', DEPLOYMENT_PHASE_ANNOTATION]);

// Only show an alert once if multiple pods have the same error for the same owner.
const podAlertKey = (alert: any, pod: K8sResourceKind, containerName: string = 'all'): string => {
  const id = _.get(pod, 'metadata.ownerReferences[0].uid', pod.metadata.uid);
  return `${alert}--${id}--${containerName}`;
};

const getPodAlerts = (pod: K8sResourceKind): any => {
  const alerts = {};
  const statuses = [
    ..._.get(pod, 'status.initContainerStatuses', []),
    ..._.get(pod, 'status.containerStatuses', []),
  ];
  statuses.forEach(status => {
    const { name, state } = status;
    const waitingReason = _.get(state, 'waiting.reason');
    if (CONTAINER_WAITING_STATE_ERROR_REASONS.includes(waitingReason)) {
      const key = podAlertKey(waitingReason, pod, name);
      const message = state.waiting.message || waitingReason;
      alerts[key] = { severity: 'error', message };
    }
  });

  _.get(pod, 'status.conditions', []).forEach(condition => {
    const { type, status, reason, message } = condition;
    if (type === 'PodScheduled' && status === 'False' && reason === 'Unschedulable') {
      const key = podAlertKey(reason, pod, name);
      alerts[key] = {
        severity: 'error',
        message: `${reason}: ${message}`,
      };
    }
  });

  return alerts;
};

const combinePodAlerts = (pods: K8sResourceKind[]): any => _.reduce(pods, (acc, pod) => ({
  ...acc,
  ...getPodAlerts(pod),
}), {});

const getReplicationControllerAlerts = (rc: K8sResourceKind): any => {
  const phase = getDeploymentPhase(rc);
  const version = getDeploymentConfigVersion(rc);
  const label = _.isFinite(version) ? `#${version}` : rc.metadata.name;
  const key = `${rc.metadata.uid}--Rollout${phase}`;
  switch (phase) {
    case 'Cancelled':
      return {
        [key]: {
          severity: 'info',
          message: `Rollout ${label} was cancelled.`,
        },
      };
    case 'Failed':
      return {
        [key]: {
          severity: 'error',
          message: `Rollout ${label} failed.`,
        },
      };
    default:
      return {};
  }
};

const getOwnedResources = ({metadata:{uid}}: K8sResourceKind, resources: K8sResourceKind[]): K8sResourceKind[] => {
  return _.filter(resources, ({metadata:{ownerReferences}}) => {
    return _.some(ownerReferences, {
      uid,
      controller: true,
    });
  });
};

const sortByRevision = (replicators: K8sResourceKind[], getRevision: Function, descending: boolean = true): K8sResourceKind[] => {
  const compare = (left, right) => {
    const leftVersion = getRevision(left);
    const rightVersion = getRevision(right);
    if (!_.isFinite(leftVersion) && !_.isFinite(rightVersion)) {
      const leftName = _.get(left, 'metadata.name', '');
      const rightName = _.get(right, 'metadata.name', '');
      if (descending) {
        return rightName.localeCompare(leftName);
      }
      return leftName.localeCompare(rightName);
    }

    if (!leftVersion) {
      return descending ? 1 : -1;
    }

    if (!rightVersion) {
      return descending ? -1 : 1;
    }

    if (descending) {
      return rightVersion - leftVersion;
    }

    return leftVersion - rightVersion;
  };

  return _.toArray(replicators).sort(compare);
};

const sortReplicaSetsByRevision = (replicaSets: K8sResourceKind[]): K8sResourceKind[] => {
  return sortByRevision(replicaSets, getDeploymentRevision);
};

const sortReplicationControllersByRevision = (replicationControllers: K8sResourceKind[]): K8sResourceKind[] => {
  return sortByRevision(replicationControllers, getDeploymentConfigVersion);
};

const sortBuilds = (builds: K8sResourceKind[]): K8sResourceKind[] => {

  const byCreationTime = (left, right) => {
    const leftCreationTime = new Date(_.get(left, 'metadata.creationTimestamp', Date.now()));
    const rightCreationTime = new Date(_.get(right, 'metadata.creationTimestamp', Date.now()));
    return rightCreationTime.getMilliseconds() - leftCreationTime.getMilliseconds();
  };

  const byBuildNumber = (left, right) => {
    const leftBuildNumber = getBuildNumber(left);
    const rightBuildNumber = getBuildNumber(right);
    if (!_.isFinite(leftBuildNumber) || !_.isFinite(rightBuildNumber)) {
      return byCreationTime(left, right);
    }
    return rightBuildNumber - leftBuildNumber;
  };

  return builds.sort(byBuildNumber);
};

const reservedNSPrefixes = ['openshift-', 'kube-', 'kubernetes-'];
const isReservedNamespace = (ns: string) => ns === 'default' || ns === 'openshift' || reservedNSPrefixes.some(prefix => _.startsWith(ns, prefix));

const OverviewItemReadiness: React.SFC<OverviewItemReadinessProps> = ({desired = 0, href, ready = 0}) => (
  <Link to={href}>
    {ready} of {desired} pods
  </Link>
);

const overviewEmptyStateToProps = ({UI}) => ({
  activeNamespace: UI.get('activeNamespace'),
  resources: UI.getIn(['overview', 'resources']),
});

const OverviewEmptyState = connect(overviewEmptyStateToProps)(({activeNamespace, resources}) => {
  // Don't encourage users to add content to system namespaces.
  if (resources.isEmpty() && !isReservedNamespace(activeNamespace)) {
    return <EmptyState>
      <EmptyState.Title>
        Get started with your project.
      </EmptyState.Title>
      <EmptyState.Info>
        Add content to your project from the catalog of web frameworks, databases, and other components. You may also deploy an existing image or create resources using YAML definitions.
      </EmptyState.Info>
      <EmptyState.Action>
        <Link to="/catalog" className="btn btn-primary">
          Browse Catalog
        </Link>
      </EmptyState.Action>
      <EmptyState.Action secondary>
        <Link className="btn btn-default" to={`/deploy-image?preselected-ns=${activeNamespace}`}>
          Deploy Image
        </Link>
        <Link className="btn btn-default" to={formatNamespacedRouteForResource('import', activeNamespace)}>
          Import YAML
        </Link>
      </EmptyState.Action>
    </EmptyState>;
  }
  return <EmptyBox label="Resources" />;
});

const headingStateToProps = ({UI}): OverviewHeadingPropsFromState => {
  const selectedView = UI.getIn(['overview', 'selectedView']);
  return { selectedView };
};

const headingDispatchToProps = (dispatch): OverviewHeadingPropsFromDispatch => ({
  selectView: (view: View) => dispatch(UIActions.selectOverviewView(view)),
});

const OverviewHeading_: React.SFC<OverviewHeadingProps> = ({disabled, firstLabel = '', groupOptions, handleFilterChange = _.noop, handleGroupChange = _.noop, selectedGroup = '', selectView, selectedView, title, project}) => (
  <div className={classnames('co-m-nav-title co-m-nav-title--overview', { 'overview-filter-group': selectedView === View.Resources })}>
    {
      title &&
      <h1 className="co-m-pane__heading co-m-pane__heading--overview">
        <div className="co-m-pane__name co-m-pane__name--overview">{title}</div>
      </h1>
    }
    <div className={classnames('overview-view-selector', {'selected-view__resources': selectedView === View.Resources })}>
      <div className="form-group btn-group">
        <button
          type="button"
          className={classnames('btn btn-default', { 'btn-primary': selectedView === View.Resources })}
          aria-label="Resources"
          title="Resources"
          disabled={disabled}
          onClick={() => selectView(View.Resources)}
        >
          <i className="fa fa-list-ul" aria-hidden="true" />
          Resources
        </button>
        <button
          type="button"
          className={classnames('btn btn-default', { 'btn-primary': selectedView === View.Dashboard })}
          aria-label="Dashboard"
          title="Dashboard"
          disabled={disabled}
          onClick={() => selectView(View.Dashboard)}
        >
          <i className="fa fa-dashboard" aria-hidden="true" />
          Dashboard
        </button>
      </div>
      <Toolbar className="overview-toolbar" preventSubmit>
        <Toolbar.RightContent>
          {selectedView === View.Resources && <React.Fragment>
            <div className="form-group overview-toolbar__form-group">
              <Dropdown
                className="overview-toolbar__dropdown"
                menuClassName="dropdown-menu--text-wrap"
                disabled={disabled}
                items={groupOptions}
                onChange={handleGroupChange}
                titlePrefix="Group by"
                title={groupOptions[selectedGroup]}
                spacerBefore={new Set([firstLabel])}
                headerBefore={{[firstLabel]: 'Label'}}
              />
            </div>
            <div className="form-group overview-toolbar__form-group">
              <div className="overview-toolbar__text-filter">
                <TextFilter
                  autoFocus={!disabled}
                  defaultValue={''}
                  disabled={disabled}
                  label="by name"
                  onChange={handleFilterChange}
                />
              </div>
            </div>
          </React.Fragment>}
          {selectedView === View.Dashboard && !_.isEmpty(project) && <div className="form-group">
            <ActionsMenu actions={overviewMenuActions.map((a: KebabAction) => a(ProjectModel, project))} />
          </div>}
        </Toolbar.RightContent>
      </Toolbar>
    </div>
  </div>
);

const OverviewHeading = connect<OverviewHeadingPropsFromState, OverviewHeadingPropsFromDispatch, OverviewHeadingOwnProps>(headingStateToProps, headingDispatchToProps)(OverviewHeading_);

const mainContentStateToProps = ({UI}): OverviewMainContentPropsFromState => {
  const metrics = UI.getIn(['overview', 'metrics']);
  const selectedView = UI.getIn(['overview', 'selectedView']);
  return { metrics, selectedView };
};

const mainContentDispatchToProps = (dispatch): OverviewMainContentPropsFromDispatch => ({
  updateMetrics: (metrics: OverviewMetrics) => dispatch(UIActions.updateOverviewMetrics(metrics)),
  updateResources: (items: OverviewItem[]) => dispatch(UIActions.updateOverviewResources(items)),
});

class OverviewMainContent_ extends React.Component<OverviewMainContentProps, OverviewMainContentState> {
  private metricsInterval: any = null;

  readonly state: OverviewMainContentState = {
    filterValue: '',
    items: [],
    filteredItems: [],
    groupedItems: [],
    firstLabel: '',
    groupOptions: {},
    selectedGroup: '',
  };

  componentDidMount(): void {
    this.fetchMetrics();
  }

  componentWillUnmount(): void {
    clearInterval(this.metricsInterval);
  }

  componentDidUpdate(prevProps: OverviewMainContentProps, prevState: OverviewMainContentState): void {
    const {
      builds,
      buildConfigs,
      daemonSets,
      deployments,
      deploymentConfigs,
      loaded,
      namespace,
      pods,
      replicaSets,
      replicationControllers,
      routes,
      services,
      statefulSets,
      selectedView,
    } = this.props;
    const {filterValue, selectedGroup} = this.state;

    if (!_.isEqual(namespace, prevProps.namespace)
      || loaded !== prevProps.loaded
      || !_.isEqual(buildConfigs, prevProps.buildConfigs)
      || !_.isEqual(builds, prevProps.builds)
      || !_.isEqual(daemonSets, prevProps.daemonSets)
      || !_.isEqual(deploymentConfigs, prevProps.deploymentConfigs)
      || !_.isEqual(deployments, prevProps.deployments)
      || !_.isEqual(pods, prevProps.pods)
      || !_.isEqual(replicaSets, prevProps.replicaSets)
      || !_.isEqual(replicationControllers, prevProps.replicationControllers)
      || !_.isEqual(routes, prevProps.routes)
      || !_.isEqual(services, prevProps.services)
      || !_.isEqual(statefulSets, prevProps.statefulSets)) {
      this.createOverviewData();
    } else if (filterValue !== prevState.filterValue) {
      const filteredItems = this.filterItems(this.state.items);
      this.setState({
        filteredItems,
        groupedItems: groupItems(filteredItems, selectedGroup),
      });
    } else if (selectedGroup !== prevState.selectedGroup) {
      this.setState({
        groupedItems: groupItems(this.state.filteredItems, selectedGroup),
      });
    } else if (selectedView !== prevProps.selectedView && selectedView === View.Dashboard) {
      // TODO: Preserve filter when switching to dashboard view and back.
      // OverviewHeading doesn't keep the value in state.
      this.setState({ filterValue: '' });
    }
  }

  fetchMetrics(): void {
    if (!prometheusBasePath) {
      // Component is not mounted or proxy has not been set up.
      return;
    }

    const { metrics: previousMetrics, namespace } = this.props;
    const queries = {
      memory: `pod_name:container_memory_usage_bytes:sum{namespace="${namespace}"}`,
      cpu: `pod_name:container_cpu_usage:sum{namespace="${namespace}"}`,
    };

    const promises = _.map(queries, (query, name) => {
      const url = `${prometheusBasePath}/api/v1/query?query=${encodeURIComponent(query)}`;
      return coFetchJSON(url).then(({ data: {result} }) => {
        const byPod: MetricValuesByPod = result.reduce((acc, { metric, value }) => {
          acc[metric.pod_name] = Number(value[1]);
          return acc;
        }, {});
        return { [name]: byPod };
      });
    });

    Promise.all(promises).then((data) => {
      const metrics = data.reduce((acc: OverviewMetrics, metric): OverviewMetrics => _.assign(acc, metric), {});
      this.props.updateMetrics(metrics);
    }).catch(res => {
      const status = _.get(res, 'response.status');
      // eslint-disable-next-line no-console
      console.error('Could not fetch metrics, status:', status);
      // Don't retry on some status codes unless a previous request succeeded.
      if (_.includes([401, 403, 502, 503], status) && _.isEmpty(previousMetrics)) {
        throw new Error(`Could not fetch metrics, status: ${status}`);
      }
    }).then(() => {
      this.metricsInterval = setTimeout(this.fetchMetrics, METRICS_POLL_INTERVAL);
    });
  }

  filterItems(items: OverviewItem[]): OverviewItem[] {
    const {selectedItem} = this.props;
    const {filterValue} = this.state;

    if (!filterValue) {
      return items;
    }

    const filterString = filterValue.toLowerCase();
    return _.filter(items, item => {
      return fuzzy(filterString, _.get(item, 'obj.metadata.name', ''))
        || _.get(item, 'obj.metadata.uid') === _.get(selectedItem, 'obj.metadata.uid');
    });
  }

  getGroupOptionsFromLabels(items: OverviewItem[]): any {
    const specialGroups = {
      [GROUP_BY_APPLICATION]: 'Application',
      [GROUP_BY_RESOURCE]: 'Resource',
    };

    const labelKeys = _.flatMap(items, item => _.keys(_.get(item, 'obj.metadata.labels'))).sort();
    if (_.isEmpty(labelKeys)) {
      return { firstLabel: '', groupOptions: specialGroups };
    }

    const firstLabel = _.first(labelKeys);
    const groupOptions = _.reduce(labelKeys, (accumulator, key) => ({
      ...accumulator,
      [key]: key,
    }), specialGroups);
    return { firstLabel, groupOptions };
  }

  getPodsForResource(resource: K8sResourceKind): K8sResourceKind[] {
    const {pods} = this.props;
    return getOwnedResources(resource, pods.data);
  }

  getRoutesForServices(services: K8sResourceKind[]): K8sResourceKind[] {
    const {routes} = this.props;
    return _.filter(routes.data, route => {
      const name = _.get(route, 'spec.to.name');
      return _.some(services, {metadata: {name}});
    });
  }

  getServicesForResource(resource: K8sResourceKind): K8sResourceKind[] {
    const {services} = this.props;
    const template = resource.kind === 'Pod' ? resource : _.get(resource, 'spec.template');
    return _.filter(services.data, service => {
      const selector = new LabelSelector(_.get(service, 'spec.selector', {}));
      return selector.matches(template);
    });
  }

  toReplicationControllerItem(rc: K8sResourceKind): PodControllerOverviewItem {
    const pods = this.getPodsForResource(rc);
    const alerts = {
      ...combinePodAlerts(pods),
      ...getReplicationControllerAlerts(rc),
    };
    const phase = getDeploymentPhase(rc);
    const revision = getDeploymentConfigVersion(rc);
    const obj = {
      ...rc,
      kind: ReplicationControllerModel.kind,
    };
    return {
      alerts,
      obj,
      phase,
      pods,
      revision,
    };
  }

  getActiveReplicationControllers(resource: K8sResourceKind): K8sResourceKind[] {
    const {replicationControllers} = this.props;
    const currentVersion = _.get(resource, 'status.latestVersion');
    const ownedRC = getOwnedResources(resource, replicationControllers.data);
    return _.filter(ownedRC, rc => _.get(rc, 'status.replicas') || getDeploymentConfigVersion(rc) === currentVersion);
  }

  getReplicationControllersForResource(resource: K8sResourceKind): PodControllerOverviewItem[] {
    const replicationControllers = this.getActiveReplicationControllers(resource);
    return sortReplicationControllersByRevision(replicationControllers).map(rc => this.toReplicationControllerItem(rc));
  }

  toReplicaSetItem(rs: K8sResourceKind): PodControllerOverviewItem {
    const obj = {
      ...rs,
      kind: ReplicaSetModel.kind,
    };
    const pods = this.getPodsForResource(rs);
    const alerts = combinePodAlerts(pods);
    return {
      alerts,
      obj,
      pods,
      revision: getDeploymentRevision(rs),
    };
  }

  getActiveReplicaSets(deployment: K8sResourceKind): K8sResourceKind[] {
    const {replicaSets} = this.props;
    const currentRevision = getDeploymentRevision(deployment);
    const ownedRS = getOwnedResources(deployment, replicaSets.data);
    return _.filter(ownedRS, rs => _.get(rs, 'status.replicas') || getDeploymentRevision(rs) === currentRevision);
  }

  getReplicaSetsForResource(deployment: K8sResourceKind): PodControllerOverviewItem[] {
    const replicaSets = this.getActiveReplicaSets(deployment);
    return sortReplicaSetsByRevision(replicaSets).map(rs => this.toReplicaSetItem(rs));
  }

  getBuildsForResource(buildConfig: K8sResourceKind): K8sResourceKind[] {
    const {builds} = this.props;
    return getOwnedResources(buildConfig, builds.data);
  }

  getBuildConfigsForResource(resource: K8sResourceKind): BuildConfigOverviewItem[] {
    const {buildConfigs} = this.props;
    const currentNamespace = resource.metadata.namespace;
    const nativeTriggers = _.get(resource, 'spec.triggers');
    const annotatedTriggers = getAnnotatedTriggers(resource);
    const triggers = _.unionWith(nativeTriggers, annotatedTriggers, _.isEqual);
    return _.flatMap(triggers, (trigger) => {
      const triggerFrom = trigger.from || _.get(trigger, 'imageChangeParams.from', {});
      if ( triggerFrom.kind !== 'ImageStreamTag') {
        return [];
      }
      return _.reduce(buildConfigs.data, (acc, buildConfig) => {
        const triggerImageNamespace = triggerFrom.namespace || currentNamespace;
        const triggerImageName = triggerFrom.name;
        const targetImageNamespace = _.get(buildConfig, 'spec.output.to.namespace', currentNamespace);
        const targetImageName = _.get(buildConfig, 'spec.output.to.name');
        if (triggerImageNamespace === targetImageNamespace && triggerImageName === targetImageName) {
          const builds = this.getBuildsForResource(buildConfig);
          return [
            ...acc,
            {
              ...buildConfig,
              builds: sortBuilds(builds),
            },
          ];
        }
        return acc;
      }, []);
    });
  }

  createDaemonSetItems(): OverviewItem[] {
    const {daemonSets} = this.props;
    return _.map(daemonSets.data, ds => {
      const buildConfigs = this.getBuildConfigsForResource(ds);
      const services = this.getServicesForResource(ds);
      const routes = this.getRoutesForServices(services);
      const pods = this.getPodsForResource(ds);
      const alerts = combinePodAlerts(pods);
      const obj = {
        ...ds,
        kind: DaemonSetModel.kind,
      };
      const status = <OverviewItemReadiness
        desired={ds.status.desiredNumberScheduled}
        href={`${resourceObjPath(obj, obj.kind)}/pods`}
        ready={ds.status.currentNumberScheduled}
      />;
      return {
        alerts,
        buildConfigs,
        obj,
        pods,
        routes,
        services,
        status,
      };
    });
  }

  createDeploymentItems(): OverviewItem[] {
    const {deployments} = this.props;
    return _.map(deployments.data, d => {
      const replicaSets = this.getReplicaSetsForResource(d);
      const current = _.head(replicaSets);
      const previous = _.nth(replicaSets, 1);
      const isRollingOut = !!current && !!previous;
      const buildConfigs = this.getBuildConfigsForResource(d);
      const services = this.getServicesForResource(d);
      const routes = this.getRoutesForServices(services);
      const obj = {
        ...d,
        kind: DeploymentModel.kind,
      };
      // TODO: Show pod status for previous and next revisions.
      const status = isRollingOut
        ? <span className="text-muted">Rollout in progress...</span>
        : <OverviewItemReadiness
          desired={d.spec.replicas}
          href={`${resourceObjPath(current.obj, _.get(current, 'obj.kind'))}/pods`}
          ready={d.status.replicas}
        />;

      return {
        buildConfigs,
        current,
        isRollingOut,
        obj,
        previous,
        routes,
        services,
        status,
      };
    });
  }

  createDeploymentConfigItems(): OverviewItem[] {
    const {deploymentConfigs} = this.props;
    return _.map(deploymentConfigs.data, dc => {
      const replicationControllers = this.getReplicationControllersForResource(dc);
      const current = _.head(replicationControllers);
      const previous = _.nth(replicationControllers, 1);
      const isRollingOut = current && previous && current.phase !== 'Cancelled' && current.phase !== 'Failed';
      const buildConfigs = this.getBuildConfigsForResource(dc);
      const services = this.getServicesForResource(dc);
      const routes = this.getRoutesForServices(services);
      const obj = {
        ...dc,
        kind: DeploymentConfigModel.kind,
      };

      // TODO: Show pod status for previous and next revisions.
      const status = isRollingOut
        ? <span className="text-muted">Rollout in progress...</span>
        : <OverviewItemReadiness
          desired={dc.spec.replicas}
          href={`${resourceObjPath(current.obj, _.get(current, 'obj.kind'))}/pods`}
          ready={dc.status.replicas}
        />;
      return {
        buildConfigs,
        current,
        isRollingOut,
        obj,
        previous,
        routes,
        services,
        status,
      };
    });
  }

  createStatefulSetItems(): OverviewItem[] {
    const {statefulSets} = this.props;
    return _.map(statefulSets.data, (ss) => {
      const buildConfigs = this.getBuildConfigsForResource(ss);
      const pods = this.getPodsForResource(ss);
      const alerts = combinePodAlerts(pods);
      const services = this.getServicesForResource(ss);
      const routes = this.getRoutesForServices(services);
      const obj = {
        ...ss,
        kind: StatefulSetModel.kind,
      };
      const status = <OverviewItemReadiness
        desired={ss.spec.replicas}
        href={`${resourceObjPath(obj, obj.kind)}/pods`}
        ready={ss.status.replicas}
      />;

      return {
        alerts,
        buildConfigs,
        obj,
        pods,
        routes,
        services,
        status,
      };
    });
  }

  createPodItems(): OverviewItem[] {
    const {pods} = this.props;
    return _.reduce(pods.data, (acc, pod) => {
      const owners = _.get(pod, 'metadata.ownerReferences');
      const phase = _.get(pod, 'status.phase');
      if (!_.isEmpty(owners) || ['Succeeded', 'Failed'].includes(phase)) {
        return acc;
      }

      const obj = {
        ...pod,
        kind: PodModel.kind,
      };
      const alerts = getPodAlerts(pod);
      const services = this.getServicesForResource(obj);
      const routes = this.getRoutesForServices(services);
      const status = <PodStatus pod={pod} />;
      return [
        ...acc,
        {
          alerts,
          obj,
          routes,
          services,
          status,
        },
      ];
    }, []);
  }

  createOverviewData(): void {
    const {loaded, updateResources} = this.props;

    if (!loaded) {
      return;
    }

    const items = [
      ...this.createDaemonSetItems(),
      ...this.createDeploymentItems(),
      ...this.createDeploymentConfigItems(),
      ...this.createStatefulSetItems(),
      ...this.createPodItems(),
    ];

    updateResources(items);

    const filteredItems = this.filterItems(items);
    const { firstLabel, groupOptions } = this.getGroupOptionsFromLabels(filteredItems);
    const selectedGroup = GROUP_BY_APPLICATION;
    const groupedItems = groupItems(filteredItems, selectedGroup);
    this.setState({
      filteredItems,
      groupedItems,
      firstLabel,
      groupOptions,
      items,
      selectedGroup,
    });
  }

  handleFilterChange = (event: any): void => {
    this.setState({filterValue: event.target.value});
  };

  handleGroupChange = (selectedGroup: string): void => {
    this.setState({selectedGroup});
  };

  clearFilter = (): void => {
    this.setState({filterValue: ''});
  };

  render() {
    const {loaded, loadError, mock, title, project = {}, selectedView} = this.props;
    const {filteredItems, groupedItems, firstLabel, groupOptions, selectedGroup} = this.state;
    return <div className="co-m-pane">
      <OverviewHeading
        disabled={mock}
        firstLabel={firstLabel}
        groupOptions={groupOptions}
        handleFilterChange={this.handleFilterChange}
        handleGroupChange={this.handleGroupChange}
        selectedGroup={selectedGroup}
        selectedView={selectedView}
        title={title}
        project={project.data}
      />
      <div className="co-m-pane__body co-m-pane__body--no-top-margin">
        <StatusBox
          data={selectedView === View.Resources ? filteredItems : project}
          label="Resources"
          loaded={loaded}
          loadError={loadError}
          EmptyMsg={OverviewEmptyState}
        >
          {selectedView === View.Resources && <ProjectOverview groups={groupedItems} />}
          {selectedView === View.Dashboard && <OverviewNamespaceDashboard obj={project.data} />}
        </StatusBox>
      </div>
    </div>;
  }
}

const OverviewMainContent = connect<OverviewMainContentPropsFromState, OverviewMainContentPropsFromDispatch, OverviewMainContentOwnProps>(mainContentStateToProps, mainContentDispatchToProps)(OverviewMainContent_);

const overviewStateToProps = ({UI}): OverviewPropsFromState => {
  const selectedUID = UI.getIn(['overview', 'selectedUID']);
  const resources = UI.getIn(['overview', 'resources']);
  const selectedItem = !!resources && resources.get(selectedUID);
  const selectedView = UI.getIn(['overview', 'selectedView'], View.Resources);
  return { selectedItem, selectedView };
};

const overviewDispatchToProps = (dispatch) => {
  return {
    dismissDetails: () => dispatch(UIActions.dismissOverviewDetails()),
  };
};

const Overview_: React.SFC<OverviewProps> = (({mock, namespace, selectedItem, selectedView, title, dismissDetails}) => {
  const sidebarOpen = !_.isEmpty(selectedItem) && selectedView !== View.Dashboard;
  const className = classnames('overview', {'overview--sidebar-shown': sidebarOpen});
  // TODO: Update resources for native Kubernetes clusters.
  const resources = [
    {
      isList: true,
      kind: 'Build',
      namespace,
      prop: 'builds',
    },
    {
      isList: true,
      kind: 'BuildConfig',
      namespace,
      prop: 'buildConfigs',
    },
    {
      isList: true,
      kind: 'DaemonSet',
      namespace,
      prop: 'daemonSets',
    },
    {
      isList: true,
      kind: 'Deployment',
      namespace,
      prop: 'deployments',
    },
    {
      isList: true,
      kind: 'DeploymentConfig',
      namespace,
      prop: 'deploymentConfigs',
    },
    {
      isList: true,
      kind: 'Pod',
      namespace,
      prop: 'pods',
    },
    {
      isList: false,
      kind: 'Project',
      name: namespace,
      prop: 'project',
    },
    {
      isList: true,
      kind: 'ReplicaSet',
      namespace,
      prop: 'replicaSets',
    },
    {
      isList: true,
      kind: 'ReplicationController',
      namespace,
      prop: 'replicationControllers',
    },
    {
      isList: true,
      kind: 'Route',
      namespace,
      prop: 'routes',
    },
    {
      isList: true,
      kind: 'Service',
      namespace,
      prop: 'services',
    },
    {
      isList: true,
      kind: 'StatefulSet',
      namespace,
      prop: 'statefulSets',
    },
  ];

  return <div className={className}>
    <div className="overview__main-column">
      <div className="overview__main-column-section">
        <Firehose resources={mock ? [] : resources} forceUpdate>
          <OverviewMainContent
            mock={mock}
            namespace={namespace}
            selectedItem={selectedItem}
            title={title}
          />
        </Firehose>
      </div>
    </div>
    {
      sidebarOpen &&
      <CSSTransition
        appear={true} in timeout={225} classNames="overview__sidebar">
        <div className="overview__sidebar">
          <div className="overview__sidebar-dismiss clearfix">
            <CloseButton onClick={dismissDetails} />
          </div>
          <ResourceOverviewPage
            item={selectedItem}
            kind={selectedItem.obj.kind}
          />
        </div>
      </CSSTransition>
    }
  </div>;
});

export const Overview = connect<OverviewPropsFromState, OverviewPropsFromDispatch, OverviewOwnProps>(overviewStateToProps, overviewDispatchToProps)(Overview_);

export const OverviewPage = withStartGuide(
  ({match, noProjectsAvailable}: OverviewPageProps & WithStartGuideProps) => {
    const namespace = _.get(match, 'params.ns');
    const title = 'Project Status';
    return <React.Fragment>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <Overview
        mock={noProjectsAvailable}
        namespace={namespace}
        title={title}
      />
    </React.Fragment>;
  }
);

type FirehoseItem = {
  data?: K8sResourceKind;
  [key: string]: any;
};

type FirehoseList = {
  data?: K8sResourceKind[];
  [key: string]: any;
};

type OverviewItemAlerts = {
  [key: string]: {
    message: string;
    severity: string;
  }
};

export type PodControllerOverviewItem = {
  alerts: OverviewItemAlerts;
  revision: number;
  obj: K8sResourceKind;
  phase?: string;
  pods: K8sResourceKind[];
};

export type BuildConfigOverviewItem = K8sResourceKind & {
  builds: K8sResourceKind[];
};

export type OverviewItem = {
  alerts?: OverviewItemAlerts;
  buildConfigs: BuildConfigOverviewItem[];
  current?: PodControllerOverviewItem;
  isRollingOut?: boolean;
  obj: K8sResourceKind;
  pods?: K8sResourceKind[];
  previous?: PodControllerOverviewItem;
  routes: K8sResourceKind[];
  services: K8sResourceKind[];
  status?: React.ReactNode;
};

export type OverviewGroup = {
  name: string;
  items: OverviewItem[];
};

type MetricValuesByPod = {
  [podName: string]: number,
};

export type OverviewMetrics = {
  cpu?: MetricValuesByPod;
  memory?: MetricValuesByPod;
};

type OverviewItemReadinessProps = {
  desired: number;
  href: string;
  ready: number;
};

type OverviewHeadingPropsFromState = {
  selectedView: View;
};

type OverviewHeadingPropsFromDispatch = {
  selectView: (view: View) => void;
};

type OverviewHeadingOwnProps = {
  disabled?: boolean;
  firstLabel?: string;
  groupOptions?: any;
  handleFilterChange?: (event: any) => void;
  handleGroupChange?: (selectedLabel: string) => void;
  selectedGroup?: string;
  selectedView?: string;
  title: string;
  project: K8sResourceKind;
};

type OverviewHeadingProps = OverviewHeadingPropsFromState & OverviewHeadingPropsFromDispatch & OverviewHeadingOwnProps;

type OverviewMainContentPropsFromState = {
  metrics: OverviewMetrics;
  selectedView: View;
};

type OverviewMainContentPropsFromDispatch = {
  updateMetrics: (metrics: OverviewMetrics) => void;
  updateResources: (items: OverviewItem[]) => void;
};

type OverviewMainContentOwnProps = {
  builds?: FirehoseList;
  buildConfigs?: FirehoseList;
  daemonSets?: FirehoseList;
  deploymentConfigs?: FirehoseList;
  deployments?: FirehoseList;
  mock: boolean;
  loaded?: boolean;
  loadError?: any;
  namespace: string;
  pods?: FirehoseList;
  project?: FirehoseItem;
  replicationControllers?: FirehoseList;
  replicaSets?: FirehoseList;
  routes?: FirehoseList;
  services?: FirehoseList;
  selectedItem: OverviewItem;
  statefulSets?: FirehoseList;
  title?: string;
};

type OverviewMainContentProps = OverviewMainContentPropsFromState & OverviewMainContentPropsFromDispatch & OverviewMainContentOwnProps;

type OverviewMainContentState = {
  readonly filterValue: string;
  readonly items: any[];
  readonly filteredItems: any[];
  readonly groupedItems: any[];
  readonly firstLabel: string;
  readonly groupOptions: any;
  readonly selectedGroup: string;
};

type OverviewPropsFromState = {
  selectedItem: any;
  selectedView: View;
};

type OverviewPropsFromDispatch = {
  dismissDetails: () => void;
};

type OverviewOwnProps = {
  mock: boolean;
  namespace: string;
  title: string;
};

type OverviewProps = OverviewPropsFromState & OverviewPropsFromDispatch & OverviewOwnProps;

type OverviewPageProps = {
  match: any;
};
