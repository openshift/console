import { TextInputTypes } from '@patternfly/react-core';

export interface FieldProps {
  name: string;
  label?: string;
  helpText?: React.ReactNode;
  required?: boolean;
  style?: React.CSSProperties;
  isReadOnly?: boolean;
  disableDeleteRow?: boolean;
  disableAddRow?: boolean;
  className?: string;
  isDisabled?: boolean;
}

export interface InputFieldProps extends FieldProps {
  type: TextInputTypes;
  placeholder?: string;
  onChange?: (event) => void;
  onBlur?: (event) => void;
}

export interface TextAreaProps extends FieldProps {
  placeholder?: string;
  onChange?: (event) => void;
  onBlur?: (event) => void;
}

export interface CheckboxFieldProps extends FieldProps {
  formLabel?: string;
}

export interface SearchInputFieldProps extends InputFieldProps {
  onSearch: (searchTerm: string) => void;
}

export interface DropdownFieldProps extends FieldProps {
  items?: object;
  selectedKey?: string;
  title?: React.ReactNode;
  fullWidth?: boolean;
  disabled?: boolean;
  onChange?: (value: string) => void;
}

export interface EnvironmentFieldProps extends FieldProps {
  obj?: object;
  envPath: string[];
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
  headers: string[];
  children: React.ReactNode;
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

export interface RadioButtonProps extends FieldProps {
  options: RadioOption[];
}

export interface RadioOption {
  value: string;
  label: React.ReactNode;
  children?: React.ReactNode;
  activeChildren?: React.ReactElement;
}
