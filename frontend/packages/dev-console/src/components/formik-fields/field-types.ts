export interface InputFieldProps {
  name: string;
  type?: string;
  label?: string;
  helpText?: string;
  required?: boolean;
  placeholder?: string;
  onChange?: (event) => void;
  onBlur?: (event) => void;
}

export interface SearchInputFieldProps extends InputFieldProps {
  onSearch: (searchTerm: string) => void;
}

export interface DropdownFieldProps extends InputFieldProps {
  items?: object;
  selectedKey?: string;
  title?: React.ReactNode;
  fullWidth?: boolean;
}

export interface EnvironmentFieldProps extends InputFieldProps {
  obj?: object;
  envPath: string[];
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
