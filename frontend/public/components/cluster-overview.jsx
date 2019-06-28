import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { Helmet } from 'react-helmet';

import { EventsList } from './events';
import { SoftwareDetails } from './software-details';
import { withStartGuide } from './start-guide';
import { coFetchJSON } from '../co-fetch';
import { ConsoleHealth, KubernetesHealth, Health } from './graphs/health';
import { connectToFlags, flagPending } from '../reducers/features';
import { FLAGS } from '../const';
import { Gauge, PROMETHEUS_BASE_PATH, requirePrometheus, ThresholdColor } from './graphs';
import {
  AdditionalSupportLinks,
  AsyncComponent,
  DocumentationLinks,
  Firehose,
  PageHeading,
  StatusBox,
} from './utils';

const Graphs = requirePrometheus(({namespace}) => {
  return <React.Fragment>
    <div className="group">
      <div className="group__title">
        <h2 className="h3">Health</h2>
      </div>
      <div className="container-fluid group__body">
        <Health namespace={namespace} />
      </div>
    </div>
    { !namespace &&
      <div className="group">
        <div className="group__title">
          <h2 className="h3">Control Plane Status</h2>
        </div>
        <div className="container-fluid group__body group__graphs">
          <div className="row">
            <div className="col-md-3 col-sm-6">
              <Gauge
                invert
                query={'(sum(up{job="apiserver"} == 1) / count(up{job="apiserver"})) * 100'}
                remainderLabel="down"
                thresholds={[
                  {
                    value: 85,
                    color: ThresholdColor.WARN,
                  },
                  {
                    value: 50,
                    color: ThresholdColor.ERROR,
                  },
                ]}
                title="API Servers Up"
                usedLabel="up"
              />
            </div>
            <div className="col-md-3 col-sm-6">
              <Gauge
                remainderLabel="down"
                query={'(sum(up{job="kube-controller-manager"} == 1) / count(up{job="kube-controller-manager"})) * 100'}
                invert
                thresholds={[
                  {
                    value: 85,
                    color: ThresholdColor.WARN,
                  },
                  {
                    value: 50,
                    color: ThresholdColor.ERROR,
                  },
                ]}
                title="Controller Managers Up"
                usedLabel="up"
              />
            </div>
            <div className="col-md-3 col-sm-6">
              <Gauge
                invert
                query={'(sum(up{job="scheduler"} == 1) / count(up{job="scheduler"})) * 100'}
                remainderLabel="down"
                thresholds={[
                  {
                    value: 85,
                    color: ThresholdColor.WARN,
                  },
                  {
                    value: 50,
                    color: ThresholdColor.ERROR,
                  },
                ]}
                title="Schedulers Up"
                usedLabel="up"
              />
            </div>
            <div className="col-md-3 col-sm-6">
              <Gauge
                invert
                query={'sum(rate(apiserver_request_count{code=~"2.."}[5m])) / sum(rate(apiserver_request_count[5m])) * 100'}
                remainderLabel="failure"
                thresholds={[
                  {
                    value: 85,
                    color: ThresholdColor.WARN,
                  },
                  {
                    value: 70,
                    color: ThresholdColor.ERROR,
                  },
                ]}
                title="API Request Success Rate"
                usedLabel="success"
              />
            </div>
          </div>
        </div>
      </div>
    }
    { !namespace &&
      <div className="group">
        <div className="group__title">
          <h2 className="h3">Capacity Planning</h2>
        </div>
        <div className="container-fluid group__body group__graphs">
          <div className="row">
            <div className="col-md-3 col-sm-6">
              <Gauge
                query={'(sum(node:node_cpu_utilisation:avg1m) / count(node:node_cpu_utilisation:avg1m)) * 100'}
                title="CPU Usage"
              />
            </div>
            <div className="col-md-3 col-sm-6">
              <Gauge
                query={'(sum(node:node_memory_utilisation:)) / count(node:node_memory_utilisation:) * 100'}
                title="Memory Usage"
              />
            </div>
            <div className="col-md-3 col-sm-6">
              <Gauge
                query={'(sum(node:node_filesystem_usage:)) / count(node:node_filesystem_usage:) * 100'}
                title="Disk Usage"
              />
            </div>
            <div className="col-md-3 col-sm-6">
              <Gauge
                query={'100 - (sum(kube_node_status_capacity_pods) - sum(kube_pod_info)) / sum(kube_node_status_capacity_pods) * 100'}
                title="Pod Usage"
              />
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
  if (!PROMETHEUS_BASE_PATH) {
    return Promise.resolve(SomeGraphs);
  }

  // Show events list if user lacks permission to view graphs.
  const q = 'sum(ALERTS{alertstate="firing", alertname!="Watchdog"})';
  return coFetchJSON(`${PROMETHEUS_BASE_PATH}/api/v1/query?query=${encodeURIComponent(q)}`)
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
