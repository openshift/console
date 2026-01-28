import { ValidatedOptions, TextInputTypes, gridItemSpanValueShape } from '@patternfly/react-core';
import { JSONSchema7 } from 'json-schema';
import { ConsoleSelectProps } from '@console/internal/components/utils/console-select';
import { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import { RowRendererProps } from './multi-column-field/MultiColumnFieldRow';

export interface FieldProps {
  name: string;
  required?: boolean;
  style?: React.CSSProperties;
  isReadOnly?: boolean;
  className?: string;
  isDisabled?: boolean;
  validated?: ValidatedOptions;
  dataTest?: string;
}

export interface DroppableFileInputFieldProps extends FieldProps {
  onChange?: (fileData: string) => void;
  helpText?: string;
  label?: string;
}
export interface BaseInputFieldProps extends FieldProps {
  type?: TextInputTypes;
  placeholder?: string;
  onChange?: (event) => void;
  onBlur?: (event) => void;
  autoComplete?: string;
  label?: React.ReactNode;
  helpText?: React.ReactNode;
  helpTextInvalid?: React.ReactNode;
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
  label?: React.ReactNode;
  helpText?: React.ReactNode;
}

export enum GroupTextType {
  TextInput = 'text',
  TextArea = 'textArea',
}

export interface CheckboxFieldProps extends FieldProps {
  formLabel?: string;
  value?: string;
  onChange?: (val: boolean) => void;
  label?: React.ReactNode;
  helpText?: React.ReactNode;
}

export interface SearchInputFieldProps extends BaseInputFieldProps {
  onSearch: (searchTerm: string) => void;
}

export interface DropdownFieldProps extends FieldProps {
  items?: ConsoleSelectProps['items'];
  selectedKey?: ConsoleSelectProps['selectedKey'];
  title?: ConsoleSelectProps['title'];
  fullWidth?: ConsoleSelectProps['isFullWidth'];
  disabled?: ConsoleSelectProps['disabled'];
  autocompleteFilter?: ConsoleSelectProps['autocompleteFilter'];
  onChange?: (value: string) => void;
  label?: React.ReactNode;
  helpText?: React.ReactNode;
}

export type FormSelectFieldOption<T = any> = {
  label: string;
  value: T;
  isPlaceholder?: boolean;
  isDisabled?: boolean;
};

export interface FormSelectFieldProps extends FieldProps {
  isDisabled?: boolean;
  options: FormSelectFieldOption[];
  onChange?: (selectedValue: any) => void;
  label?: React.ReactNode;
  helpText?: React.ReactNode;
}

export interface EnvironmentFieldProps extends FieldProps {
  obj: K8sResourceKind;
  envs?: (NameValuePair | NameValueFromPair)[];
  label?: React.ReactNode;
  helpText?: React.ReactNode;
}

export interface ResourceLimitFieldProps extends FieldProps {
  unitName: string;
  unitOptions: object;
  fullWidth?: boolean;
  label?: React.ReactNode;
  helpText?: React.ReactNode;
}

export interface MultiColumnFieldProps extends FieldProps {
  addLabel?: string;
  emptyValues: { [name: string]: string | boolean | string[] };
  emptyMessage?: string;
  headers: ({ name: string; required: boolean } | string)[];
  complexFields?: boolean[];
  children?: React.ReactNode;
  spans?: gridItemSpanValueShape[];
  rowRenderer?: (row: RowRendererProps) => React.ReactNode;
  disableDeleteRow?: boolean;
  tooltipDeleteRow?: string;
  disableAddRow?: boolean;
  hideAddRow?: boolean;
  tooltipAddRow?: string;
  label?: React.ReactNode;
  helpText?: React.ReactNode;
}

export interface CodeEditorFieldProps extends FieldProps {
  model?: K8sKind;
  minHeight?: string;
  language?: string;
  schema?: JSONSchema7;
  showSamples: boolean;
  showShortcuts?: boolean;
  isMinimapVisible?: boolean;
  onSave?: () => void;
  label?: React.ReactNode;
  helpText?: React.ReactNode;
}

export interface NameValuePair {
  name: string;
  value: string;
}

export interface NameValueFromPair {
  name: string;
  valueFrom: ConfigMapKeyRef | SecretKeyRef;
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
  isChecked?: boolean;
  label?: React.ReactNode;
  helpText?: React.ReactNode;
}

export interface RadioGroupFieldProps extends FieldProps {
  isInline?: boolean;
  labelIcon?: React.ReactElement;
  options: RadioGroupOption[];
  onChange?: (value: React.ReactText) => void;
  label?: React.ReactNode;
  helpText?: React.ReactNode;
}

export interface RadioGroupOption {
  value: React.ReactText;
  label: React.ReactNode;
  isDisabled?: boolean;
  isChecked?: boolean;
  children?: React.ReactNode;
  activeChildren?: React.ReactElement;
}

export interface SelectInputOption {
  value: string;
  label?: string;
  description?: string;
  disabled?: boolean;
  hasCheckbox?: boolean;
}

export interface SelectInputFieldProps extends FieldProps {
  ariaLabel?: string;
  options: SelectInputOption[];
  isDisabled?: boolean;
  toggleOnSelection?: boolean;
  placeholderText?: string;
  onChange?: (selection: string) => void;
  label?: React.ReactNode;
  helpText?: React.ReactNode;
}

export interface SingleDropdownFieldProps extends SelectInputFieldProps {
  getLabelFromValue?: (value: string) => string;
}

export interface MultiTypeaheadFieldProps extends SelectInputFieldProps {
  isCreatable?: boolean;
  isInputValuePersisted?: boolean;
  noResultsFoundText?: string;
  hideClearButton?: boolean;
  getLabelFromValue?: (value: string) => string;
}

export interface SingleTypeaheadFieldProps extends SelectInputFieldProps {
  hasOnCreateOption?: boolean;
  hideClearButton?: boolean;
  isCreatable?: boolean;
}
