import { K8sKind, PodKind } from '@console/internal/module/k8s';
import { ServiceKind } from '@console/knative-plugin';
import { VMKind } from '../../../types/vm';
import { VMIKind } from '../../../types/vmi';
import { VMStatusBundle } from '../../../utils/statuses/vm/types';

export type VMResourceListProps = {
  kindObj: K8sKind;
  vm?: VMKind;
  pods?: PodKind[];
  vmi?: VMIKind;
  canUpdateVM: boolean;
  vmStatusBundle: VMStatusBundle;
  vmSSHService?: ServiceKind;
};
