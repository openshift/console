import { K8sResourceKind, ContainerSpec } from '@console/internal/module/k8s';
import * as _ from 'lodash';
import { getProbesData } from './create-health-checks-probe-utils';
import { getResourcesType } from '@console/dev-console/src/components/edit-application/edit-application-utils';
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
  const containerIndex = _.findIndex(updatedResource.spec.template.spec.containers, [
    'name',
    containerName,
  ]);
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
