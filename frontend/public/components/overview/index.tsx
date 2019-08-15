import * as _ from 'lodash-es';
import * as classnames from 'classnames';
import * as fuzzy from 'fuzzysearch';
import * as React from 'react';
import { connect } from 'react-redux';
import { CSSTransition } from 'react-transition-group';
import { Link } from 'react-router-dom';

import { coFetchJSON } from '../../co-fetch';
import { getBuildNumber } from '../../module/k8s/builds';
import { PROMETHEUS_TENANCY_BASE_PATH } from '../graphs';
import { TextFilter } from '../factory';
import { PodStatus } from '../pod';
import * as UIActions from '../../actions/ui';
import {
  apiVersionForModel,
  K8sResourceKind,
  LabelSelector,
  PodKind,
  PodTemplate,
} from '../../module/k8s';
import {
  DaemonSetModel,
  DeploymentModel,
  DeploymentConfigModel,
  PodModel,
  ReplicationControllerModel,
  ReplicaSetModel,
  StatefulSetModel,
} from '../../models';
import {
  CloseButton,
  Dropdown,
  Firehose,
  StatusBox,
  resourceObjPath,
  FirehoseResult,
  FirehoseResource,
  MsgBox,
} from '../utils';

import { ProjectOverview } from './project-overview';
import { ResourceOverviewPage } from './resource-overview-page';
import { OverviewSpecialGroup } from './constants';
import * as plugins from '../../plugins';
import { OverviewCRD } from '@console/plugin-sdk';

// List of container status waiting reason values that we should call out as errors in project status rows.
const CONTAINER_WAITING_STATE_ERROR_REASONS = ['CrashLoopBackOff', 'ErrImagePull', 'ImagePullBackOff'];

// Annotation key for deployment config latest version
const DEPLOYMENT_CONFIG_LATEST_VERSION_ANNOTATION = 'openshift.io/deployment-config.latest-version';

// Annotation key for deployment phase
const DEPLOYMENT_PHASE_ANNOTATION = 'openshift.io/deployment.phase';

// Annotaton key for deployment revision
const DEPLOYMENT_REVISION_ANNOTATION = 'deployment.kubernetes.io/revision';

// Display name for default overview group.
// Should not be a valid label key to avoid conflicts. https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/#syntax-and-character-setexport
const DEFAULT_GROUP_NAME = 'other resources';

// Interval at which metrics are retrieved and updated
const METRICS_POLL_INTERVAL = 30 * 1000;

// Annotation key for image triggers
const TRIGGERS_ANNOTATION = 'image.openshift.io/triggers';

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

  return _.map(keyedItems, (group: OverviewItem[], name: string): OverviewGroup => {
    return {
      name,
      items: group,
    };
  }).sort(compareGroups);
};

const getApplication = (item: OverviewItem): string => {
  const labels = _.get(item, 'obj.metadata.labels') || {};
  return labels['app.kubernetes.io/part-of'] || labels['app.kubernetes.io/name'] || labels.app || DEFAULT_GROUP_NAME;
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
  const byLabel = _.groupBy(items, (item): string => _.get(item, ['obj', 'metadata', 'labels', label]) || DEFAULT_GROUP_NAME);
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

const getPodAlerts = (pod: K8sResourceKind): OverviewItemAlerts => {
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

const combinePodAlerts = (pods: K8sResourceKind[]): OverviewItemAlerts => _.reduce(pods, (acc, pod) => ({
  ...acc,
  ...getPodAlerts(pod),
}), {});


const getBuildAlerts = (buildConfigs: BuildConfigOverviewItem[]): OverviewItemAlerts => {
  const buildAlerts = {};
  const addAlert = (build: K8sResourceKind, buildPhase: string) => _.set(buildAlerts, `${build.metadata.uid}--build${buildPhase}`, {severity: `build${buildPhase}`, message: _.get(build, ['status', 'message'], buildPhase)});

  _.each(buildConfigs, bc => {
    let seenComplete = false;
    // Requires builds to be sorted by most recent first.
    _.each(bc.builds, (build: K8sResourceKind) => {
      const buildPhase = _.get(build, ['status', 'phase']);
      switch (buildPhase) {
        case 'Complete':
          seenComplete = true;
          break;
        case 'Failed':
        case 'Error':
          if (!seenComplete) {
            // show failure/error
            addAlert(build, buildPhase);
          }
          break;
        case 'New':
        case 'Pending':
        case 'Running':
          // show new/pending/running
          addAlert(build, buildPhase);
          break;
        default:
          break;
      }
    });
  });

  return buildAlerts;
};

const getReplicationControllerAlerts = (rc: K8sResourceKind): OverviewItemAlerts => {
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

const getResourcePausedAlert = (resource: K8sResourceKind): OverviewItemAlerts => {
  if (!resource.spec.paused) {
    return {};
  }
  return {
    [`${resource.metadata.uid}--Paused`]: {
      severity: 'info',
      message: `${resource.metadata.name} is paused.`,
    },
  };
};

const getOwnedResources = <T extends K8sResourceKind>({metadata:{uid}}: K8sResourceKind, resources: T[]): T[] => {
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

export const sortBuilds = (builds: K8sResourceKind[]): K8sResourceKind[] => {

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

const OverviewItemReadiness: React.SFC<OverviewItemReadinessProps> = ({desired = 0, ready = 0, resource}) => {
  const href = `${resourceObjPath(resource, resource.kind)}/pods`;
  return <Link to={href}>
    {ready} of {desired} pods
  </Link>;
};

const headingStateToProps = ({UI}): OverviewHeadingPropsFromState => {
  const {selectedGroup, labels, filterValue} = UI.get('overview').toJS();
  return {labels, selectedGroup, filterValue};
};

const headingDispatchToProps = (dispatch): OverviewHeadingPropsFromDispatch => ({
  selectGroup: (group: OverviewSpecialGroup) => dispatch(UIActions.updateOverviewSelectedGroup(group)),
  changeFilter: (value: string) => dispatch(UIActions.updateOverviewFilterValue(value)),
});

class OverviewHeading_ extends React.Component<OverviewHeadingProps> {
  componentWillUnmount() {
    // Resets the filter value so that it is not retained when navigating to other pages.
    this.props.changeFilter('');
  }

  render() {
    const {changeFilter, filterValue, labels, selectGroup, selectedGroup} = this.props;
    const firstLabel = _.first(labels) || '';
    const dropdownItems = {
      [OverviewSpecialGroup.GROUP_BY_APPLICATION]: 'Application',
      [OverviewSpecialGroup.GROUP_BY_RESOURCE]: 'Resource',
      ..._.zipObject(labels, labels),
    };

    return <div className="co-m-pane__filter-bar">
      <div className="co-m-pane__filter-bar-group">
        <Dropdown
          className="btn-group"
          menuClassName="dropdown-menu--text-wrap"
          items={dropdownItems}
          onChange={selectGroup}
          titlePrefix="Group by"
          title={dropdownItems[selectedGroup] || 'Select Category'}
          spacerBefore={new Set([firstLabel])}
          headerBefore={{[firstLabel]: 'Label'}}
        />
      </div>
      <div className="co-m-pane__filter-bar-group co-m-pane__filter-bar-group--filter">
        <TextFilter
          defaultValue={filterValue}
          label="by name"
          onChange={(e) => changeFilter(e.target.value)}
        />
      </div>
    </div>;
  }
}

const OverviewHeading = connect<OverviewHeadingPropsFromState, OverviewHeadingPropsFromDispatch, OverviewHeadingOwnProps>(headingStateToProps, headingDispatchToProps)(OverviewHeading_);

const mainContentStateToProps = ({UI}): OverviewMainContentPropsFromState => {
  const {filterValue, metrics, selectedGroup, labels} = UI.get('overview').toJS();
  return {filterValue, labels, metrics, selectedGroup};
};

const mainContentDispatchToProps = (dispatch): OverviewMainContentPropsFromDispatch => ({
  updateOverviewLabels: (labels: string[]) => dispatch(UIActions.updateOverviewLabels(labels)),
  updateMetrics: (metrics: OverviewMetrics) => dispatch(UIActions.updateOverviewMetrics(metrics)),
  updateResources: (items: OverviewItem[]) => dispatch(UIActions.updateOverviewResources(items)),
  updateSelectedGroup: (group: OverviewSpecialGroup) => dispatch(UIActions.updateOverviewSelectedGroup(group)),
});

class OverviewMainContent_ extends React.Component<OverviewMainContentProps, OverviewMainContentState> {
  private metricsInterval: any = null;

  readonly state: OverviewMainContentState = {
    items: [],
    filteredItems: [],
    groupedItems: [],
    ...this.createOverviewData(),
  }

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

    if (namespace !== prevProps.namespace
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
      memory: `pod_name:container_memory_usage_bytes:sum{namespace="${namespace}"}`,
      cpu: `pod_name:container_cpu_usage:sum{namespace="${namespace}"}`,
    };

    const promises = _.map(queries, (query, name) => {
      const url = `${PROMETHEUS_TENANCY_BASE_PATH}/api/v1/query?namespace=${namespace}&query=${encodeURIComponent(query)}`;
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
    const {filterValue, selectedItem} = this.props;

    if (!filterValue) {
      return items;
    }

    const filterString = filterValue.toLowerCase();
    return _.filter(items, item => {
      return fuzzy(filterString, _.get(item, 'obj.metadata.name', ''))
        || _.get(item, 'obj.metadata.uid') === _.get(selectedItem, 'obj.metadata.uid');
    });
  }

  getOverviewLabels(items: OverviewItem[]): string[] {
    return _.flatMap(items, item => _.keys(_.get(item, 'obj.metadata.labels'))).sort();
  }

  getPodsForResource(resource: K8sResourceKind): PodKind[] {
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

  getPodTemplate(resource: K8sResourceKind): PodTemplate {
    switch (resource.kind) {
      case 'Pod':
        return resource as PodKind;
      case 'DeploymentConfig':
        // Include labels automatically added to deployment config pods since a service
        // might select them.
        return _.defaultsDeep({
          metadata: {
            labels: {
              deploymentconfig: resource.metadata.name,
            },
          },
        }, resource.spec.template);
      default:
        return resource.spec.template;
    }
  }

  getServicesForResource(resource: K8sResourceKind): K8sResourceKind[] {
    const {services} = this.props;
    const template: PodTemplate = this.getPodTemplate(resource);
    return _.filter(services.data, (service: K8sResourceKind) => {
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
      apiVersion: apiVersionForModel(ReplicationControllerModel),
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
      apiVersion: apiVersionForModel(ReplicaSetModel),
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
      if (triggerFrom.kind !== 'ImageStreamTag') {
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
      const obj: K8sResourceKind = {
        ...ds,
        apiVersion: apiVersionForModel(DaemonSetModel),
        kind: DaemonSetModel.kind,
      };
      const buildConfigs = this.getBuildConfigsForResource(obj);
      const services = this.getServicesForResource(obj);
      const routes = this.getRoutesForServices(services);
      const pods = this.getPodsForResource(obj);
      const alerts = {
        ...combinePodAlerts(pods),
        ...getBuildAlerts(buildConfigs),
      };
      const status = <OverviewItemReadiness
        desired={obj.status.desiredNumberScheduled}
        ready={obj.status.currentNumberScheduled}
        resource={obj}
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
      const obj: K8sResourceKind = {
        ...d,
        apiVersion: apiVersionForModel(DeploymentModel),
        kind: DeploymentModel.kind,
      };
      const replicaSets = this.getReplicaSetsForResource(obj);
      const current = _.head(replicaSets);
      const previous = _.nth(replicaSets, 1);
      const isRollingOut = !!current && !!previous;
      const buildConfigs = this.getBuildConfigsForResource(obj);
      const services = this.getServicesForResource(obj);
      const routes = this.getRoutesForServices(services);
      const alerts = {
        ...getResourcePausedAlert(obj),
        ...getBuildAlerts(buildConfigs),
      };
      // TODO: Show pod status for previous and next revisions.
      const status = isRollingOut
        ? <span className="text-muted">Rollout in progress...</span>
        : <OverviewItemReadiness
          desired={obj.spec.replicas}
          ready={obj.status.replicas}
          resource={current ? current.obj : obj}
        />;
      let overviewItems = {
        alerts,
        buildConfigs,
        current,
        isRollingOut,
        obj,
        previous,
        pods: [..._.get(current, 'pods', []), ..._.get(previous, 'pods', [])],
        routes,
        services,
        status,
      };

      this.props.utils.forEach(element => {
        overviewItems = {...overviewItems, ...element(obj, this.props)};
      });
      return overviewItems;
    });
  }

  createDeploymentConfigItems(): OverviewItem[] {
    const {deploymentConfigs} = this.props;
    return _.map(deploymentConfigs.data, dc => {
      const obj: K8sResourceKind = {
        ...dc,
        apiVersion: apiVersionForModel(DeploymentConfigModel),
        kind: DeploymentConfigModel.kind,
      };
      const replicationControllers = this.getReplicationControllersForResource(obj);
      const current = _.head(replicationControllers);
      const previous = _.nth(replicationControllers, 1);
      const isRollingOut = current && previous && current.phase !== 'Cancelled' && current.phase !== 'Failed';
      const buildConfigs = this.getBuildConfigsForResource(obj);
      const services = this.getServicesForResource(obj);
      const routes = this.getRoutesForServices(services);
      const alerts = {
        ...getResourcePausedAlert(obj),
        ...getBuildAlerts(buildConfigs),
      };

      // TODO: Show pod status for previous and next revisions.
      const status = isRollingOut
        ? <span className="text-muted">Rollout in progress...</span>
        : <OverviewItemReadiness
          desired={obj.spec.replicas}
          ready={obj.status.replicas}
          resource={current ? current.obj : obj}
        />;
      return {
        alerts,
        buildConfigs,
        current,
        isRollingOut,
        obj,
        previous,
        pods: [..._.get(current, 'pods', []), ..._.get(previous, 'pods', [])],
        routes,
        services,
        status,
      };
    });
  }

  createStatefulSetItems(): OverviewItem[] {
    const {statefulSets} = this.props;
    return _.map(statefulSets.data, (ss) => {
      const obj: K8sResourceKind = {
        ...ss,
        apiVersion: apiVersionForModel(StatefulSetModel),
        kind: StatefulSetModel.kind,
      };
      const buildConfigs = this.getBuildConfigsForResource(obj);
      const pods = this.getPodsForResource(obj);
      const alerts = {
        ...combinePodAlerts(pods),
        ...getBuildAlerts(buildConfigs),
      };
      const services = this.getServicesForResource(obj);
      const routes = this.getRoutesForServices(services);
      const status = <OverviewItemReadiness
        desired={obj.spec.replicas}
        ready={obj.status.replicas}
        resource={obj}
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
      const obj: PodKind = {
        ...pod,
        apiVersion: apiVersionForModel(PodModel),
        kind: PodModel.kind,
      };
      const owners = _.get(obj, 'metadata.ownerReferences');
      const phase = _.get(obj, 'status.phase');
      if (!_.isEmpty(owners) || ['Succeeded', 'Failed'].includes(phase)) {
        return acc;
      }

      const alerts = getPodAlerts(obj);
      const services = this.getServicesForResource(obj);
      const routes = this.getRoutesForServices(services);
      const status = <PodStatus pod={obj} />;
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

  createOverviewData(): OverviewMainContentState {
    const {loaded, mock, selectedGroup, updateOverviewLabels, updateSelectedGroup, updateResources} = this.props;

    if (!loaded) {
      return;
    }
    // keeps deleted bookmarked projects from attempting to generate data
    if (mock) {
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
    const labels = this.getOverviewLabels(filteredItems);
    if (selectedGroup !== OverviewSpecialGroup.GROUP_BY_APPLICATION && selectedGroup !== OverviewSpecialGroup.GROUP_BY_RESOURCE && !_.includes(labels, selectedGroup)) {
      updateSelectedGroup(OverviewSpecialGroup.GROUP_BY_APPLICATION);
    }

    updateOverviewLabels(labels);
    const groupedItems = groupItems(filteredItems, selectedGroup);
    return {
      filteredItems,
      groupedItems,
      items,
    };
  }

  render() {
    const {loaded, loadError, project, namespace} = this.props;
    const {filteredItems, groupedItems} = this.state;
    const OverviewEmptyState = () => <MsgBox
      title="No Workloads Found."
      detail={<div>
        <Link to={UIActions.formatNamespacedRouteForResource('import', namespace)}>Import YAML</Link> or <Link to={`/add/ns/${namespace}`}>add other content</Link> to your project.
      </div>}
    />;

    const skeletonOverview = <div className="skeleton-overview">
      <div className="skeleton-overview--head" />
      <div className="skeleton-overview--tile" />
      <div className="skeleton-overview--tile" />
      <div className="skeleton-overview--tile" />
    </div>;

    return <div className="co-m-pane">
      <OverviewHeading project={_.get(project, 'data')} />
      <div className="co-m-pane__body co-m-pane__body--no-top-margin">
        <StatusBox
          skeleton={skeletonOverview}
          data={filteredItems}
          label="Resources"
          loaded={loaded}
          loadError={loadError}
          EmptyMsg={OverviewEmptyState}
        >
          <ProjectOverview groups={groupedItems} />
        </StatusBox>
      </div>
    </div>;
  }
}

const OverviewMainContent = connect<OverviewMainContentPropsFromState, OverviewMainContentPropsFromDispatch, OverviewMainContentOwnProps>(mainContentStateToProps, mainContentDispatchToProps)(OverviewMainContent_);

const overviewStateToProps = ({UI,FLAGS}): OverviewPropsFromState => {
  const selectedUID = UI.getIn(['overview', 'selectedUID']);
  const resources = UI.getIn(['overview', 'resources']);
  const resourceList = plugins.registry.getOverviewCRDs().filter(resource => FLAGS.get(resource.properties.required));
  const selectedItem = !!resources && resources.get(selectedUID);
  return { selectedItem , resourceList};

};

const overviewDispatchToProps = (dispatch): OverviewPropsFromDispatch => {
  return {
    dismissDetails: () => dispatch(UIActions.dismissOverviewDetails()),
  };
};

const Overview_: React.SFC<OverviewProps> = ({mock, match, selectedItem, resourceList, title, dismissDetails}) => {
  const namespace = _.get(match, 'params.name');
  const sidebarOpen = !_.isEmpty(selectedItem);
  const className = classnames('overview', {'overview--sidebar-shown': sidebarOpen});
  const ref = React.useRef();
  const [height, setHeight] = React.useState(500);
  const calcHeight = (node) => {
    setHeight(document.getElementsByClassName('pf-c-page')[0].getBoundingClientRect().bottom - node.current.getBoundingClientRect().top);
  };
  React.useLayoutEffect(() => {
    calcHeight(ref);
    const handleResize = () => calcHeight(ref);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  });

  // TODO: Update resources for native Kubernetes clusters.
  let resources: FirehoseResource[] = [
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
  let crdUtils = [];
  resourceList.forEach(resource => {
    resources = [...resources, ...resource.properties.resources(namespace)];
    crdUtils = [...crdUtils, resource.properties.utils];
  });

  return <div className={className}>
    <div className="overview__main-column" ref={ref} style={{height}}>
      <div className="overview__main-column-section">
        <Firehose resources={mock ? [] : resources} forceUpdate>
          <OverviewMainContent
            mock={mock}
            namespace={namespace}
            selectedItem={selectedItem}
            title={title}
            utils={crdUtils}
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
};

export const Overview = connect<OverviewPropsFromState, OverviewPropsFromDispatch, OverviewOwnProps>(overviewStateToProps, overviewDispatchToProps)(Overview_);

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
  pods: PodKind[];
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
  pods?: PodKind[];
  previous?: PodControllerOverviewItem;
  routes: K8sResourceKind[];
  services: K8sResourceKind[];
  status?: React.ReactNode;
  ksroutes?: K8sResourceKind[];
  configurations?: K8sResourceKind[];
  revisions?: K8sResourceKind[];
};

export type PodOverviewItem = {
  obj: PodKind;
} & OverviewItem;

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
  resource: K8sResourceKind;
  ready: number;
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

type OverviewHeadingProps = OverviewHeadingPropsFromState & OverviewHeadingPropsFromDispatch & OverviewHeadingOwnProps;

type OverviewMainContentPropsFromState = {
  filterValue: string;
  labels: string[];
  metrics: OverviewMetrics;
  selectedGroup: string;
};

type OverviewMainContentPropsFromDispatch = {
  updateOverviewLabels: (labels: string[]) => void;
  updateMetrics: (metrics: OverviewMetrics) => void;
  updateResources: (items: OverviewItem[]) => void;
  updateSelectedGroup: (group: OverviewSpecialGroup) => void;
};

type OverviewMainContentOwnProps = {
  builds?: FirehoseResult;
  buildConfigs?: FirehoseResult;
  daemonSets?: FirehoseResult;
  deploymentConfigs?: FirehoseResult;
  deployments?: FirehoseResult;
  mock: boolean;
  loaded?: boolean;
  loadError?: any;
  namespace: string;
  pods?: FirehoseResult<PodKind[]>;
  project?: FirehoseResult<K8sResourceKind>;
  replicationControllers?: FirehoseResult;
  replicaSets?: FirehoseResult;
  routes?: FirehoseResult;
  services?: FirehoseResult;
  selectedItem: OverviewItem;
  statefulSets?: FirehoseResult;
  title?: string;
  utils?: Function[];
};

export type OverviewMainContentProps = OverviewMainContentPropsFromState & OverviewMainContentPropsFromDispatch & OverviewMainContentOwnProps;

type OverviewMainContentState = {
  readonly items: any[];
  readonly filteredItems: any[];
  readonly groupedItems: any[];
};

type OverviewPropsFromState = {
  selectedItem: any;
  resourceList: OverviewCRD[];
};

type OverviewPropsFromDispatch = {
  dismissDetails: () => void;
};

type OverviewOwnProps = {
  mock: boolean;
  match: any;
  title: string;
};

type OverviewProps = OverviewPropsFromState & OverviewPropsFromDispatch & OverviewOwnProps;
