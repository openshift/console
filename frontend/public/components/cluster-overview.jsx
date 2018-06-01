import * as _ from 'lodash-es';
import * as React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';

import { coFetch, coFetchJSON } from '../co-fetch';
import { NavTitle, AsyncComponent, Firehose, StatusBox, tectonicHelpBase, OpenShiftDocumentationLinks, TectonicDocumentationLinks, OpenShiftAdditionalSupportLinks, TectonicAdditionalSupportLinks } from './utils';
import { k8sBasePath } from '../module/k8s';
import { SecurityScanningOverview } from './secscan/security-scan-overview';
import { StartGuide } from './start-guide';
import { Gauge, prometheusBasePath } from './graphs';
import { Status, errorStatus } from './graphs/status';
import { EventStreamPage } from './events';
import { SoftwareDetails } from './software-details';
import { formatNamespacedRouteForResource } from '../ui/ui-actions';
import { FLAGS, connectToFlags } from '../features';

const fetchHealth = () => coFetch(`${k8sBasePath}/healthz`)
  .then(response => response.text())
  .then(body => {
    if (body === 'ok') {
      return {short: 'UP', long: 'All good', status: 'OK'};
    }
    return {short: 'ERROR', long: body, status: 'ERROR'};
  })
  .catch(errorStatus);

const fetchTectonicHealth = () => coFetchJSON('health')
  .then(() => ({short: 'UP', long: 'All good', status: 'OK'}))
  .catch(() => ({short: 'ERROR', long: 'The console service cannot be reached', status: 'ERROR'}));


const DashboardLink = ({to, id}) => <Link id={id} className="co-external-link" target="_blank" to={to}>View Grafana Dashboard</Link>;


const Graphs = ({namespace}) => <React.Fragment>
  <div className="group">
    <div className="group__title">
      <h2 className="h3">Health</h2>
      <DashboardLink id="qa_dashboard_k8s_health" to="/grafana/dashboard/db/kubernetes-cluster-health?orgId=1" />
    </div>
    <div className="container-fluid group__body">
      <div className="row">
        <div className="col-md-3 col-sm-6">
          <Status title="Kubernetes API" fetch={fetchHealth} />
        </div>
        <div className="col-md-3 col-sm-6">
          <Status title="Tectonic Console" fetch={fetchTectonicHealth} />
        </div>
        <div className="col-md-3 col-sm-6">
          <Status
            title="Alerts Firing"
            name="Alerts"
            query={`sum(ALERTS{alertstate="firing", alertname!="DeadMansSwitch" ${namespace ? `, namespace="${namespace}"` : ''}})`}
            href="/alertmanager/#/alerts" target="_blank" rel="noopener"
          />
        </div>
        <div className="col-md-3 col-sm-6">
          <Status
            title="Crashlooping Pods"
            name="Pods"
            query={`count(increase(kube_pod_container_status_restarts${namespace ? `{namespace="${namespace}"}` : ''}[1h]) > 5 )`}
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
        <DashboardLink to="/grafana/dashboard/db/kubernetes-control-plane-status?orgId=1" />
      </div>
      <div className="container-fluid group__body group__graphs">
        <div className="row">
          <div className="col-md-3 col-sm-6">
            <Gauge title="API Servers Up" query={'(sum(up{job="apiserver"} == 1) / count(up{job="apiserver"})) * 100'} invert={true} thresholds={{warn: 15, error: 50}} />
          </div>
          <div className="col-md-3 col-sm-6">
            <Gauge title="Controller Managers Up" query={'(sum(up{job="kube-controller-manager"} == 1) / count(up{job="kube-controller-manager"})) * 100'} invert={true} thresholds={{warn: 15, error: 50}} />
          </div>
          <div className="col-md-3 col-sm-6">
            <Gauge title="Schedulers Up" query={'(sum(up{job="kube-scheduler"} == 1) / count(up{job="kube-scheduler"})) * 100'} invert={true} thresholds={{warn: 15, error: 50}} />
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
        <DashboardLink to="/grafana/dashboard/db/kubernetes-capacity-planning?orgId=1" />
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

const LimitedGraphs = () => <React.Fragment>
  <div className="group">
    <div className="group__title">
      <h2 className="h3">Health</h2>
    </div>
    <div className="container-fluid group__body">
      <div className="row">
        <div className="col-lg-6 col-md-6">
          <Status title="Kubernetes API" fetch={fetchHealth} />
        </div>
        <div className="col-lg-6 col-md-6">
          <Status title="Tectonic Console" fetch={fetchTectonicHealth} />
        </div>
      </div>
    </div>
  </div>
</React.Fragment>;

const GraphsPage = connectToFlags(FLAGS.OPENSHIFT)(({limited, namespace, flags}) => {
  const openshiftFlag = flags[FLAGS.OPENSHIFT];
  if (openshiftFlag === undefined) {
    return null;
  }

  const body = <div className="row">
    <div className="col-lg-8 col-md-12">
      {!openshiftFlag && (limited ? <LimitedGraphs namespace={namespace} /> : <Graphs namespace={namespace} />)}
      <div className="group">
        <div className="group__title">
          <h2 className="h3">Events</h2>
          <a href={formatNamespacedRouteForResource('events', namespace)}>View All</a>
        </div>
        <div className="group__body">
          <EventStreamPage namespace={namespace} showTitle={false} autoFocus={false} />
        </div>
      </div>
    </div>
    <div className="col-lg-4 col-md-12">
      <div className="group">
        <div className="group__title">
          <h2 className="h3">Software Info</h2>
          {!openshiftFlag && <a href="https://coreos.com/tectonic/releases/" target="_blank" className="co-external-link" rel="noopener noreferrer">Release Notes</a>}
        </div>
        <div className="container-fluid group__body">
          <SoftwareDetails />
        </div>
      </div>
      <div className="group">
        <div className="group__title">
          <h2 className="h3">Documentation</h2>
          {!openshiftFlag && <a href={tectonicHelpBase} target="_blank" className="co-external-link" rel="noopener noreferrer">Full Documentation</a>}
        </div>
        <div className="container-fluid group__body group__documentation">
          {openshiftFlag ? <OpenShiftDocumentationLinks /> : <TectonicDocumentationLinks />}
        </div>
      </div>
      <div className="group">
        <div className="group__title">
          <h2 className="h3">Additional Support</h2>
        </div>
        <div className="container-fluid group__body group__additional-support">
          {openshiftFlag ? <OpenShiftAdditionalSupportLinks /> : <TectonicAdditionalSupportLinks />}
        </div>
      </div>
    </div>
  </div>;

  if (!namespace) {
    return body;
  }
  return <Firehose resources={[{kind: 'Namespace', name: namespace, isList: false, prop: 'data'}]}>
    <StatusBox label="Namespaces">
      { body }
    </StatusBox>
  </Firehose>;
});

const permissionedLoader = () => {
  const AllGraphs = ({namespace}) => <GraphsPage namespace={namespace} />;
  const SomeGraphs = ({namespace}) => <GraphsPage namespace={namespace} limited />;
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

export const ClusterOverviewPage = props => {
  const namespace = _.get(props, 'match.params.ns');
  let title = 'Cluster Status';
  if (namespace) {
    title = `Status of ${ namespace }`;
  }
  return <React.Fragment>
    <StartGuide dismissible={true} style={{margin: 15}} />
    <Helmet>
      <title>{title}</title>
    </Helmet>
    <NavTitle title={title} />
    <div className="cluster-overview-cell container-fluid">
      <AsyncComponent namespace={namespace} loader={permissionedLoader} />
    </div>
    <br />
    <SecurityScanningOverview
      {...props}
      required="SECURITY_LABELLER"
    />
  </React.Fragment>;
};
