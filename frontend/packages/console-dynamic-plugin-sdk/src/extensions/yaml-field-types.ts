import { JSONSchema7 } from 'json-schema';
import { K8sModel } from '../api/common-types';

export type YAMLEditorFormikFieldProps = {
  name: string;
  label?: string;
  model?: K8sModel;
  schema?: JSONSchema7;
  showSamples: boolean;
  onSave?: () => void;
};

export type YAMLEditorFieldProps = Omit<YAMLEditorFormikFieldProps, 'name'> & {
  value: string;
  onChange: (value: string) => void;
};
