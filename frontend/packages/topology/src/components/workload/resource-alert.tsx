import * as React from 'react';
import { AlertActionLink } from '@patternfly/react-core';
import { GraphElement } from '@patternfly/react-topology';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { CommonActionFactory } from '@console/app/src/actions/creators/common-factory';
import { DeploymentActionFactory } from '@console/app/src/actions/creators/deployment-factory';
import { DetailsResourceAlertContent, useAccessReview } from '@console/dynamic-plugin-sdk';
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

export const useResourceQuotaAlert = (element: GraphElement): DetailsResourceAlertContent => {
  const { t } = useTranslation();
  const resource = getResource(element);
  const name = resource?.metadata?.name;
  const namespace = resource?.metadata?.namespace;

  const canUseAlertAction = useAccessReview({
    group: DeploymentModel?.apiGroup,
    resource: DeploymentModel?.plural,
    namespace,
    name,
    verb: 'patch',
  });

  if (!resource || referenceForModel(DeploymentModel) !== referenceFor(resource)) return null;

  const statusConditions = resource.status?.conditions ?? [];
  const replicaFailure = !_.isEmpty(statusConditions)
    ? _.find(statusConditions, (condition) => condition.type === 'ReplicaFailure')
    : undefined;
  const replicaFailureMsg: string = replicaFailure?.message ?? '';
  const resourceQuotaRequested = replicaFailureMsg.split(':')?.[3] ?? '';
  const resourceQuotaType = resourceQuotaRequested.includes('limits')
    ? 'Limits'
    : resourceQuotaRequested.includes('pods')
    ? 'Pods'
    : '';
  const showAlert = resourceQuotaType && canUseAlertAction;
  const alertAction =
    resourceQuotaType === 'Limits'
      ? DeploymentActionFactory.EditResourceLimits(DeploymentModel, resource)
      : CommonActionFactory.ModifyCount(DeploymentModel, resource);

  const alertActionCta = alertAction.cta as () => void;

  const alertActionLink = (
    <AlertActionLink onClick={() => alertActionCta()}>
      {alertAction.label as string}
    </AlertActionLink>
  );

  return showAlert
    ? {
        title: t('topology~Resource Quotas'),
        dismissible: true,
        content: <>{replicaFailureMsg}</>,
        actionLinks: alertActionLink,
        variant: 'warning',
      }
    : null;
};
