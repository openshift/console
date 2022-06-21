import { JSONSchema7 } from 'json-schema';
import { K8sModel } from '../api/common-types';

export type YAMLEditorFieldProps = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  model?: K8sModel;
  schema?: JSONSchema7;
  showSamples: boolean;
  onSave?: () => void;
};
