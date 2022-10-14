import { useMemo } from 'react';
import { getCommonResourceActions } from '@console/app/src/actions/creators/common-factory';
import { SetFeatureFlag } from '@console/dynamic-plugin-sdk';
import { K8sResourceKind, referenceFor } from '@console/internal/module/k8s';
import { isCatalogTypeEnabled } from '@console/shared';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { FLAG_MANAGED_SERVICES_CATALOG_TYPE, MANAGED_SERVICES_CATALOG_TYPE_ID } from '../const';

export const useKafkaConnectionActionProvider = (resource: K8sResourceKind) => {
  const [kindObj, inFlight] = useK8sModel(referenceFor(resource));
  const actions = useMemo(() => {
    return getCommonResourceActions(kindObj, resource);
  }, [kindObj, resource]);

  return [actions, !inFlight, undefined];
};

export const managedServicesProvider = (setFeatureFlag: SetFeatureFlag) => {
  setFeatureFlag(
    FLAG_MANAGED_SERVICES_CATALOG_TYPE,
    isCatalogTypeEnabled(MANAGED_SERVICES_CATALOG_TYPE_ID),
  );
};
