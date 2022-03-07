import { ObjectMetadata } from '@console/internal/module/k8s/types';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';

type KeyValueObject = {
  [key: string]: string;
};

export type KeyValuePair = {
  key: string;
  value: string;
  isBase64?: boolean;
};

export type ConfigMap = {
  apiVersion: 'v1';
  kind: 'ConfigMap';
  metadata: ObjectMetadata;
  data?: KeyValueObject;
  binaryData?: KeyValueObject;
  immutable?: boolean;
};

export type ConfigMapFormData = {
  name: string;
  namespace: string;
  data: KeyValuePair[];
  binaryData: KeyValuePair[];
  immutable?: boolean;
};

export type ConfigMapFormInitialValues = {
  isCreateFlow: boolean;
  editorType: EditorType;
  yamlData: string;
  formData: ConfigMapFormData;
  resourceVersion: string;
  formReloadCount: number;
};
