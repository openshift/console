import { K8sResourceCommon, K8sResourceKind, Toleration } from '@console/internal/module/k8s';
import { PipelineRunKind } from '../../../types';

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

export type TriggerTemplateKindResource = PipelineRunKind;
export type TriggerTemplateKind = K8sResourceCommon & {
  spec: {
    params: TriggerTemplateKindParam[];
    resourcetemplates: TriggerTemplateKindResource[];
  };
};

export type EventListenerKindBindingReference = {
  // TriggerBinding / ClusterTriggerBinding reference
  // Kind can only be provided if Ref is also provided. Defaults to TriggerBinding
  kind?: string;
  // Ref is used since Tekton Triggers 0.5 (part of OpenShift Pipeline Operator 1.1)
  // Mutually exclusive with Name
  ref?: string;
  // We also support older operators, so need to show & save the old field as well.
  // https://github.com/tektoncd/triggers/pull/603/files
  // https://github.com/tektoncd/triggers/releases/tag/v0.5.0 and
  // https://github.com/tektoncd/triggers/releases/tag/v0.6.0
  /** @deprecated use ref instead */
  // name of the binding param
  name?: string;
  // value for the binding param
  value?: string;
};
export type WebhookHeader = {
  name: string;
  value: string | string[];
};

export type VCSInterceptor = {
  secretRef: {
    secretKey: string;
    secretName: string;
  };
  eventTypes: string[];
};
export type TriggerInterceptor = {
  gitlab: VCSInterceptor;
  github: VCSInterceptor;
  bitbucket: VCSInterceptor;
  webhook: {
    header: WebhookHeader[];
    objectRef: K8sResourceKind;
  };
  cel: {
    filter?: string;
    overlays: {
      key: string;
      expression: string;
    }[];
  };
};
export type EventListenerKindTrigger = {
  name?: string;
  bindings?: EventListenerKindBindingReference[];
  interceptors?: TriggerInterceptor;
  template?: {
    // Ref is used since Tekton Triggers 0.10.x (part of OpenShift Pipeline Operator 1.3)
    ref?: string;
    // We also support older operators, so need to show & save the old field as well.
    // TriggerTemplateKind name reference
    // https://github.com/tektoncd/triggers/pull/898/files
    // name will be deprecated in TP1.4
    name?: string;
  };
  triggerRef?: string;
};

export type EventListenerKind = K8sResourceCommon & {
  spec: {
    serviceAccountName: string;
    triggers: EventListenerKindTrigger[];
    // optional fields
    replicas?: number;
    serviceType?: string;
    namespaceSelector?: {
      matchNames: string[];
    };
    podTemplate?: {
      nodeSelector: { [key: string]: string };
      tolerations: Toleration[];
    };
  };
  status?: {
    configuration: {
      generatedName: string;
    };
  };
};
