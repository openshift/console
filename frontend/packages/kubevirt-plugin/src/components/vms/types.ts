import { K8sResourceKind, PodKind } from '@console/internal/module/k8s';
import { VMIKind, VMKind } from '../../types/vm';
import { VMLikeEntityKind } from '../../types';

export type VMTabProps = {
  obj?: VMKind;
  vmi?: VMIKind;
  pods?: PodKind[];
  migrations?: K8sResourceKind[];
};

export type VMLikeEntityTabProps = {
  obj?: VMLikeEntityKind;
};
