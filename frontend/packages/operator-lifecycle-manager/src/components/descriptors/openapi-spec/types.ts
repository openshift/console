import { K8sResourceKind, K8sKind } from '@console/internal/module/k8s';

export enum OpenApiSpecCapability {
  booleanSwitch = 'urn:alm:descriptor:com.tectonic.ui:booleanSwitch',
  text = 'urn:alm:descriptor:com.tectonic.ui:text',
  number = 'urn:alm:descriptor:com.tectonic.ui:number',
  nodeAffinity = 'urn:alm:descriptor:com.tectonic.ui:nodeAffinity',
  fieldGroup = 'urn:alm:descriptor:com.tectonic.ui:fieldGroup:',
  arrayFieldGroup = 'urn:alm:descriptor:com.tectonic.ui:arrayFieldGroup:',
  select = 'urn:alm:descriptor:com.tectonic.ui:select:',
}

export type OpenApiDescriptor = {
  path: string;
  displayName: string;
  capabilities: OpenApiSpecCapability[];
};

export type OpenApiFieldsDescriptorProps = {
  descriptor: OpenApiDescriptor;
  value: any;
  obj: K8sResourceKind;
  model: K8sKind;
  namespace?: string;
};

export type OpenApiCapabilityProps<C extends OpenApiSpecCapability> = {
  descriptor: OpenApiDescriptor;
  capability: C;
  value: any;
  obj?: K8sResourceKind;
  model?: K8sKind;
  namespace?: string;
};
