import { K8sKind } from '@console/internal/module/k8s';
import { KebabAction } from '@console/internal/components/utils';
import { PersistentVolumeClaimModel } from '@console/internal/models/index';
import { ClonePVC } from './clone-workflow';

export const getKebabActionsForKind = (resourceKind: K8sKind): KebabAction[] => {
  const menuActions: KebabAction[] = [];
  if (resourceKind?.kind === PersistentVolumeClaimModel.kind) {
    menuActions.push(ClonePVC);
  }
  return menuActions;
};
