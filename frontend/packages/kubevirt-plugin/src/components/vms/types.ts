import { K8sKind, K8sResourceKind, PodKind, TemplateKind } from '@console/internal/module/k8s';
import { VMIKind, VMKind } from '../../types/vm';
import { VMGenericLikeEntityKind, VMILikeEntityKind } from '../../types/vmLike';

export type VMTabProps = {
  obj?: VMILikeEntityKind;
  vm?: VMKind;
  vmi?: VMIKind;
  pods?: PodKind[];
  migrations?: K8sResourceKind[];
  templates?: TemplateKind[];
  customData: {
    kindObj: K8sKind;
  };
};

export type VMLikeEntityTabProps = {
  obj?: VMGenericLikeEntityKind;
};
