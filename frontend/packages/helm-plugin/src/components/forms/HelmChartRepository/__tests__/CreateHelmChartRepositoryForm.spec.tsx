import { screen } from '@testing-library/react';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import CreateHelmChartRepositoryForm from '../CreateHelmChartRepositoryForm';

jest.mock('@console/shared/src/components/form-utils/FlexForm', () => ({
  FlexForm: ({ children, onSubmit }: any) => (
    <form data-test="flex-form" onSubmit={onSubmit}>
      {children}
    </form>
  ),
}));

jest.mock('@console/shared/src/components/form-utils/FormBody', () => ({
  FormBody: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('@console/shared/src/components/form-utils/FormHeader', () => ({
  FormHeader: ({ title, helpText }: any) => (
    <div data-test="form-header">
      <h1>{title}</h1>
      {helpText && <span>{helpText}</span>}
    </div>
  ),
}));

jest.mock('@console/shared/src/components/form-utils/FormFooter', () => ({
  FormFooter: ({ submitLabel, disableSubmit, errorMessage, successMessage, handleCancel }: any) => (
    <div data-test="form-footer">
      <button type="submit" disabled={disableSubmit}>
        {submitLabel}
      </button>
      <button type="button" onClick={handleCancel}>
        Cancel
      </button>
      {errorMessage && <div data-test="error-message">{errorMessage}</div>}
      {successMessage && <div data-test="success-message">{successMessage}</div>}
    </div>
  ),
}));

jest.mock('@console/shared/src/components/formik-fields/SyncedEditorField', () => ({
  SyncedEditorField: ({ formContext, yamlContext }: any) => (
    <div data-test="synced-editor">
      {formContext?.editor}
      {yamlContext?.editor}
    </div>
  ),
}));

jest.mock('@console/shared/src/components/formik-fields/CodeEditorField', () => ({
  CodeEditorField: () => <div data-test="code-editor">YAML Editor</div>,
}));

jest.mock('../CreateHelmChartRepositoryFormEditor', () => ({
  __esModule: true,
  default: () => <div data-test="form-editor">Form Editor</div>,
}));

jest.mock('../helmchartrepository-create-utils', () => ({
  convertToForm: jest.fn((v: any) => v),
  convertToHelmChartRepository: jest.fn(() => ({})),
}));

jest.mock('@console/shared/src/components/editor/yaml-download-utils', () => ({
  downloadYaml: jest.fn(),
}));

jest.mock('@console/shared/src/utils/yaml', () => ({
  safeJSToYAML: jest.fn(() => 'yaml: data'),
}));

const defaultFormData = {
  repoName: 'my-repo',
  repoUrl: 'https://example.com/charts',
  scope: 'HelmChartRepository',
  repoDisplayName: '',
  repoDescription: '',
};

const defaultFormikProps = {
  values: {
    editorType: EditorType.Form,
    formData: defaultFormData,
    yamlData: 'apiVersion: v1',
  },
  errors: {},
  touched: {},
  isSubmitting: false,
  isValidating: false,
  status: undefined,
  submitCount: 0,
  dirty: false,
  isValid: true,
  initialValues: {
    editorType: EditorType.Form,
    formData: defaultFormData,
    yamlData: 'apiVersion: v1',
  },
  initialErrors: {},
  initialTouched: {},
  initialStatus: undefined,
  handleSubmit: jest.fn(),
  handleReset: jest.fn(),
  handleBlur: jest.fn(),
  handleChange: jest.fn(),
  resetForm: jest.fn(),
  setErrors: jest.fn(),
  setFieldError: jest.fn(),
  setFieldTouched: jest.fn(),
  setFieldValue: jest.fn(),
  setFormikState: jest.fn(),
  setStatus: jest.fn(),
  setSubmitting: jest.fn(),
  setTouched: jest.fn(),
  setValues: jest.fn(),
  submitForm: jest.fn(),
  validateForm: jest.fn(),
  validateField: jest.fn(),
  getFieldProps: jest.fn(),
  getFieldMeta: jest.fn(),
  getFieldHelpers: jest.fn(),
  registerField: jest.fn(),
  unregisterField: jest.fn(),
};

const defaultProps = {
  ...defaultFormikProps,
  namespace: 'test-ns',
  handleCancel: jest.fn(),
  showScopeType: true,
  existingRepo: null,
};

describe('CreateHelmChartRepositoryForm', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render the form title for creating a new repository', () => {
    renderWithProviders(<CreateHelmChartRepositoryForm {...defaultProps} />);

    expect(screen.getByText('Create Helm Chart Repository')).toBeVisible();
  });

  it('should render the form and YAML editors via SyncedEditorField', () => {
    renderWithProviders(<CreateHelmChartRepositoryForm {...defaultProps} />);

    expect(screen.getByTestId('synced-editor')).toBeVisible();
    expect(screen.getByTestId('form-editor')).toBeVisible();
    expect(screen.getByTestId('code-editor')).toBeVisible();
  });

  it('should render Create as the submit button label for new repos', () => {
    renderWithProviders(<CreateHelmChartRepositoryForm {...defaultProps} />);

    expect(screen.getByRole('button', { name: 'Create' })).toBeVisible();
  });

  it('should render Save as the submit button label when editing existing repo', () => {
    const existingRepo = {
      apiVersion: 'helm.openshift.io/v1beta1',
      kind: 'HelmChartRepository',
      metadata: { name: 'existing-repo' },
      spec: { connectionConfig: { url: 'https://example.com' } },
    };
    renderWithProviders(
      <CreateHelmChartRepositoryForm {...defaultProps} existingRepo={existingRepo} />,
    );

    expect(screen.getByRole('button', { name: 'Save' })).toBeVisible();
  });

  it('should disable submit button when form is not dirty', () => {
    renderWithProviders(<CreateHelmChartRepositoryForm {...defaultProps} dirty={false} />);

    expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled();
  });

  it('should enable submit button when form is dirty and has no errors', () => {
    renderWithProviders(
      <CreateHelmChartRepositoryForm {...defaultProps} dirty isSubmitting={false} />,
    );

    expect(screen.getByRole('button', { name: 'Create' })).not.toBeDisabled();
  });

  it('should display submit error message', () => {
    renderWithProviders(
      <CreateHelmChartRepositoryForm
        {...defaultProps}
        status={{ submitError: 'Failed to create' }}
      />,
    );

    expect(screen.getByText('Failed to create')).toBeVisible();
  });

  it('should show the form description text', () => {
    renderWithProviders(<CreateHelmChartRepositoryForm {...defaultProps} />);

    expect(screen.getByText('Add helm chart repository.')).toBeVisible();
  });
});
