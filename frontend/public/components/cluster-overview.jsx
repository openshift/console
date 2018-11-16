import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';

import { EventsList } from './events';
import { SoftwareDetails } from './software-details';
import { withStartGuide } from './start-guide';
import { coFetchJSON } from '../co-fetch';
import { ConsoleHealth, KubernetesHealth, Health } from './graphs/health';
import { FLAGS, connectToFlags, flagPending } from '../features';
import { Gauge, prometheusBasePath, requirePrometheus } from './graphs';
import {
  AdditionalSupportLinks,
  AsyncComponent,
  DocumentationLinks,
  Firehose,
  PageHeading,
  StatusBox,
} from './utils';


const DashboardLink = ({to, id}) => <Link id={id} className="co-external-link" target="_blank" to={to}>View Grafana Dashboard</Link>;

const Graphs = requirePrometheus(({namespace, isOpenShift}) => {
  // TODO: Revert this change in OpenShift 4.0. In OpenShift 3.11, the scheduler and controller manager is a single component.
  const controllerManagerJob = isOpenShift ? 'kube-controllers' : 'kube-controller-manager';
  const schedulerJob = isOpenShift ? 'kube-controllers' : 'kube-scheduler';
  return <React.Fragment>
    <div className="group">
      <div className="group__title">
        <h2 className="h3">Health</h2>
        {!isOpenShift && <DashboardLink id="qa_dashboard_k8s_health" to="/grafana/dashboard/db/kubernetes-cluster-health?orgId=1" />}
      </div>
      <div className="container-fluid group__body">
        <Health namespace={namespace} />
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
});

const LimitedGraphs = () => {
  return <div className="group">
    <div className="group__title">
      <h2 className="h3">Health</h2>
    </div>
    <div className="container-fluid group__body">
      <div className="row">
        <div className="col-lg-6 col-md-6">
          <KubernetesHealth />
        </div>
        <div className="col-lg-6 col-md-6">
          <ConsoleHealth />
        </div>
      </div>
    </div>
  </div>;
};

const GraphsPage = connectToFlags(FLAGS.OPENSHIFT)(({flags, mock, limited, namespace}) => {
  const openShiftFlag = flags[FLAGS.OPENSHIFT];

  if (flagPending(openShiftFlag)) {
    return null;
  }

  const graphs = limited ? <LimitedGraphs namespace={namespace} /> : <Graphs namespace={namespace} isOpenShift={openShiftFlag} />;
  const body = <div className="row">
    <div className="col-lg-8 col-md-12">
      {!mock && graphs}
      <div className={classNames('group', {'co-disabled': mock})}>
        <div className="group__title">
          <h2 className="h3">Events</h2>
        </div>
        <div className="group__body group__body--filter-bar">
          <EventsList namespace={namespace} showTitle={false} autoFocus={false} mock={mock} />
        </div>
      </div>
    </div>
    <div className="col-lg-4 col-md-12">
      <div className="group">
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

  if (!namespace || mock) {
    return body;
  }

  const resources = [{
    kind: openShiftFlag ? 'Project' : 'Namespace',
    name: namespace,
    isList: false,
    prop: 'data',
  }];

  return <Firehose resources={resources}>
    <StatusBox label="Namespaces">
      { body }
    </StatusBox>
  </Firehose>;
});

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

export const ClusterOverviewPage = withStartGuide(({match, noProjectsAvailable}) => {
  const namespace = _.get(match, 'params.ns');
  const title = namespace ? `Status of ${ namespace }` : 'Cluster Status';
  return <React.Fragment>
    <Helmet>
      <title>{noProjectsAvailable ? 'Overview' : title}</title>
    </Helmet>
    <PageHeading title={noProjectsAvailable ? 'Overview' : title} />
    <div className="cluster-overview-cell container-fluid">
      <AsyncComponent namespace={namespace} loader={permissionedLoader} mock={noProjectsAvailable} />
    </div>
  </React.Fragment>;
}, true);
