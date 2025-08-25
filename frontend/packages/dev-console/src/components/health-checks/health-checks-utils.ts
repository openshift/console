import { createContext } from 'react';
import * as _ from 'lodash';
import { useAccessReview } from '@console/internal/components/utils';
import {
  K8sResourceKind,
  ContainerSpec,
  referenceFor,
  modelFor,
} from '@console/internal/module/k8s';
import { getResourcesType } from '../edit-application/edit-application-utils';
import { getProbesData } from './create-health-checks-probe-utils';
import { HealthChecksProbeType } from './health-checks-types';

export const updateHealthChecksProbe = (
  values,
  resource: K8sResourceKind,
  container: ContainerSpec,
): K8sResourceKind => {
  const {
    healthChecks: { readinessProbe, livenessProbe, startupProbe },
    containerName,
    healthChecks,
  } = values;
  const updatedResource = _.cloneDeep(resource);

  if (!updatedResource.spec?.template?.spec?.containers) {
    return updatedResource;
  }

  const containerIndex = _.findIndex(updatedResource.spec.template.spec.containers, [
    'name',
    containerName,
  ]);

  if (containerIndex === -1) {
    return updatedResource;
  }

  updatedResource.spec.template.spec.containers[containerIndex] = {
    ...container,
    ...getProbesData(healthChecks, getResourcesType(resource)),
  };

  if (!readinessProbe.enabled) {
    updatedResource.spec.template.spec.containers[containerIndex] = _.omit(
      updatedResource.spec.template.spec.containers[containerIndex],
      `${HealthChecksProbeType.ReadinessProbe}`,
    );
  }

  if (!livenessProbe.enabled) {
    updatedResource.spec.template.spec.containers[containerIndex] = _.omit(
      updatedResource.spec.template.spec.containers[containerIndex],
      `${HealthChecksProbeType.LivenessProbe}`,
    );
  }

  if (!startupProbe.enabled) {
    updatedResource.spec.template.spec.containers[containerIndex] = _.omit(
      updatedResource.spec.template.spec.containers[containerIndex],
      `${HealthChecksProbeType.StartupProbe}`,
    );
  }

  return updatedResource;
};

type HealthCheckContextType = {
  viewOnly: boolean;
};

export const HealthCheckContext = createContext<HealthCheckContextType>({ viewOnly: false });

export const useViewOnlyAccess = (resource: K8sResourceKind): boolean => {
  const model = modelFor(referenceFor(resource as K8sResourceKind));
  const hasEditAccess = useAccessReview({
    group: model.apiGroup,
    resource: model.plural,
    name: resource?.metadata?.name ?? '',
    namespace: resource?.metadata?.namespace ?? '',
    verb: 'update',
  });
  return !hasEditAccess;
};
