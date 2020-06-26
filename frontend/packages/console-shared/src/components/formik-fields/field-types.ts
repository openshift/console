import { ValidatedOptions, TextInputTypes, gridItemSpanValueShape } from '@patternfly/react-core';
import { K8sResourceKind } from '@console/internal/module/k8s';

export interface FieldProps {
  name: string;
  label?: React.ReactNode;
  helpText?: React.ReactNode;
  helpTextInvalid?: React.ReactNode;
  required?: boolean;
  style?: React.CSSProperties;
  isReadOnly?: boolean;
  disableDeleteRow?: boolean;
  disableAddRow?: boolean;
  className?: string;
  isDisabled?: boolean;
  validated?: ValidatedOptions;
}

export interface BaseInputFieldProps extends FieldProps {
  type?: TextInputTypes;
  placeholder?: string;
  onChange?: (event) => void;
  onBlur?: (event) => void;
}

export interface GroupInputProps extends BaseInputFieldProps {
  beforeInput?: React.ReactNode;
  afterInput?: React.ReactNode;
  groupTextType?: GroupTextType;
}

export interface TextAreaProps extends FieldProps {
  placeholder?: string;
  onChange?: (event) => void;
  onBlur?: (event) => void;
}

export enum GroupTextType {
  TextInput = 'text',
  TextArea = 'textArea',
}

export interface CheckboxFieldProps extends FieldProps {
  formLabel?: string;
  value?: string;
  onChange?: (val: boolean) => void;
}

export interface SearchInputFieldProps extends BaseInputFieldProps {
  onSearch: (searchTerm: string) => void;
}

export interface DropdownFieldProps extends FieldProps {
  items?: object;
  selectedKey?: string;
  title?: React.ReactNode;
  fullWidth?: boolean;
  disabled?: boolean;
  autocompleteFilter?: (text: string, item: object, key?: string) => boolean;
  onChange?: (value: string) => void;
}

export interface EnvironmentFieldProps extends FieldProps {
  obj?: K8sResourceKind;
  envPath: string[];
  envs?: (NameValuePair | NameValueFromPair)[];
}

export interface ResourceLimitFieldProps extends FieldProps {
  unitName: string;
  unitOptions: object;
  defaultUnitSize: string;
  fullWidth?: boolean;
}

export interface MultiColumnFieldProps extends FieldProps {
  addLabel?: string;
  toolTip?: string;
  emptyValues: { [name: string]: string };
  emptyMessage?: string;
  headers: ({ name: string; required: boolean } | string)[];
  children: React.ReactNode;
  spans?: gridItemSpanValueShape[];
}

export interface YAMLEditorFieldProps extends FieldProps {
  onChange?: (value: string) => void;
  onSave?: () => void;
}

export interface NameValuePair {
  name: string;
  value: string;
}

export interface NameValueFromPair {
  name: string;
  valueForm: ConfigMapKeyRef | SecretKeyRef;
}

export interface ConfigMapKeyRef {
  configMapKeyRef: {
    key: string;
    name: string;
  };
}

export interface SecretKeyRef {
  secretKeyRef: {
    key: string;
    name: string;
  };
}

export interface RadioButtonFieldProps extends FieldProps {
  value: React.ReactText;
  description?: React.ReactNode;
  onChange?: (value: React.ReactText) => void;
}

export interface RadioGroupFieldProps extends FieldProps {
  inline?: boolean;
  options: RadioGroupOption[];
  onChange?: (value: React.ReactText) => void;
}

export interface RadioGroupOption {
  value: React.ReactText;
  label: React.ReactNode;
  isDisabled?: boolean;
  children?: React.ReactNode;
  activeChildren?: React.ReactElement;
}
