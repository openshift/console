import * as React from 'react';
import * as _ from 'lodash';
import { Link } from 'react-router-dom';
import { Alert, AlertActionCloseButton } from '@patternfly/react-core';
import { ServiceModel as KnativeServiceModel } from '@console/knative-plugin';
import {
  K8sResourceKind,
  referenceForModel,
  referenceFor,
  modelFor,
} from '@console/internal/module/k8s';
import {
  DeploymentConfigModel,
  DeploymentModel,
  DaemonSetModel,
  StatefulSetModel,
} from '@console/internal/models';
import { STORAGE_PREFIX } from '../../constants';
import './HealthChecksAlert.scss';

type HealthChecksAlertProps = {
  resource: K8sResourceKind;
};

const HIDE_HEALTH_CHECK_ALERT_FOR = `${STORAGE_PREFIX}/hide-health-check-alert-for`;

const addHealthChecksRefs = [
  referenceForModel(DeploymentConfigModel),
  referenceForModel(DeploymentModel),
  referenceForModel(DaemonSetModel),
  referenceForModel(StatefulSetModel),
  referenceForModel(KnativeServiceModel),
];

const HealthChecksAlert: React.FC<HealthChecksAlertProps> = ({ resource }) => {
  const [hideHealthCheckAlertFor, setHideHealthCheckAlertFor] = React.useState([]);

  React.useEffect(() => {
    setHideHealthCheckAlertFor(JSON.parse(localStorage.getItem(HIDE_HEALTH_CHECK_ALERT_FOR)) || []);
  }, []);

  if (!_.includes(addHealthChecksRefs, referenceFor(resource))) {
    return null;
  }

  const containers = resource?.spec?.template?.spec?.containers;
  const containersName = containers?.map((container) => container.name);
  const healthCheckAdded = _.every(
    containers,
    (container) => container.readinessProbe || container.livenessProbe || container.startupProbe,
  );
  const {
    kind,
    metadata: { name, namespace, uid },
  } = resource;

  const handleAlertAction = () => {
    const hideHealthCheckAlert = [...hideHealthCheckAlertFor, uid];
    setHideHealthCheckAlertFor(hideHealthCheckAlert);
    localStorage.setItem(HIDE_HEALTH_CHECK_ALERT_FOR, JSON.stringify(hideHealthCheckAlert));
  };

  const showAlert = !healthCheckAdded && !_.includes(hideHealthCheckAlertFor, uid);

  const kindForCRDResource = referenceFor(resource);
  const resourceKind = modelFor(kindForCRDResource).crd ? kindForCRDResource : kind;

  const addHealthChecksLink = `/k8s/ns/${namespace}/${resourceKind}/${name}/containers/${containersName[0]}/health-checks`;

  return (
    <>
      {showAlert ? (
        <div className="ocs-health-checks-alert">
          <Alert
            variant="default"
            title="Health Checks"
            action={<AlertActionCloseButton onClose={handleAlertAction} />}
            isInline
          >
            {_.size(containersName) > 1
              ? 'Not all containers'
              : `Container ${_.map(containersName)} does not`}{' '}
            have health checks to ensure your application is running correctly.{' '}
            <Link to={addHealthChecksLink}>Add Health Checks</Link>
          </Alert>
        </div>
      ) : null}
    </>
  );
};

export default HealthChecksAlert;
