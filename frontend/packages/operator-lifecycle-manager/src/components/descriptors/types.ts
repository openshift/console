import { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';

export enum DescriptorType {
  spec = 'spec',
  status = 'status',
}

export enum SpecCapability {
  podCount = 'urn:alm:descriptor:com.tectonic.ui:podCount',
  endpointList = 'urn:alm:descriptor:com.tectonic.ui:endpointList',
  label = 'urn:alm:descriptor:com.tectonic.ui:label',
  resourceRequirements = 'urn:alm:descriptor:com.tectonic.ui:resourceRequirements',
  selector = 'urn:alm:descriptor:com.tectonic.ui:selector:',
  namespaceSelector = 'urn:alm:descriptor:com.tectonic.ui:namespaceSelector',
  k8sResourcePrefix = 'urn:alm:descriptor:io.kubernetes:',
  booleanSwitch = 'urn:alm:descriptor:com.tectonic.ui:booleanSwitch',

  password = 'urn:alm:descriptor:com.tectonic.ui:password',
  checkbox = 'urn:alm:descriptor:com.tectonic.ui:checkbox',
  imagePullPolicy = 'urn:alm:descriptor:com.tectonic.ui:imagePullPolicy',
  updateStrategy = 'urn:alm:descriptor:com.tectonic.ui:updateStrategy',
  text = 'urn:alm:descriptor:com.tectonic.ui:text',
  number = 'urn:alm:descriptor:com.tectonic.ui:number',
  nodeAffinity = 'urn:alm:descriptor:com.tectonic.ui:nodeAffinity',
  podAffinity = 'urn:alm:descriptor:com.tectonic.ui:podAffinity',
  podAntiAffinity = 'urn:alm:descriptor:com.tectonic.ui:podAntiAffinity',
  fieldGroup = 'urn:alm:descriptor:com.tectonic.ui:fieldGroup:',
  arrayFieldGroup = 'urn:alm:descriptor:com.tectonic.ui:arrayFieldGroup:',
  select = 'urn:alm:descriptor:com.tectonic.ui:select:',
  advanced = 'urn:alm:descriptor:com.tectonic.ui:advanced',
  fieldDependency = 'urn:alm:descriptor:com.tectonic.ui:fieldDependency:',
  hidden = 'urn:alm:descriptor:com.tectonic.ui:hidden',
}

export enum StatusCapability {
  podStatuses = 'urn:alm:descriptor:com.tectonic.ui:podStatuses',
  podCount = 'urn:alm:descriptor:com.tectonic.ui:podCount',
  w3Link = 'urn:alm:descriptor:org.w3:link',
  conditions = 'urn:alm:descriptor:io.kubernetes.conditions',
  text = 'urn:alm:descriptor:text',
  prometheusEndpoint = 'urn:alm:descriptor:prometheusEndpoint',
  k8sPhase = 'urn:alm:descriptor:io.kubernetes.phase',
  k8sPhaseReason = 'urn:alm:descriptor:io.kubernetes.phase:reason',
  // Prefix for all kubernetes resource status descriptors.
  k8sResourcePrefix = 'urn:alm:descriptor:io.kubernetes:',
  hidden = 'urn:alm:descriptor:com.tectonic.ui:hidden',
}

export type Descriptor<T = any> = {
  path: string;
  displayName: string;
  description: string;
  'x-descriptors'?: T[];
  value?: any;
};

export type SpecDescriptor = Descriptor<SpecCapability>;
export type StatusDescriptor = Descriptor<StatusCapability>;

export type CapabilityProps<C extends SpecCapability | StatusCapability> = {
  capability?: C;
  description?: string;
  descriptor: Descriptor<C>;
  fullPath?: string[];
  label?: string;
  model?: K8sKind;
  namespace?: string;
  obj?: K8sResourceKind;
  onError?: (error: Error) => void;
  value: any;
};

export type Error = { message: string };
