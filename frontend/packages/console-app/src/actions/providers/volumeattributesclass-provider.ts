import { Action } from '@console/dynamic-plugin-sdk';
import { K8sResourceCommon, referenceFor } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { useCommonResourceActions } from '../hooks/useCommonResourceActions';

export const useVolumeAttributesClassActionsProvider = (
  volumeAttributesClass: K8sResourceCommon,
): [Action[], boolean] => {
  const [volumeAttributesClassModel, inFlight] = useK8sModel(referenceFor(volumeAttributesClass));
  const commonActions = useCommonResourceActions(volumeAttributesClassModel, volumeAttributesClass);

  return [commonActions, !inFlight];
};
