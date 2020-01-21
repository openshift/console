import { K8sResourceKind, PodKind, TemplateKind } from '@console/internal/module/k8s';
import { VMIKind, VMKind } from '../../types/vm';
import { VMLikeEntityKind } from '../../types';

export type VMTabProps = {
  obj?: VMKind;
  vm?: VMKind;
  vmi?: VMIKind;
  pods?: PodKind[];
  migrations?: K8sResourceKind[];
  templates?: TemplateKind[];
};

export type VMLikeEntityTabProps = {
  obj?: VMLikeEntityKind;
  vmi?: VMIKind;
};
