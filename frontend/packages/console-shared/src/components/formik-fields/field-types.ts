import { JSONSchema6 } from 'json-schema';
import { ValidatedOptions, TextInputTypes, gridItemSpanValueShape } from '@patternfly/react-core';
import { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import { RowRendererProps } from './multi-column-field/MultiColumnFieldRow';

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
  dataTest?: string;
}

export interface BaseInputFieldProps extends FieldProps {
  type?: TextInputTypes;
  placeholder?: string;
  onChange?: (event) => void;
  onBlur?: (event) => void;
  autoComplete?: string;
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
  rows?: number;
  resizeOrientation?: 'vertical' | 'horizontal' | 'both';
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

export type FormSelectFieldOption<T = any> = {
  label: string;
  value: T;
  isPlaceholder?: boolean;
  isDisabled?: boolean;
};

export type FormSelectFieldProps = FieldProps & {
  isDisabled?: boolean;
  options: FormSelectFieldOption[];
  onChange?: (selectedValue: any) => void;
};

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
  emptyValues: { [name: string]: string | boolean | string[] };
  emptyMessage?: string;
  headers: ({ name: string; required: boolean } | string)[];
  complexFields?: boolean[];
  children?: React.ReactNode;
  spans?: gridItemSpanValueShape[];
  rowRenderer?: (row: RowRendererProps) => React.ReactNode;
}

export interface YAMLEditorFieldProps extends FieldProps {
  model?: K8sKind;
  schema?: JSONSchema6;
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
  isInline?: boolean;
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

export interface SelectInputOption {
  value: string;
  disabled: boolean;
}

export interface SelectInputFieldProps extends FieldProps {
  options: SelectInputOption[];
  placeholderText?: React.ReactNode;
  isCreatable?: boolean;
  hasOnCreateOption?: boolean;
}
