import * as React from 'react';
import { Alert, AlertActionCloseButton } from '@patternfly/react-core';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAccessReview } from '@console/internal/components/utils';
import {
  DeploymentConfigModel,
  DeploymentModel,
  DaemonSetModel,
  StatefulSetModel,
} from '@console/internal/models';
import {
  K8sResourceKind,
  referenceForModel,
  referenceFor,
  modelFor,
} from '@console/internal/module/k8s';
import { ServiceModel as KnativeServiceModel } from '@console/knative-plugin';
import { STORAGE_PREFIX, USERSETTINGS_PREFIX } from '../../constants';
import { useUserSettingsCompatibility } from '../../hooks/useUserSettingsCompatibility';

import './HealthChecksAlert.scss';

const HIDE_HEALTH_CHECK_ALERT_FOR = `${STORAGE_PREFIX}/hide-health-check-alert-for`;
const HEALTH_CHECK_CONFIGMAP_KEY = `${USERSETTINGS_PREFIX}.healthChecks`;

type HealthChecksAlertProps = {
  resource: K8sResourceKind;
};

const addHealthChecksRefs = [
  referenceForModel(DeploymentConfigModel),
  referenceForModel(DeploymentModel),
  referenceForModel(DaemonSetModel),
  referenceForModel(StatefulSetModel),
  referenceForModel(KnativeServiceModel),
];

const HealthChecksAlert: React.FC<HealthChecksAlertProps> = ({ resource }) => {
  const {
    kind,
    metadata: { name, namespace, uid },
  } = resource;
  const [
    hideHealthCheckAlertFor,
    setHideHealthCheckAlertFor,
    loaded,
  ] = useUserSettingsCompatibility<string[]>(
    HEALTH_CHECK_CONFIGMAP_KEY,
    HIDE_HEALTH_CHECK_ALERT_FOR,
    [],
  );
  const { t } = useTranslation();
  const kindForCRDResource = referenceFor(resource);
  const resourceModel = modelFor(kindForCRDResource);
  const resourceKind = resourceModel.crd ? kindForCRDResource : kind;

  const canAddHealthChecks = useAccessReview({
    group: resourceModel.apiGroup,
    resource: resourceModel.plural,
    namespace,
    name,
    verb: 'update',
  });

  if (!_.includes(addHealthChecksRefs, referenceFor(resource))) {
    return null;
  }

  const containers = resource?.spec?.template?.spec?.containers;
  const containersName = containers?.map((container) => container.name);
  const healthCheckAdded = _.every(
    containers,
    (container) => container.readinessProbe || container.livenessProbe || container.startupProbe,
  );

  const handleAlertAction = () => {
    if (loaded) {
      setHideHealthCheckAlertFor((state) => [...state, uid]);
    }
  };

  const showAlert =
    loaded && !healthCheckAdded && !_.includes(hideHealthCheckAlertFor, uid) && canAddHealthChecks;

  const addHealthChecksLink = `/k8s/ns/${namespace}/${resourceKind}/${name}/containers/${containersName[0]}/health-checks`;

  const alertMessage =
    _.size(containersName) > 1
      ? t(
          'console-shared~Not all Containers have health checks to ensure your Application is running correctly.',
        )
      : t(
          'console-shared~Container {{containersName}} does not have health checks to ensure your Application is running correctly.',
          { containersName: _.map(containersName) },
        );

  return (
    <>
      {showAlert ? (
        <div className="ocs-health-checks-alert">
          <Alert
            variant="default"
            title={t('console-shared~Health checks')}
            actionClose={<AlertActionCloseButton onClose={handleAlertAction} />}
            isInline
          >
            {alertMessage}{' '}
            <Link to={addHealthChecksLink}>{t('console-shared~Add health checks')}</Link>
          </Alert>
        </div>
      ) : null}
    </>
  );
};

export default HealthChecksAlert;
