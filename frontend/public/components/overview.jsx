import * as React from 'react';
import * as _ from 'lodash-es';
import * as fuzzy from 'fuzzysearch';
import * as PropTypes from 'prop-types';
import * as classnames from 'classnames';
import { Toolbar } from 'patternfly-react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { CSSTransition } from 'react-transition-group';

import { SafetyFirst } from './safety-first';
import { StartGuide } from './start-guide';
import { TextFilter } from './factory';
import { ProjectOverview } from './project-overview';
import { ResourceOverviewPage } from './resource-list';
import { prometheusBasePath } from './graphs';
import { coFetchJSON } from '../co-fetch';
import { ALL_NAMESPACES_KEY } from '../const';
import {
  DaemonSetModel,
  DeploymentModel,
  DeploymentConfigModel,
  ReplicationControllerModel,
  ReplicaSetModel,
  StatefulSetModel
} from '../models';
import {
  CloseButton,
  Disabled,
  Dropdown,
  Firehose,
  MsgBox,
  StatusBox,
} from './utils';

// Should not be a valid label value to avoid conflicts.
// https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/#syntax-and-character-set
const EMPTY_GROUP_LABEL = 'other resources';
const DEPLOYMENT_REVISION_ANNOTATION = 'deployment.kubernetes.io/revision';
const DEPLOYMENT_CONFIG_LATEST_VERSION_ANNOTATION = 'openshift.io/deployment-config.latest-version';
const METRICS_POLL_INTERVAL = 30 * 1000;

const getDeploymentRevision = obj => {
  const revision = _.get(obj, ['metadata', 'annotations', DEPLOYMENT_REVISION_ANNOTATION]);
  return revision && parseInt(revision, 10);
};

const getDeploymentConfigVersion = obj => {
  const version = _.get(obj, ['metadata', 'annotations', DEPLOYMENT_CONFIG_LATEST_VERSION_ANNOTATION]);
  return version && parseInt(version, 10);
};

const getDeploymentPhase = rc => _.get(rc, ['metadata', 'annotations', 'openshift.io/deployment.phase']);

// Only show an alert once if multiple pods have the same error for the same owner.
const podAlertKey = (alert, pod, containerName = 'all') => {
  const id = _.get(pod, 'metadata.ownerReferences[0].uid', pod.metadata.uid);
  return `${alert}--${id}--${containerName}`;
};

const getPodAlerts = pod => {
  const alerts = {};
  const statuses = [
    ..._.get(pod, 'status.initContainerStatuses', []),
    ..._.get(pod, 'status.containerStatuses', []),
  ];
  statuses.forEach(status => {
    const { name, state } = status;
    const waitingReason = _.get(state, 'waiting.reason');
    if (waitingReason === 'CrashLoopBackOff') {
      const key = podAlertKey(waitingReason, pod, name);
      alerts[key] = {
        severity: 'error',
        message: `Container ${name} is crash-looping.`,
      };
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

const combinePodAlerts = pods => _.reduce(pods, (acc, pod) => ({
  ...acc,
  ...getPodAlerts(pod),
}), {});

const getReplicationControllerAlerts = rc => {
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

const getOwnedResources = ({metadata:{uid}}, resources) => {
  return _.filter(resources, ({metadata:{ownerReferences}}) => {
    return _.some(ownerReferences, {
      uid,
      controller: true
    });
  });
};

const sortByRevision = (replicators, getRevision, descending = true) => {
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

const sortReplicaSetsByRevision = (replicaSets) => {
  return sortByRevision(replicaSets, getDeploymentRevision);
};

const sortReplicationControllersByRevision = (replicationControllers) => {
  return sortByRevision(replicationControllers, getDeploymentConfigVersion);
};

const OverviewHeading = ({disabled, groupOptions, handleFilterChange, handleGroupChange, selectedGroup, title}) =>
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
            autofocus={!disabled}
            disabled={disabled}
            label="Resources by name"
            onChange={handleFilterChange}
          />
        </div>
      </Toolbar.RightContent>
    </Toolbar>
  </div>;

OverviewHeading.displayName = 'OverviewHeading';

OverviewHeading.propTypes = {
  disabled: PropTypes.bool,
  groupOptions: PropTypes.object,
  handleFilterChange: PropTypes.func,
  handleGroupChange: PropTypes.func,
  selectedGroup: PropTypes.string,
  title: PropTypes.string
};

OverviewHeading.defaultProps = {
  disabled: false,
  groupOptions: {},
  handleFilterChange: _.noop,
  handleGroupChange: _.noop,
  selectedGroup: ''
};

class OverviewDetails extends SafetyFirst {
  constructor(props) {
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
      selectedGroupLabel: ''
    };
  }

  componentDidMount() {
    super.componentDidMount();
    this.fetchMetrics();
  }

  componentWillUnmount () {
    super.componentWillUnmount();
    clearInterval(this.metricsInterval);
  }

  componentDidUpdate(prevProps, prevState) {
    const {daemonSets, deployments, deploymentConfigs, loaded, namespace, pods, replicaSets, replicationControllers, statefulSets} = this.props;
    const {filterValue, selectedGroupLabel} = this.state;

    if (!_.isEqual(namespace, prevProps.namespace)
      || loaded !== prevProps.loaded
      || !_.isEqual(daemonSets, prevProps.daemonSets)
      || !_.isEqual(deploymentConfigs, prevProps.deploymentConfigs)
      || !_.isEqual(deployments, prevProps.deployments)
      || !_.isEqual(pods, prevProps.pods)
      || !_.isEqual(replicaSets, prevProps.replicaSets)
      || !_.isEqual(replicationControllers, prevProps.replicationControllers)
      || !_.isEqual(statefulSets, prevProps.statefulSets)) {
      this.createOverviewData();
    } else if (filterValue !== prevState.filterValue) {
      const filteredItems = this.filterItems(this.state.items);
      this.setState({
        filteredItems,
        groupedItems: this.groupItems(filteredItems, selectedGroupLabel)
      });
    } else if (selectedGroupLabel !== prevState.selectedGroupLabel) {
      this.setState({
        groupedItems: this.groupItems(this.state.filteredItems, selectedGroupLabel)
      });
    }
  }

  fetchMetrics() {
    if (!prometheusBasePath) {
      // Proxy has not been set up.
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
    }).then(() => this.metricsInterval = setTimeout(() => {
      if (this.isMounted_) {
        this.fetchMetrics();
      }
    }, METRICS_POLL_INTERVAL));
  }

  filterItems(items) {
    const {filterValue} = this.state;
    const {selectedItem} = this.props;

    if (!filterValue) {
      return items;
    }

    const filterString = filterValue.toLowerCase();
    return _.filter(items, item => {
      return fuzzy(filterString, _.get(item, 'obj.metadata.name', '')) || _.get(item, 'obj.metadata.uid') === _.get(selectedItem, 'obj.metadata.uid');
    });
  }

  groupItems(items, label) {
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
    return _.map(groups, (group, name) => {
      return {
        name,
        items: group
      };
    }).sort(compareGroups);
  }

  getGroupOptionsFromLabels(items) {
    const {groupOptions} = this.state;
    const labelKeys = _.flatMap(items, item => _.keys(_.get(item,'obj.metadata.labels', {})));
    return _.reduce(labelKeys, (accumulator, key) => {
      if (_.has(key, accumulator)) {
        return accumulator;
      }
      return {
        ...accumulator,
        [key]: key
      };
    }, groupOptions);
  }

  addPodsToItem(item) {
    const {pods: allPods} = this.props;
    const {obj} = item;
    const pods = getOwnedResources(obj, allPods.data);
    const alerts = {
      ...item.alerts,
      ...combinePodAlerts(pods),
    };
    return {
      ...item,
      pods,
      alerts,
    };
  }

  toReplicationControllerItem(rc) {
    const alerts = getReplicationControllerAlerts(rc);
    const phase = getDeploymentPhase(rc);
    const revision = getDeploymentConfigVersion(rc);
    return this.addPodsToItem({
      obj: {
        ...rc,
        kind: ReplicationControllerModel.kind
      },
      alerts,
      phase,
      revision,
    });
  }

  getActiveReplicationControllers(deploymentConfig) {
    const {replicationControllers} = this.props;
    const currentVersion = _.get(deploymentConfig, 'status.latestVersion');
    const ownedRC = getOwnedResources(deploymentConfig, replicationControllers.data);
    return _.filter(ownedRC, rc => _.get(rc, 'status.replicas') || getDeploymentConfigVersion(rc) === currentVersion);
  }

  addReplicationControllersToItem(item) {
    const { obj: deploymentConfig } = item;
    const replicationControllers = this.getActiveReplicationControllers(deploymentConfig);
    const rcItems = sortReplicationControllersByRevision(replicationControllers).map(rc => this.toReplicationControllerItem(rc));
    const current = _.first(rcItems);
    const previous = _.nth(rcItems, 1);
    const isRollingOut = current && previous && current.phase !== 'Cancelled' && current.phase !== 'Failed';

    return {
      ...item,
      current,
      previous,
      isRollingOut,
    };
  }

  toReplicaSetItem(rs) {
    return this.addPodsToItem({
      obj: {
        ...rs,
        kind: ReplicaSetModel.kind,
      },
      revision: getDeploymentRevision(rs),
    });
  }

  getActiveReplicaSets(deployment) {
    const {replicaSets} = this.props;
    const currentRevision = getDeploymentRevision(deployment);
    const ownedRS = getOwnedResources(deployment, replicaSets.data);
    return _.filter(ownedRS, rs => _.get(rs, 'status.replicas') || getDeploymentRevision(rs) === currentRevision);
  }

  addReplicaSetsToItem(item) {
    const { obj: deployment } = item;
    const replicaSets = this.getActiveReplicaSets(deployment);
    const rsItems = sortReplicaSetsByRevision(replicaSets).map(rs => this.toReplicaSetItem(rs));
    const current = _.first(rsItems);
    const previous = _.nth(rsItems, 1);
    const isRollingOut = current && previous;
    return {
      ...item,
      current,
      previous,
      isRollingOut,
    };
  }

  createDaemonSetItems() {
    const {daemonSets} = this.props;
    return _.map(daemonSets.data, ds => {
      return this.addPodsToItem({
        obj: {
          ...ds,
          kind: DaemonSetModel.kind
        },
        readiness: {
          desired: ds.status.desiredNumberScheduled || 0,
          ready: ds.status.currentNumberScheduled || 0
        }
      });
    });
  }

  createDeploymentItems() {
    const {deployments} = this.props;
    return _.map(deployments.data, d => {
      return this.addReplicaSetsToItem({
        obj: {
          ...d,
          kind: DeploymentModel.kind
        },
        readiness: {
          desired: d.spec.replicas || 0,
          ready: d.status.replicas || 0
        }
      });
    });
  }

  createDeploymentConfigItems() {
    const {deploymentConfigs} = this.props;
    return _.map(deploymentConfigs.data, dc => {
      return this.addReplicationControllersToItem({
        obj: {
          ...dc,
          kind: DeploymentConfigModel.kind
        },
        readiness: {
          desired: dc.spec.replicas || 0,
          ready: dc.status.replicas || 0
        }
      });
    });
  }

  createStatefulSetItems() {
    const {statefulSets} = this.props;
    return _.map(statefulSets.data, (ss) => {
      return this.addPodsToItem({
        obj: {
          ...ss,
          kind: StatefulSetModel.kind
        },
        readiness: {
          desired: ss.spec.replicas || 0,
          ready: ss.status.replicas || 0
        }
      });
    });
  }

  createOverviewData() {
    const {loaded, selectedItem, selectItem} = this.props;

    if (!loaded) {
      return;
    }

    const items = [
      ...this.createDaemonSetItems(),
      ...this.createDeploymentItems(),
      ...this.createDeploymentConfigItems(),
      ...this.createStatefulSetItems()
    ];

    // Ensure any changes to the selected item propagate back up to the side panel
    if (!_.isEmpty(selectedItem)) {
      selectItem(_.find(items, {obj: {metadata: {uid: selectedItem.obj.metadata.uid }}}));
    }

    const filteredItems = this.filterItems(items);
    const groupOptions = this.getGroupOptionsFromLabels(filteredItems);
    const selectedGroupLabel = _.has(groupOptions, 'app') ? 'app' : _.head(_.keys(groupOptions));
    const groupedItems = this.groupItems(filteredItems, selectedGroupLabel);
    this.setState({
      filteredItems,
      groupedItems,
      groupOptions,
      items,
      selectedGroupLabel
    });
  }

  handleFilterChange(event) {
    this.setState({filterValue: event.target.value});
  }

  handleGroupChange(selectedGroupLabel) {
    this.setState({selectedGroupLabel});
  }

  clearFilter() {
    this.setState({filterValue: ''});
  }

  render() {
    const {loaded, loadError, selectedItem, title} = this.props;
    const {filteredItems, groupedItems, groupOptions, metrics, selectedGroupLabel} = this.state;
    return <div className="co-m-pane">
      <OverviewHeading
        groupOptions={groupOptions}
        handleFilterChange={this.handleFilterChange}
        handleGroupChange={this.handleGroupChange}
        selectedGroup={selectedGroupLabel}
        title={title}
      />
      <div className="co-m-pane__body">
        <StatusBox
          data={filteredItems}
          loaded={loaded}
          loadError={loadError}
          label="Resources"
        >
          <ProjectOverview
            selectedItem={selectedItem}
            groups={groupedItems}
            metrics={metrics}
            onClickItem={this.props.selectItem}
          />
        </StatusBox>
      </div>
    </div>;
  }
}

OverviewDetails.displayName = 'OverviewDetails';

OverviewDetails.propTypes = {
  deploymentConfigs: PropTypes.object,
  deployments: PropTypes.object,
  loaded: PropTypes.bool,
  loadError: PropTypes.object,
  pods: PropTypes.object,
  replicationControllers: PropTypes.object,
  replicaSets: PropTypes.object,
  statefulSets: PropTypes.object,
};

export class Overview extends React.Component {
  constructor(props){
    super(props);
    this.selectItem = this.selectItem.bind(this);
    this.state = {
      selectedItem: {}
    };
  }

  selectItem(selectedItem){
    this.setState({selectedItem});
  }

  render() {
    const {namespace, title} = this.props;
    const {selectedItem} = this.state;
    const className = classnames('overview', {'overview--sidebar-shown': !_.isEmpty(selectedItem)});
    const resources = [
      {
        isList: true,
        kind: 'DaemonSet',
        namespace,
        prop: 'daemonSets'
      },
      {
        isList: true,
        kind: 'Deployment',
        namespace,
        prop: 'deployments'
      },
      {
        isList: true,
        kind: 'DeploymentConfig',
        namespace,
        prop: 'deploymentConfigs'
      },
      {
        isList: true,
        kind: 'Pod',
        namespace,
        prop: 'pods'
      },
      {
        isList: true,
        kind: 'ReplicaSet',
        namespace,
        prop: 'replicaSets'
      },
      {
        isList: true,
        kind: 'ReplicationController',
        namespace,
        prop: 'replicationControllers'
      },
      {
        isList: true,
        kind: 'StatefulSet',
        namespace,
        prop: 'statefulSets'
      }
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
          <Firehose resources={resources} forceUpdate={true}>
            <OverviewDetails
              namespace={namespace}
              selectedItem={selectedItem}
              selectItem={this.selectItem}
              title={title}
            />
          </Firehose>
        </div>
      </div>
      {
        !_.isEmpty(selectedItem) &&
        <CSSTransition in appear timeout={1} classNames="overview__sidebar">
          <div className="overview__sidebar">
            <div className="overview__sidebar-dismiss clearfix">
              <CloseButton onClick={() => this.selectItem({})} />
            </div>
            <ResourceOverviewPage
              kind={selectedItem.obj.kind}
              resource={selectedItem.obj}
            />
          </div>
        </CSSTransition>
      }
    </div>;
  }
}

Overview.displayName = 'Overview';

Overview.propTypes = {
  namespace: PropTypes.string,
  title: PropTypes.string
};

export const OverviewPage = ({match}) => {
  const namespace = _.get(match, 'params.ns');
  const title = 'Overview';
  return <React.Fragment>
    <Helmet>
      <title>{title}</title>
    </Helmet>
    <StartGuide dismissible={true} style={{margin: 15}} />
    <Overview namespace={namespace} title={title} />
  </React.Fragment>;
};

OverviewPage.displayName = 'OverviewPage';

OverviewPage.propTypes = {
  match: PropTypes.object.isRequired
};
