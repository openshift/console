import * as _ from 'lodash';
import * as React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';

import { coFetch, coFetchJSON } from '../co-fetch';
import { NavTitle, AsyncComponent } from './utils';
import { k8sBasePath } from '../module/k8s';
import { SecurityScanningOverview } from './secscan/security-scan-overview';
import { StartGuide } from './start-guide';
import { Gauge, prometheusBasePath } from './graphs';
import { Status, errorStatus } from './graphs/status';
import { EventStreamPage } from './events';
import { SoftwareDetails } from './software-details';


/* eslint-disable react/jsx-no-target-blank */
const Documentation = () => <div>
  <dl>
    <dt className="co-p-cluster__doc-title"><a href="https://coreos.com/tectonic/docs/latest/account/manage-account.html" target="_blank" rel="noopener">Manage Your Account</a></dt>
    <dd className="co-p-cluster__doc-description">You can manage your Tectonic account at <a href="https://account.coreos.com" target="_blank" rel="noopener">account.coreos.com</a> for access to licenses, billing details, invoices, and account users.</dd>
    <dt className="co-p-cluster__doc-title"><a href="https://coreos.com/tectonic/docs/latest/usage/" target="_blank" rel="noopener">End User Guide</a></dt>
    <dd className="co-p-cluster__doc-description">End-users of Tectonic are expected to deploy applications directly in Kubernetes. Your application&rsquo;s architecture will drive how you assemble these components together.</dd>
    <dt className="co-p-cluster__doc-title">Additional Support</dt>
    <dd className="co-p-cluster__doc-description">
      <p><Link to="/start-guide"><span className="fa fa-fw fa-info-circle"></span>Quick Start Guide</Link></p>
      <p><a href="https://coreos.com/tectonic/docs/latest/" target="_blank" rel="noopener"><span className="fa fa-fw fa-book"></span>Full Documentation</a></p>
      <p><a href="https://github.com/coreos/tectonic-forum" target="_blank" rel="noopener noreferrer"><span className="fa fa-fw fa-comments-o"></span>Tectonic Forum</a></p>
    </dd>
  </dl>
</div>;
/* eslint-enable react/jsx-no-target-blank */

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


const DashboardLink = ({to, id}) => <div className="pull-right" style={{marginTop: 12}}>
  <Link id={id} target="_blank" to={to}>View Grafana Dashboard&nbsp;&nbsp;<i className="fa fa-external-link" /></Link>
</div>;


const Graphs = ({namespace}) => <div>
  <div className="row">
    <div className="col-xs-12 group">
      <div className="group__title">
        <DashboardLink id="qa_dashboard_k8s_health" to="/grafana/dashboard/db/kubernetes-cluster-health?orgId=1" />
        <h4>Health</h4>
      </div>
      <div className="group__body">
        <div className="row">
          <div className="col-lg-3 col-md-6">
            <Status title="Kubernetes API" fetch={fetchHealth} />
          </div>
          <div className="col-lg-3 col-md-6">
            <Status title="Tectonic Console" fetch={fetchTectonicHealth} />
          </div>
          <div className="col-lg-3 col-md-6">
            <Status
              title="Alerts Firing"
              name="Alerts"
              query={`sum(ALERTS{alertstate="firing", alertname!="DeadMansSwitch" ${namespace ? `, namespace="${namespace}"` : ''}})`}
              href="/alertmanager/#/alerts" target="_blank" rel="noopener"
            />
          </div>
          <div className="col-lg-3 col-md-6">
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
  </div>

  { !namespace &&
    <div className="row">
      <div className="col-xs-12 group">
        <div className="group__title">
          <DashboardLink to="/grafana/dashboard/db/kubernetes-control-plane-status?orgId=1" />
          <h4>Control Plane Status</h4>
        </div>
        <div className="group__body">
          <div className="row">
            <div className="col-lg-3 col-md-6">
              <Gauge title="API Servers Up" query={'(sum(up{job="apiserver"} == 1) / count(up{job="apiserver"})) * 100'} invert={true} thresholds={{warn: 15, error: 50}} />
            </div>
            <div className="col-lg-3 col-md-6">
              <Gauge title="Controller Managers Up" query={'(sum(up{job="kube-controller-manager"} == 1) / count(up{job="kube-controller-manager"})) * 100'} invert={true} thresholds={{warn: 15, error: 50}} />
            </div>
            <div className="col-lg-3 col-md-6">
              <Gauge title="Schedulers Up" query={'(sum(up{job="kube-scheduler"} == 1) / count(up{job="kube-scheduler"})) * 100'} invert={true} thresholds={{warn: 15, error: 50}} />
            </div>
            <div className="col-lg-3 col-md-6">
              <Gauge title="API Request Success Rate" query={'sum(rate(apiserver_request_count{code=~"2.."}[5m])) / sum(rate(apiserver_request_count[5m])) * 100'} invert={true} thresholds={{warn: 15, error: 30}} />
            </div>
          </div>
        </div>
      </div>
    </div>
  }

  { !namespace &&
    <div className="row">
      <div className="col-xs-12 group">
        <div className="group__title">
          <DashboardLink to="/grafana/dashboard/db/kubernetes-capacity-planning?orgId=1" />
          <h4>Capacity Planning</h4>
        </div>
        <div className="group__body">
          <div className="row">
            <div className="col-lg-3 col-md-6">
              <Gauge title="CPU Usage" query={'100 - (sum(rate(node_cpu{job="node-exporter",mode="idle"}[2m])) / count(node_cpu{job="node-exporter", mode="idle"})) * 100'} />
            </div>
            <div className="col-lg-3 col-md-6">
              <Gauge title="Memory Usage" query={'((sum(node_memory_MemTotal) - sum(node_memory_MemFree) - sum(node_memory_Buffers) - sum(node_memory_Cached)) / sum(node_memory_MemTotal)) * 100'} />
            </div>
            <div className="col-lg-3 col-md-6">
              <Gauge title="Disk Usage" query={'(sum(node_filesystem_size{device!="rootfs"}) - sum(node_filesystem_free{device!="rootfs"})) / sum(node_filesystem_size{device!="rootfs"}) * 100'} />
            </div>
            <div className="col-lg-3 col-md-6">
              <Gauge title="Pod Usage" query={'100 - (sum(kube_node_status_capacity_pods) - sum(kube_pod_info)) / sum(kube_node_status_capacity_pods) * 100'} />
            </div>
          </div>
        </div>
      </div>
    </div>
  }
</div>;

const LimitedGraphs = () => <div>
  <div className="row">
    <div className="col-xs-12 group">
      <div className="group__title">
        <h4>Health</h4>
      </div>
      <div className="group__body">
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
  </div>
</div>;

const GraphsPage = ({limited, namespace}) => <div>
  <div className="row">
    <div className="col-xs-12">
      {limited ? <LimitedGraphs namespace={namespace} /> : <Graphs namespace={namespace} /> }
    </div>
  </div>
  <div className="row">
    <div className="col-xs-12 group">
      <div className="group__title">
        <div className="pull-right" style={{marginTop: 12}}>
          <a href="/k8s/all-namespaces/events">View All</a>
        </div>
        <h4>Events</h4>
      </div>
      <div className="group__body" style={{paddingLeft: 0, paddingRight: 0}}>
        <EventStreamPage namespace={namespace} showTitle={false} />
      </div>
    </div>
  </div>
  <div className="row">
    <div className="col-md-6 group">
      <div className="group__title">
        <div className="pull-right" style={{marginTop: 12}}>
          {// eslint-disable-next-line react/jsx-no-target-blank
          } <a href="https://coreos.com/tectonic/releases/" target="_blank" rel="noopener">Release Notes&nbsp;&nbsp;<i className="fa fa-external-link" /></a>
        </div>
        <h4>Software Info</h4>
      </div>
      <div className="group__body">
        <SoftwareDetails />
      </div>
    </div>
    <div className="col-md-6 group">
      <div className="group__title">
        <div className="pull-right" style={{marginTop: 12}}>
          {// eslint-disable-next-line react/jsx-no-target-blank
          } <a href="https://coreos.com/tectonic/docs/latest/" target="_blank" rel="noopener">Full Documentation&nbsp;&nbsp;<i className="fa fa-external-link" /></a>
        </div>
        <h4>Documentation</h4>
      </div>
      <div className="group__body">
        <Documentation />
      </div>
    </div>
  </div>
</div>;

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
  return <div className="co-p-cluster">
    <div className="co-p-cluster__body">
      <StartGuide dismissible={true} />
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <NavTitle title={title} />
      <div className="cluster-overview-cell co-m-pane">
        <AsyncComponent namespace={namespace} loader={permissionedLoader} />
      </div>
      <br />
      <SecurityScanningOverview
        {...props}
        required="SECURITY_LABELLER"
      />
    </div>
  </div>;
};
