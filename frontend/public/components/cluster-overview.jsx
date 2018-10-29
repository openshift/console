import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { HashLink } from 'react-router-hash-link';

import { coFetch, coFetchJSON } from '../co-fetch';
import { NavTitle, AsyncComponent, Firehose, StatusBox, DocumentationLinks, AdditionalSupportLinks } from './utils';
import { k8sBasePath } from '../module/k8s';
import { StartGuide } from './start-guide';
import { Gauge, prometheusBasePath, requirePrometheus } from './graphs';
import { Status, errorStatus } from './graphs/status';
import { EventStreamPage } from './events';
import { SoftwareDetails } from './software-details';
import { formatNamespacedRouteForResource } from '../ui/ui-actions';
import { FLAGS, connectToFlags, flagPending } from '../features';
import { connectToURLs, MonitoringRoutes } from '../monitoring';

const fetchHealth = () => coFetch(`${k8sBasePath}/healthz`)
  .then(response => response.text())
  .then(body => {
    if (body === 'ok') {
      return {short: 'UP', long: 'All good', status: 'OK'};
    }
    return {short: 'ERROR', long: body, status: 'ERROR'};
  })
  .catch(errorStatus);

const fetchConsoleHealth = () => coFetchJSON('health')
  .then(() => ({short: 'UP', long: 'All good', status: 'OK'}))
  .catch(() => ({short: 'ERROR', long: 'The console service cannot be reached', status: 'ERROR'}));


const DashboardLink = ({to, id}) => <Link id={id} className="co-external-link" target="_blank" to={to}>View Grafana Dashboard</Link>;

const Graphs = requirePrometheus(connectToURLs(MonitoringRoutes.AlertManager)(({namespace, isOpenShift, urls}) => {
  // TODO: Revert this change in OpenShift 4.0. In OpenShift 3.11, the scheduler and controller manager is a single component.
  const controllerManagerJob = isOpenShift ? 'kube-controllers' : 'kube-controller-manager';
  const schedulerJob = isOpenShift ? 'kube-controllers' : 'kube-scheduler';
  const alertManagerURL = urls[MonitoringRoutes.AlertManager];
  const alertsURL = alertManagerURL && `${alertManagerURL}/#/alerts`;
  return <React.Fragment>
    <div className="group">
      <div className="group__title">
        <h2 className="h3">Health</h2>
        {!isOpenShift && <DashboardLink id="qa_dashboard_k8s_health" to="/grafana/dashboard/db/kubernetes-cluster-health?orgId=1" />}
      </div>
      <div className="container-fluid group__body">
        <div className="row">
          <div className="col-md-3 col-sm-6">
            <Status title="Kubernetes API" fetch={fetchHealth} />
          </div>
          <div className="col-md-3 col-sm-6">
            <Status title="OpenShift Console" fetch={fetchConsoleHealth} />
          </div>
          <div className="col-md-3 col-sm-6">
            <Status
              title="Alerts Firing"
              name="Alerts"
              query={`sum(ALERTS{alertstate="firing", alertname!="DeadMansSwitch" ${namespace ? `, namespace="${namespace}"` : ''}})`}
              href={alertsURL} target="_blank" rel="noopener"
            />
          </div>
          <div className="col-md-3 col-sm-6">
            <Status
              title="Crashlooping Pods"
              name="Pods"
              query={`count(increase(kube_pod_container_status_restarts_total${namespace ? `{namespace="${namespace}"}` : ''}[1h]) > 5 )`}
              href={`/k8s/${namespace ? `ns/${namespace}` : 'all-namespaces'}/pods?rowFilter-pod-status=CrashLoopBackOff`}
            />
          </div>
        </div>
      </div>
    </div>

    { !namespace &&
      <div className="group">
        <div className="group__title">
          <h2 className="h3">Control Plane Status</h2>
          {!isOpenShift && <DashboardLink to="/grafana/dashboard/db/kubernetes-control-plane-status?orgId=1" />}
        </div>
        <div className="container-fluid group__body group__graphs">
          <div className="row">
            <div className="col-md-3 col-sm-6">
              <Gauge title="API Servers Up" query={'(sum(up{job="apiserver"} == 1) / count(up{job="apiserver"})) * 100'} invert={true} thresholds={{warn: 15, error: 50}} />
            </div>
            <div className="col-md-3 col-sm-6">
              <Gauge title="Controller Managers Up" query={`(sum(up{job="${controllerManagerJob}"} == 1) / count(up{job="${controllerManagerJob}"})) * 100`} invert={true} thresholds={{warn: 15, error: 50}} />
            </div>
            <div className="col-md-3 col-sm-6">
              <Gauge title="Schedulers Up" query={`(sum(up{job="${schedulerJob}"} == 1) / count(up{job="${schedulerJob}"})) * 100`} invert={true} thresholds={{warn: 15, error: 50}} />
            </div>
            <div className="col-md-3 col-sm-6">
              <Gauge title="API Request Success Rate" query={'sum(rate(apiserver_request_count{code=~"2.."}[5m])) / sum(rate(apiserver_request_count[5m])) * 100'} invert={true} thresholds={{warn: 15, error: 30}} />
            </div>
          </div>
        </div>
      </div>
    }

    { !namespace &&
      <div className="group">
        <div className="group__title">
          <h2 className="h3">Capacity Planning</h2>
          {!isOpenShift && <DashboardLink to="/grafana/dashboard/db/kubernetes-capacity-planning?orgId=1" />}
        </div>
        <div className="container-fluid group__body group__graphs">
          <div className="row">
            <div className="col-md-3 col-sm-6">
              <Gauge title="CPU Usage" query={'100 - (sum(rate(node_cpu{job="node-exporter",mode="idle"}[2m])) / count(node_cpu{job="node-exporter", mode="idle"})) * 100'} />
            </div>
            <div className="col-md-3 col-sm-6">
              <Gauge title="Memory Usage" query={'((sum(node_memory_MemTotal) - sum(node_memory_MemFree) - sum(node_memory_Buffers) - sum(node_memory_Cached)) / sum(node_memory_MemTotal)) * 100'} />
            </div>
            <div className="col-md-3 col-sm-6">
              <Gauge title="Disk Usage" query={'(sum(node_filesystem_size{device!="rootfs"}) - sum(node_filesystem_free{device!="rootfs"})) / sum(node_filesystem_size{device!="rootfs"}) * 100'} />
            </div>
            <div className="col-md-3 col-sm-6">
              <Gauge title="Pod Usage" query={'100 - (sum(kube_node_status_capacity_pods) - sum(kube_pod_info)) / sum(kube_node_status_capacity_pods) * 100'} />
            </div>
          </div>
        </div>
      </div>
    }
  </React.Fragment>;
}));

const LimitedGraphs = ({openshiftFlag}) => {
  if (flagPending(openshiftFlag)) {
    return null;
  }
  // Use the shorter 'OpenShift Console' instead of 'OpenShift Container Platform Console' since the title appears in the chart.
  const consoleName = window.SERVER_FLAGS.branding === 'okd' ? 'OKD Console' : 'OpenShift Console';
  return <div className="group">
    <div className="group__title">
      <h2 className="h3">Health</h2>
    </div>
    <div className="container-fluid group__body">
      <div className="row">
        <div className="col-lg-6 col-md-6">
          <Status title="Kubernetes API" fetch={fetchHealth} />
        </div>
        <div className="col-lg-6 col-md-6">
          <Status title={consoleName} fetch={fetchConsoleHealth} />
        </div>
      </div>
    </div>
  </div>;
};

const GraphsPage = ({fake, limited, namespace, openshiftFlag}) => {
  if (flagPending(openshiftFlag)) {
    return null;
  }
  const graphs = limited ? <LimitedGraphs namespace={namespace} openshiftFlag={openshiftFlag} /> : <Graphs namespace={namespace} />;
  const body = <div className="row">
    <div className="col-lg-8 col-md-12">
      {!fake && graphs}
      <div className={classNames('group', {'co-disabled': fake})}>
        <div className="group__title">
          <h2 className="h3">Events</h2>
          <a href={formatNamespacedRouteForResource('events', namespace)}>View All</a>
        </div>
        <div className="group__body group__body--filter-bar">
          <EventStreamPage namespace={namespace} showTitle={false} autoFocus={false} fake={fake} />
        </div>
      </div>
    </div>
    <div className="col-lg-4 col-md-12">
      <div className="group" id="software-info">
        <div className="group__title">
          <h2 className="h3">Software Info</h2>
        </div>
        <div className="container-fluid group__body">
          <SoftwareDetails />
        </div>
      </div>
      <div className="group">
        <div className="group__title">
          <h2 className="h3">Documentation</h2>
        </div>
        <div className="container-fluid group__body group__documentation">
          <DocumentationLinks />
        </div>
      </div>
      <div className="group">
        <div className="group__title">
          <h2 className="h3">Additional Support</h2>
        </div>
        <div className="container-fluid group__body group__additional-support">
          <AdditionalSupportLinks />
        </div>
      </div>
    </div>
  </div>;

  if (!namespace || fake) {
    return body;
  }

  const resources = [{
    kind: openshiftFlag
      ? 'Project'
      : 'Namespace',
    name: namespace,
    isList: false,
    prop: 'data'
  }];

  return <Firehose resources={resources}>
    <StatusBox label="Namespaces">
      { body }
    </StatusBox>
  </Firehose>;
};

const permissionedLoader = () => {
  const AllGraphs = (props) => <GraphsPage {...props} />;
  const SomeGraphs = (props) => <GraphsPage limited {...props} />;
  if (!prometheusBasePath) {
    return Promise.resolve(SomeGraphs);
  }

  // Show events list if user lacks permission to view graphs.
  const q = 'sum(ALERTS{alertstate="firing", alertname!="DeadMansSwitch"})';
  return coFetchJSON(`${prometheusBasePath}/api/v1/query?query=${encodeURIComponent(q)}`)
    .then(
      () => AllGraphs,
      err => {
        if (err.response && err.response.status && err.response.status === 403) {
          return SomeGraphs;
        }
        return AllGraphs;
      }
    );
};

const ClusterOverviewPage_ = props => {
  const { OPENSHIFT: openshiftFlag, PROJECTS_AVAILABLE: projectsFlag } = props.flags;
  const fake = !flagPending(openshiftFlag) && !flagPending(projectsFlag) && openshiftFlag && !projectsFlag;
  const namespace = _.get(props, 'match.params.ns');
  const title = namespace ? `Status of ${ namespace }` : 'Cluster Status';

  return <React.Fragment>
    <StartGuide dismissible={true} style={{margin: 15}} />
    <Helmet>
      <title>{fake ? 'Overview' : title}</title>
    </Helmet>
    <NavTitle title={fake ? 'Overview' : title} style={{alignItems: 'baseline', display: 'flex', justifyContent: 'space-between'}}>
      <p className="hidden-lg">
        <HashLink smooth to="#software-info">Software Info</HashLink>
      </p>
    </NavTitle>
    <div className="cluster-overview-cell container-fluid">
      <AsyncComponent namespace={namespace} loader={permissionedLoader} openshiftFlag={openshiftFlag} fake={fake} />
    </div>
  </React.Fragment>;
};

export const ClusterOverviewPage = connectToFlags(FLAGS.OPENSHIFT, FLAGS.PROJECTS_AVAILABLE)(ClusterOverviewPage_);
