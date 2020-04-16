import { K8sResourceCommon } from '@console/internal/module/k8s';
import { PipelineRun } from '../../../utils/pipeline-augment';

export type TriggerBindingParam = {
  name: string;
  value: string;
};

export type TriggerBindingKind = K8sResourceCommon & {
  spec: {
    params: TriggerBindingParam[];
  };
};

export type TriggerTemplateKindParam = {
  name: string;
  description?: string;
  default?: string;
};

export type TriggerTemplateKindResource = PipelineRun;
export type TriggerTemplateKind = K8sResourceCommon & {
  spec: {
    params: TriggerTemplateKindParam[];
    resourcetemplates: TriggerTemplateKindResource[];
  };
};

export type EventListenerKindBindingReference = {
  // TriggerBinding / ClusterTriggerBinding name reference
  name: string;
  kind?: string;
};

export type EventListenerKindTrigger = {
  bindings: EventListenerKindBindingReference[];
  template: {
    // TriggerTemplateKind name reference
    name: string;
  };
};

export type EventListenerKind = K8sResourceCommon & {
  spec: {
    triggers: EventListenerKindTrigger[];
  };
  status?: {
    configuration: {
      generatedName: string;
    };
  };
};
