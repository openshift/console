import type { ReactNode, ReactElement, CSSProperties } from 'react';
import type { Language } from '@patternfly/react-code-editor';
import type {
  ValidatedOptions,
  TextInputTypes,
  gridItemSpanValueShape,
} from '@patternfly/react-core';
import type { JSONSchema7 } from 'json-schema';
import type { ConsoleSelectProps } from '@console/internal/components/utils/console-select';
import type { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import type { RowRendererProps } from './multi-column-field/MultiColumnFieldRow';

export interface FieldProps {
  name: string;
  required?: boolean;
  style?: CSSProperties;
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
  label?: ReactNode;
  helpText?: ReactNode;
  helpTextInvalid?: ReactNode;
}

export interface GroupInputProps extends BaseInputFieldProps {
  beforeInput?: ReactNode;
  afterInput?: ReactNode;
  groupTextType?: GroupTextType;
}

export interface TextAreaProps extends FieldProps {
  placeholder?: string;
  onChange?: (event) => void;
  onBlur?: (event) => void;
  rows?: number;
  resizeOrientation?: 'vertical' | 'horizontal' | 'both';
  label?: ReactNode;
  helpText?: ReactNode;
}

export enum GroupTextType {
  TextInput = 'text',
  TextArea = 'textArea',
}

export interface CheckboxFieldProps extends FieldProps {
  formLabel?: string;
  value?: string;
  onChange?: (val: boolean) => void;
  label?: ReactNode;
  helpText?: ReactNode;
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
  label?: ReactNode;
  helpText?: ReactNode;
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
  label?: ReactNode;
  helpText?: ReactNode;
}

export interface EnvironmentFieldProps extends FieldProps {
  obj: K8sResourceKind;
  envs?: (NameValuePair | NameValueFromPair)[];
  label?: ReactNode;
  helpText?: ReactNode;
}

export interface ResourceLimitFieldProps extends FieldProps {
  unitName: string;
  unitOptions: object;
  fullWidth?: boolean;
  label?: ReactNode;
  helpText?: ReactNode;
}

export interface MultiColumnFieldProps extends FieldProps {
  addLabel?: string;
  emptyValues: { [name: string]: string | boolean | string[] };
  emptyMessage?: string;
  headers: ({ name: string; required: boolean } | string)[];
  complexFields?: boolean[];
  children?: ReactNode;
  spans?: gridItemSpanValueShape[];
  rowRenderer?: (row: RowRendererProps) => ReactNode;
  disableDeleteRow?: boolean;
  tooltipDeleteRow?: string;
  disableAddRow?: boolean;
  hideAddRow?: boolean;
  tooltipAddRow?: string;
  label?: ReactNode;
  helpText?: ReactNode;
}

export interface CodeEditorFieldProps extends FieldProps {
  model?: K8sKind;
  minHeight?: string;
  language?: keyof typeof Language;
  schema?: JSONSchema7;
  showSamples: boolean;
  showShortcuts?: boolean;
  isMinimapVisible?: boolean;
  onSave?: () => void;
  label?: string;
  helpText?: string;
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
  value: string | number;
  description?: ReactNode;
  onChange?: (value: string | number) => void;
  isChecked?: boolean;
  label?: ReactNode;
  helpText?: ReactNode;
}

export interface RadioGroupFieldProps extends FieldProps {
  isInline?: boolean;
  labelIcon?: ReactElement;
  options: RadioGroupOption[];
  onChange?: (value: string) => void;
  label?: ReactNode;
  helpText?: ReactNode;
}

export interface RadioGroupOption {
  value: string;
  label: ReactNode;
  isDisabled?: boolean;
  isChecked?: boolean;
  children?: ReactNode;
  activeChildren?: ReactElement;
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
  label?: ReactNode;
  helpText?: ReactNode;
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
