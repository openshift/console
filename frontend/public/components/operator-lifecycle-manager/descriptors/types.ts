/* eslint-disable no-undef, no-unused-vars */

import { K8sKind, K8sResourceKind } from '../../../module/k8s';

export enum SpecCapability {
  podCount = 'urn:alm:descriptor:com.tectonic.ui:podCount',
  endpointList = 'urn:alm:descriptor:com.tectonic.ui:endpointList',
  label = 'urn:alm:descriptor:com.tectonic.ui:label',
  resourceRequirements = 'urn:alm:descriptor:com.tectonic.ui:resourceRequirements',
  selector = 'urn:alm:descriptor:com.tectonic.ui:selector:',
  namespaceSelector = 'urn:alm:descriptor:com.tectonic.ui:namespaceSelector',
  k8sResourcePrefix = 'urn:alm:descriptor:io.kubernetes:',
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
}

export type Descriptor = {
  path: string;
  displayName: string;
  description: string;
  'x-descriptors': StatusCapability[] | SpecCapability[];
  value?: any;
};

export type DescriptorProps = {
  descriptor: Descriptor;
  value: any;
  obj: K8sResourceKind;
  model: K8sKind;
  namespace?: string;
};

export type CapabilityProps<C extends SpecCapability | StatusCapability> = {
  descriptor: Descriptor;
  capability: C;
  value: any;
  obj?: K8sResourceKind;
  model?: K8sKind;
  namespace?: string;
};
