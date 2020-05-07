import * as React from 'react';
import { connect } from 'react-redux';

import { Status, errorStatus } from './';
import { coFetch, coFetchJSON } from '../../co-fetch';
import { FLAGS } from '@console/shared';
import { k8sBasePath } from '../../module/k8s';

// Use the shorter 'OpenShift Console' instead of 'OpenShift Container Platform Console' since the title appears in the chart.
const consoleName = window.SERVER_FLAGS.branding === 'okd' ? 'OKD Console' : 'OpenShift Console';

const fetchHealth = () =>
  coFetch(`${k8sBasePath}/healthz`)
    .then((response) => response.text())
    .then((body) => {
      if (body === 'ok') {
        return { short: 'UP', long: 'All good', status: 'OK' };
      }
      return { short: 'ERROR', long: body, status: 'ERROR' };
    })
    .catch(errorStatus);

const fetchConsoleHealth = () =>
  coFetchJSON('health')
    .then(() => ({ short: 'UP', long: 'All good', status: 'OK' }))
    .catch(() => ({
      short: 'ERROR',
      long: 'The console service cannot be reached',
      status: 'ERROR',
    }));

export const KubernetesHealth = () => <Status title="Kubernetes API" fetch={fetchHealth} />;

export const ConsoleHealth = () => <Status title={consoleName} fetch={fetchConsoleHealth} />;

const alertsFiringStateToProps = (state) => ({
  canAccessMonitoring: !!state.FLAGS.get(FLAGS.CAN_GET_NS),
});

const AlertsFiring_ = ({ canAccessMonitoring, namespace }) => {
  const toProp =
    canAccessMonitoring && !!window.SERVER_FLAGS.prometheusBaseURL ? { to: '/monitoring' } : {};
  return (
    <Status
      {...toProp}
      title="Alerts Firing"
      name="Alerts"
      namespace={namespace}
      query={`sum(ALERTS{alertstate="firing", alertname!="Watchdog" ${
        namespace ? `, namespace="${namespace}"` : ''
      }})`}
    />
  );
};
const AlertsFiring = connect(alertsFiringStateToProps)(AlertsFiring_);

const CrashloopingPods = ({ namespace }) => (
  <Status
    title="Crashlooping Pods"
    name="Pods"
    namespace={namespace}
    query={`count(increase(kube_pod_container_status_restarts_total${
      namespace ? `{namespace="${namespace}"}` : ''
    }[1h]) > 5 )`}
    to={`/k8s/${
      namespace ? `ns/${namespace}` : 'all-namespaces'
    }/pods?rowFilter-pod-status=CrashLoopBackOff`}
  />
);

export const Health = ({ namespace }) => (
  <div className="row">
    <div className="col-md-3 col-sm-6">
      <KubernetesHealth />
    </div>
    <div className="col-md-3 col-sm-6">
      <ConsoleHealth />
    </div>
    <div className="col-md-3 col-sm-6">
      <AlertsFiring namespace={namespace} />
    </div>
    <div className="col-md-3 col-sm-6">
      <CrashloopingPods namespace={namespace} />
    </div>
  </div>
);
