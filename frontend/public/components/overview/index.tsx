import * as _ from 'lodash-es';
import * as classnames from 'classnames';
import * as fuzzy from 'fuzzysearch';
import * as React from 'react';
import { connect } from 'react-redux';
import { CSSTransition } from 'react-transition-group';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Toolbar } from 'patternfly-react';

import store from '../../redux';
import { ALL_NAMESPACES_KEY } from '../../const';
import { coFetchJSON } from '../../co-fetch';
import { getBuildNumber } from '../../module/k8s/builds';
import { prometheusBasePath } from '../graphs';
import { SafetyFirst } from '../safety-first';
import { TextFilter } from '../factory';
import { UIActions } from '../../ui/ui-actions';
import {
  /* eslint-disable-next-line no-unused-vars */
  K8sResourceKind,
  LabelSelector,
} from '../../module/k8s';
import {
  withStartGuide,
  /* eslint-disable-next-line no-unused-vars */
  WithStartGuideProps,
} from '../start-guide';
import {
  DaemonSetModel,
  DeploymentModel,
  DeploymentConfigModel,
  ReplicationControllerModel,
  ReplicaSetModel,
  StatefulSetModel,
} from '../../models';
import {
  CloseButton,
  Disabled,
  Dropdown,
  Firehose,
  MsgBox,
  StatusBox,
} from '../utils';

import { ProjectOverview } from './project-overview';
import { ResourceOverviewPage } from './resource-overview-page';

// Should not be a valid label value to avoid conflicts.
// https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/#syntax-and-character-set
const EMPTY_GROUP_LABEL = 'other resources';
const DEPLOYMENT_REVISION_ANNOTATION = 'deployment.kubernetes.io/revision';
const DEPLOYMENT_CONFIG_LATEST_VERSION_ANNOTATION = 'openshift.io/deployment-config.latest-version';
const DEPLOYMENT_PHASE_ANNOTATION = 'openshift.io/deployment.phase';
const TRIGGERS_ANNOTATION = 'image.openshift.io/triggers';
const METRICS_POLL_INTERVAL = 30 * 1000;

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

const OverviewHeading: React.SFC<OverviewHeadingProps> = ({disabled, groupOptions, handleFilterChange = _.noop, handleGroupChange = _.noop, selectedGroup = '', title}) => (
  <div className="co-m-nav-title co-m-nav-title--overview">
    {
      title &&
      <h1 className="co-m-pane__heading">
        <div className="co-m-pane__name">{title}</div>
      </h1>
    }
    <Toolbar className="overview-toolbar">
      <Toolbar.RightContent>
        {
          !_.isEmpty(groupOptions) &&
          <div className="form-group overview-toolbar__form-group">
            <label className="overview-toolbar__label co-no-bold">
              Group by label
            </label>
            <Dropdown
              className="overview-toolbar__dropdown"
              disabled={disabled}
              items={groupOptions}
              onChange={handleGroupChange}
              style={{display: 'inline-block'}}
              title={selectedGroup}
            />
          </div>
        }
        <div className="form-group overview-toolbar__form-group">
          <TextFilter
            autoFocus={!disabled}
            defaultValue={''}
            disabled={disabled}
            label="Resources by name"
            onChange={handleFilterChange}
          />
        </div>
      </Toolbar.RightContent>
    </Toolbar>
  </div>
);

class OverviewDetails extends SafetyFirst<OverviewDetailsProps, OverviewDetailsState> {
  /* eslint-disable-next-line no-undef */
  metricsInterval_: any;

  constructor(props: OverviewDetailsProps) {
    super(props);
    this.handleFilterChange = this.handleFilterChange.bind(this);
    this.handleGroupChange = this.handleGroupChange.bind(this);
    this.clearFilter = this.clearFilter.bind(this);

    this.state = {
      filterValue: '',
      items: [],
      filteredItems: [],
      groupedItems: [],
      groupOptions: {},
      metrics: {},
      selectedGroupLabel: '',
    };
  }

  componentDidMount(): void {
    super.componentDidMount();
    this.fetchMetrics();
  }

  componentWillUnmount(): void {
    super.componentWillUnmount();
    clearInterval(this.metricsInterval_);
  }

  componentDidUpdate(prevProps: OverviewDetailsProps, prevState: OverviewDetailsState): void {
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
    } = this.props;
    const {filterValue, selectedGroupLabel} = this.state;

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
        groupedItems: this.groupItems(filteredItems, selectedGroupLabel),
      });
    } else if (selectedGroupLabel !== prevState.selectedGroupLabel) {
      this.setState({
        groupedItems: this.groupItems(this.state.filteredItems, selectedGroupLabel),
      });
    }
  }

  fetchMetrics(): void {
    if (!this.isMounted_ || !prometheusBasePath) {
      // Component is not mounted or proxy has not been set up.
      return;
    }

    const { namespace } = this.props;
    const { metrics: previousMetrics } = this.state;
    const queries = {
      memory: `pod_name:container_memory_usage_bytes:sum{namespace="${namespace}"}`,
      cpu: `pod_name:container_cpu_usage:sum{namespace="${namespace}"}`,
    };

    const promises = _.map(queries, (query, name) => {
      const url = `${prometheusBasePath}/api/v1/query?query=${encodeURIComponent(query)}`;
      return coFetchJSON(url).then(({ data: {result} }) => {
        const byPod = result.reduce((acc, { metric, value }) => {
          acc[metric.pod_name] = Number(value[1]);
          return acc;
        }, {});
        return { [name]: byPod };
      });
    });

    Promise.all(promises).then(data => {
      const metrics = data.reduce((acc, metric) => _.assign(acc, metric), {});
      this.setState({metrics});
    }).catch(res => {
      const status = _.get(res, 'response.status');
      // eslint-disable-next-line no-console
      console.error('Could not fetch metrics, status:', status);
      // Don't retry on some status codes unless a previous request succeeded.
      if (_.includes([401, 403, 502, 503], status) && _.isEmpty(previousMetrics)) {
        throw new Error(`Could not fetch metrics, status: ${status}`);
      }
    }).then(() => {
      this.metricsInterval_ = setTimeout(this.fetchMetrics, METRICS_POLL_INTERVAL);
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

  groupItems(items: OverviewItem[], label: string): OverviewGroup[] {
    const compareGroups = (a, b) => {
      if (a.name === EMPTY_GROUP_LABEL) {
        return 1;
      }
      if (b.name === EMPTY_GROUP_LABEL) {
        return -1;
      }
      return a.name.localeCompare(b.name);
    };

    if (!label) {
      return [{items}];
    }

    const groups = _.groupBy(items, item => _.get(item, ['obj', 'metadata', 'labels', label]) || EMPTY_GROUP_LABEL);
    return _.map(groups, (group: OverviewItem[], name: string) => {
      return {
        name,
        items: group,
      };
    }).sort(compareGroups);
  }

  getGroupOptionsFromLabels(items: OverviewItem[]): any {
    const {groupOptions} = this.state;
    const labelKeys = _.flatMap(items, item => _.keys(_.get(item,'obj.metadata.labels', {})));
    return _.reduce(labelKeys, (accumulator, key) => {
      if (_.has(key, accumulator)) {
        return accumulator;
      }
      return {
        ...accumulator,
        [key]: key,
      };
    }, groupOptions);
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
    const template = _.get(resource, 'spec.template');
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
      const readiness = {
        desired: ds.status.desiredNumberScheduled || 0,
        ready: ds.status.currentNumberScheduled || 0,
      };

      return {
        alerts,
        buildConfigs,
        obj,
        pods,
        readiness,
        routes,
        services,
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
      const readiness = {
        desired: d.spec.replicas || 0,
        ready: d.status.replicas || 0,
      };

      return {
        buildConfigs,
        current,
        isRollingOut,
        obj,
        previous,
        readiness,
        routes,
        services,
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
      const readiness = {
        desired: dc.spec.replicas || 0,
        ready: dc.status.replicas || 0,
      };

      return {
        buildConfigs,
        current,
        isRollingOut,
        obj,
        previous,
        readiness,
        routes,
        services,
      };
    });
  }

  createStatefulSetItems(): OverviewItem[] {
    const {statefulSets} = this.props;
    return _.map(statefulSets.data, (ss) => {
      const buildConfigs = this.getBuildConfigsForResource(ss);
      const obj = {
        ...ss,
        kind: StatefulSetModel.kind,
      };
      const readiness = {
        desired: ss.spec.replicas || 0,
        ready: ss.status.replicas || 0,
      };
      const pods = this.getPodsForResource(ss);
      const alerts = combinePodAlerts(pods);
      const services = this.getServicesForResource(ss);
      const routes = this.getRoutesForServices(services);
      return {
        alerts,
        buildConfigs,
        obj,
        pods,
        readiness,
        routes,
        services,
      };
    });
  }

  createOverviewData(): void {
    const {loaded} = this.props;

    if (!loaded) {
      return;
    }

    const items = [
      ...this.createDaemonSetItems(),
      ...this.createDeploymentItems(),
      ...this.createDeploymentConfigItems(),
      ...this.createStatefulSetItems(),
    ];

    store.dispatch(UIActions.updateOverviewResources(items));

    const filteredItems = this.filterItems(items);
    const groupOptions = this.getGroupOptionsFromLabels(filteredItems);
    const selectedGroupLabel = _.has(groupOptions, 'app') ? 'app' : _.head(_.keys(groupOptions));
    const groupedItems = this.groupItems(filteredItems, selectedGroupLabel);
    this.setState({
      filteredItems,
      groupedItems,
      groupOptions,
      items,
      selectedGroupLabel,
    });
  }

  handleFilterChange(event: any): void {
    this.setState({filterValue: event.target.value});
  }

  handleGroupChange(selectedGroupLabel: string): void {
    this.setState({selectedGroupLabel});
  }

  clearFilter(): void {
    this.setState({filterValue: ''});
  }

  render() {
    const { loaded, loadError, mock, title} = this.props;
    const {filteredItems, groupedItems, groupOptions, metrics, selectedGroupLabel} = this.state;
    return <div className="co-m-pane">
      <OverviewHeading
        disabled={mock}
        groupOptions={groupOptions}
        handleFilterChange={this.handleFilterChange}
        handleGroupChange={this.handleGroupChange}
        selectedGroup={selectedGroupLabel}
        title={title}
      />
      <div className="co-m-pane__body">
        <StatusBox
          data={filteredItems}
          label="Resources"
          loaded={loaded}
          loadError={loadError}
        >
          <ProjectOverview groups={groupedItems} metrics={metrics} />
        </StatusBox>
      </div>
    </div>;
  }
}

const overviewStateToProps = ({UI}): OverviewPropsFromState => {
  const selectedUID = UI.getIn(['overview', 'selectedUID'], '');
  const resources = UI.getIn(['overview', 'resources']);
  return {
    selectedItem: !!resources && resources.get(selectedUID),
  };
};

const overviewDispatchToProps = (dispatch) => {
  return {
    dismissDetails: () => dispatch(UIActions.dismissOverviewDetails()),
  };
};

export const Overview = connect<OverviewPropsFromState, OverviewPropsFromDispatch, OverviewOwnProps>(overviewStateToProps, overviewDispatchToProps)(
  ({dismissDetails, mock, namespace, selectedItem, title}: OverviewProps) => {
    const className = classnames('overview', {'overview--sidebar-shown': !_.isEmpty(selectedItem)});
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
        kind: 'StatefulSet',
        namespace,
        prop: 'statefulSets',
      },
      {
        isList: true,
        kind: 'Service',
        namespace,
        prop: 'services',
      },
    ];

    if (_.isEmpty(namespace) || namespace === ALL_NAMESPACES_KEY) {
      return <div className="co-m-pane">
        <Disabled>
          <OverviewHeading disabled title={title} />
        </Disabled>
        <div className="co-m-pane__body">
          <MsgBox
            detail={<React.Fragment>
              Select a project from the dropdown above to see an overview of its workloads.
              To view the status of all projects in the cluster, go to the <Link to="/status">status page</Link>.
            </React.Fragment>}
            title="Select a Project"
          />
        </div>
      </div>;
    }

    return <div className={className}>
      <div className="overview__main-column">
        <div className="overview__main-column-section">
          <Firehose resources={mock ? [] : resources} forceUpdate>
            <OverviewDetails
              mock={mock}
              namespace={namespace}
              selectedItem={selectedItem}
              title={title}
            />
          </Firehose>
        </div>
      </div>
      {
        !_.isEmpty(selectedItem) &&
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
  }
);

export const OverviewPage = withStartGuide(
  ({match, noProjectsAvailable}: OverviewPageProps & WithStartGuideProps) => {
    const namespace = _.get(match, 'params.ns');
    const title = 'Overview';
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

/* eslint-disable no-unused-vars, no-undef */
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

type OverviewItemReadiness = {
  desired: string | number;
  ready: string | number;
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
  readiness: OverviewItemReadiness;
  routes: K8sResourceKind[];
  services: K8sResourceKind[];
};

export type OverviewGroup = {
  name?: string;
  items: OverviewItem[];
};

type OverviewHeadingProps = {
  disabled?: boolean;
  groupOptions?: any;
  handleFilterChange?: (event: any) => void;
  handleGroupChange?: (selectedLabel: string) => void;
  selectedGroup?: string;
  title: string;
};

type OverviewDetailsProps = {
  builds?: any;
  buildConfigs?: any;
  daemonSets?: any;
  deploymentConfigs?: any;
  deployments?: any;
  mock: boolean;
  loaded?: boolean;
  loadError?: any;
  namespace: string;
  pods?: any;
  replicationControllers?: any;
  replicaSets?: any;
  routes?: any;
  services?: any;
  selectedItem: any;
  statefulSets?: any;
  title?: string;
};

type OverviewDetailsState = {
  filterValue: string;
  items: any[];
  filteredItems: any[];
  groupedItems: any[];
  groupOptions: any;
  metrics: any;
  selectedGroupLabel: string;
};

type OverviewPropsFromState = {
  selectedItem: OverviewItem | undefined;
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
/* eslint-enable no-unused-vars, no-undef */
