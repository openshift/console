import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { DetailsResourceAlertContent } from '@console/dynamic-plugin-sdk';
import { useAccessReview } from '@console/internal/components/utils';
import {
  DaemonSetModel,
  DeploymentConfigModel,
  DeploymentModel,
  StatefulSetModel,
} from '@console/internal/models';
import { modelFor, referenceFor, referenceForModel } from '@console/internal/module/k8s';
import { ServiceModel as KnativeServiceModel } from '@console/knative-plugin';
import { getResource } from '../../utils';

const addHealthChecksRefs = [
  referenceForModel(DeploymentConfigModel),
  referenceForModel(DeploymentModel),
  referenceForModel(DaemonSetModel),
  referenceForModel(StatefulSetModel),
  referenceForModel(KnativeServiceModel),
];

export const useHealthChecksAlert = (element: GraphElement): DetailsResourceAlertContent | null => {
  const resource = getResource(element);
  const kind = resource?.kind;
  const name = resource?.metadata?.name;
  const namespace = resource?.metadata?.namespace;
  const { t } = useTranslation();
  const kindForCRDResource = resource ? referenceFor(resource) : undefined;
  const resourceModel = kindForCRDResource ? modelFor(kindForCRDResource) : undefined;
  const resourceKind = resourceModel?.crd ? kindForCRDResource : kind;

  const canAddHealthChecks = useAccessReview({
    group: resourceModel?.apiGroup,
    resource: resourceModel?.plural,
    namespace,
    name,
    verb: 'update',
  });

  if (!resource || !addHealthChecksRefs.includes(referenceFor(resource))) {
    return null;
  }

  const containers = resource?.spec?.template?.spec?.containers;
  const containersName = containers?.map((container) => container.name);
  const healthCheckAdded = containers?.every(
    (container) => container.readinessProbe || container.livenessProbe || container.startupProbe,
  );

  const showAlert = !healthCheckAdded && canAddHealthChecks;

  const addHealthChecksLink = `/k8s/ns/${namespace}/${resourceKind}/${name}/containers/${containersName[0]}/health-checks`;

  const alertMessage =
    containersName?.length > 1
      ? t(
          'topology~Not all Containers have health checks to ensure your application is running correctly.',
        )
      : t(
          'topology~Container {{containersName}} does not have health checks to ensure your application is running correctly.',
          { containersName },
        );

  return showAlert
    ? {
        title: t('topology~Health checks'),
        dismissible: true,
        content: (
          <>
            {alertMessage} <Link to={addHealthChecksLink}>{t('topology~Add health checks')}</Link>
          </>
        ),
        variant: 'default',
      }
    : null;
};
