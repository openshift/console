import { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import { updateStrategyModal } from '../../modals/update-strategy-modal';
import { Descriptor } from '../types';
import { getPatchPathFromDescriptor } from '../utils';

export const configureUpdateStrategyModal = ({
  kindObj,
  resource,
  specDescriptor,
  specValue,
}: ConfigureUpdateStrategyModalProps) => {
  return updateStrategyModal({
    resourceKind: kindObj,
    resource,
    defaultValue: specValue,
    title: `Edit ${specDescriptor.displayName}`,
    path: `/spec/${getPatchPathFromDescriptor(specDescriptor)}`,
  });
};

type ConfigureUpdateStrategyModalProps = {
  kindObj: K8sKind;
  resource: K8sResourceKind;
  specDescriptor: Descriptor;
  specValue: any;
};
