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
  // TriggerBinding / ClusterTriggerBinding reference
  kind: string;
  // Ref is used since Tekton Triggers 0.5 (part of OpenShift Pipeline Operator 1.1)
  ref: string;
  // We also support older operators, so need to show & save the old field as well.
  // https://github.com/tektoncd/triggers/pull/603/files
  // https://github.com/tektoncd/triggers/releases/tag/v0.5.0 and
  // https://github.com/tektoncd/triggers/releases/tag/v0.6.0
  /** @deprecated use ref instead */
  name?: string;
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
    serviceAccountName: string;
    triggers: EventListenerKindTrigger[];
  };
  status?: {
    configuration: {
      generatedName: string;
    };
  };
};
