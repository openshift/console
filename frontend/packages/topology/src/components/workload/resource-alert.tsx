import * as React from 'react';
import { AlertActionLink } from '@patternfly/react-core';
import { GraphElement } from '@patternfly/react-topology';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { CommonActionFactory } from '@console/app/src/actions/creators/common-factory';
import { DeploymentActionFactory } from '@console/app/src/actions/creators/deployment-factory';
import { Action, DetailsResourceAlertContent, useAccessReview } from '@console/dynamic-plugin-sdk';
import {
  DaemonSetModel,
  DeploymentConfigModel,
  DeploymentModel,
  StatefulSetModel,
} from '@console/internal/models';
import {
  K8sResourceCondition,
  modelFor,
  referenceFor,
  referenceForModel,
} from '@console/internal/module/k8s';
import { ServiceModel as KnativeServiceModel } from '@console/knative-plugin';
import { useTelemetry } from '@console/shared/src/hooks/useTelemetry';
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

  const [canAddHealthChecks, canAddHealthChecksLoading] = useAccessReview({
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

  const showAlert = !healthCheckAdded && canAddHealthChecks && !canAddHealthChecksLoading;

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

export const useResourceQuotaAlert = (element: GraphElement): DetailsResourceAlertContent => {
  const { t } = useTranslation();
  const fireTelemetryEvent = useTelemetry();
  const resource = getResource(element);
  const name = resource?.metadata?.name;
  const namespace = resource?.metadata?.namespace;

  const [canUseAlertAction, canUseAlertActionLoading] = useAccessReview({
    group: DeploymentModel.apiGroup,
    resource: DeploymentModel.plural,
    namespace,
    name,
    verb: 'patch',
  });

  if (!resource || referenceForModel(DeploymentModel) !== referenceFor(resource)) return null;

  const statusConditions: K8sResourceCondition[] = resource.status?.conditions ?? [];
  const replicaFailure = statusConditions.find((condition) => condition.type === 'ReplicaFailure');
  const replicaFailureMsg: string = replicaFailure?.message ?? '';
  const resourceQuotaRequested = replicaFailureMsg.split(':')?.[3] ?? '';

  let alertAction: Action;
  if (resourceQuotaRequested.includes('limits')) {
    alertAction = DeploymentActionFactory.EditResourceLimits(DeploymentModel, resource);
  } else if (resourceQuotaRequested.includes('pods')) {
    alertAction = CommonActionFactory.ModifyCount(DeploymentModel, resource);
  }

  const showAlertActionLink = alertAction && canUseAlertAction && !canUseAlertActionLoading;

  const alertActionCta = alertAction?.cta as () => void;

  const onAlertActionClick = () => {
    fireTelemetryEvent('Resource Quota Warning Alert Action Link Clicked');
    alertActionCta();
  };

  const alertActionLink = showAlertActionLink ? (
    <AlertActionLink onClick={onAlertActionClick}>{alertAction.label as string}</AlertActionLink>
  ) : undefined;

  return replicaFailure
    ? {
        title: t('topology~Resource Quotas'),
        dismissible: true,
        content: replicaFailureMsg,
        actionLinks: alertActionLink,
        variant: 'warning',
      }
    : null;
};
