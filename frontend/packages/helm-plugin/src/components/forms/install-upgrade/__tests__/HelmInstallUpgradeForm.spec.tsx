import { screen } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { HelmActionType } from '../../../../types/helm-types';
import type { HelmInstallUpgradeFormData } from '../HelmInstallUpgradeForm';
import HelmInstallUpgradeForm from '../HelmInstallUpgradeForm';

jest.mock('@console/shared/src/components/formik-fields/InputField', () => ({
  InputField: (props: any) => (
    <div data-test={props['data-test']}>
      <label htmlFor={props.name}>
        {props.label}
        {props.required && ' *'}
      </label>
      <input
        id={props.name}
        name={props.name}
        type={props.type}
        disabled={props.isDisabled}
        aria-label={props.label}
      />
      {props.helpText && <span>{props.helpText}</span>}
    </div>
  ),
}));

jest.mock('@console/shared/src/components/formik-fields/ResourceDropdownField', () => ({
  ResourceDropdownField: (props: any) => (
    <div data-test="resource-dropdown">
      <label>{props.label}</label>
      {props.helpText && <span>{props.helpText}</span>}
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

jest.mock('@console/shared/src/components/formik-fields/DynamicFormField', () => ({
  DynamicFormField: ({ formDescription }: any) => (
    <div data-test="dynamic-form">{formDescription}</div>
  ),
}));

jest.mock('@console/shared/src/components/formik-fields/CodeEditorField', () => ({
  CodeEditorField: ({ label }: any) => <div data-test="code-editor">{label}</div>,
}));

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
      <div data-test="form-help-text">{helpText}</div>
    </div>
  ),
}));

jest.mock('@console/shared/src/components/form-utils/FormFooter', () => ({
  FormFooter: ({ submitLabel, disableSubmit, resetLabel, errorMessage }: any) => (
    <div data-test="form-footer">
      <button type="submit" disabled={disableSubmit}>
        {submitLabel}
      </button>
      <button type="button">{resetLabel}</button>
      {errorMessage && <div data-test="error-message">{errorMessage}</div>}
    </div>
  ),
}));

jest.mock('@console/dev-console/src/components/import/section/FormSection', () => ({
  __esModule: true,
  default: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('../HelmChartVersionDropdown', () => ({
  __esModule: true,
  default: ({ chartName, chartVersion }: any) => (
    <div data-test="chart-version-dropdown">
      {chartName} - {chartVersion}
    </div>
  ),
}));

jest.mock('../HelmReadmeModal', () => ({
  useHelmReadmeModalLauncher: jest.fn(() => jest.fn()),
}));

jest.mock('../../url-chart/useBasicAuthSecretDropdown', () => ({
  useBasicAuthSecretDropdown: jest.fn(() => ({ handleSecretChange: jest.fn() })),
  CREATE_SECRET_KEY: '__create_secret__',
  NONE_SECRET_KEY: '__none__',
}));

jest.mock('../../url-chart/useSecretResources', () => ({
  useSecretResources: jest.fn(() => [{ data: [], loaded: true, loadError: null, kind: 'Secret' }]),
}));

jest.mock('@console/shared/src/components/dynamic-form/utils', () => ({
  getJSONSchemaOrder: jest.fn(() => ({})),
  prune: jest.fn((v: any) => v),
}));

const defaultValues: HelmInstallUpgradeFormData = {
  releaseName: 'my-release',
  chartName: 'my-chart',
  chartRepoName: 'my-repo',
  chartVersion: '1.0.0',
  chartReadme: '',
  appVersion: '1.0.0',
  yamlData: 'key: value',
  formData: { replicas: 1 },
  formSchema: { type: 'object', properties: { replicas: { type: 'number' } } },
  editorType: 'form' as any,
  basicAuthSecretName: '',
  isURLInstall: false,
};

const defaultFormikProps = {
  values: defaultValues,
  errors: {},
  touched: {},
  isSubmitting: false,
  isValidating: false,
  status: undefined,
  submitCount: 0,
  dirty: false,
  isValid: true,
  initialValues: defaultValues,
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
  chartHasValues: true,
  helmActionConfig: {
    type: HelmActionType.Create,
    title: 'Install Helm Chart',
    subTitle: 'Install a Helm Chart to create a Helm Release.',
    helmReleaseApi: '/api/helm/release',
    fetch: jest.fn(),
    redirectURL: '/helm-releases',
  },
  chartMetaDescription: 'A test chart description',
  onVersionChange: jest.fn(),
  chartError: null as Error,
  namespace: 'test-ns',
};

describe('HelmInstallUpgradeForm', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render the form title and release name field', () => {
    renderWithProviders(<HelmInstallUpgradeForm {...defaultProps} />);

    expect(screen.getByText('Install Helm Chart')).toBeVisible();
    expect(screen.getByLabelText('Release name')).toBeVisible();
    expect(screen.getByText('A unique name for the Helm release.')).toBeVisible();
  });

  it('should render the chart version dropdown with chart name and version', () => {
    renderWithProviders(<HelmInstallUpgradeForm {...defaultProps} />);

    expect(screen.getByText('my-chart - 1.0.0')).toBeVisible();
  });

  it('should render the synced editor when chart has values and no chart error', () => {
    renderWithProviders(<HelmInstallUpgradeForm {...defaultProps} />);

    expect(screen.getByTestId('synced-editor')).toBeVisible();
  });

  it('should show non-configurable alert when chart has no values and no schema', () => {
    renderWithProviders(
      <HelmInstallUpgradeForm
        {...defaultProps}
        chartHasValues={false}
        values={{ ...defaultValues, formSchema: null, formData: null }}
      />,
    );

    expect(
      screen.getByText(
        /Helm release is not configurable since the Helm Chart doesn't define any values/,
      ),
    ).toBeVisible();
  });

  it('should display chart error alert and disable the release name field when chartError is set', () => {
    const chartError = new Error('Chart fetch failed');
    renderWithProviders(<HelmInstallUpgradeForm {...defaultProps} chartError={chartError} />);

    expect(screen.getByText('Helm Chart cannot be installed')).toBeVisible();
    expect(screen.getByLabelText('Release name')).toBeDisabled();
  });

  it('should disable submit button when form is submitting', () => {
    renderWithProviders(<HelmInstallUpgradeForm {...defaultProps} isSubmitting />);

    expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled();
  });

  it('should disable submit button on upgrade when form is not dirty', () => {
    renderWithProviders(
      <HelmInstallUpgradeForm
        {...defaultProps}
        dirty={false}
        helmActionConfig={{
          ...defaultProps.helmActionConfig,
          type: HelmActionType.Upgrade,
          title: 'Upgrade Helm release',
        }}
      />,
    );

    expect(screen.getByRole('button', { name: 'Upgrade' })).toBeDisabled();
  });

  it('should show the README link when chartReadme is provided', () => {
    renderWithProviders(
      <HelmInstallUpgradeForm
        {...defaultProps}
        values={{ ...defaultValues, chartReadme: '# My Chart README' }}
      />,
    );

    expect(screen.getByRole('button', { name: 'README' })).toBeVisible();
  });

  it('should display submit error message when status has submitError', () => {
    renderWithProviders(
      <HelmInstallUpgradeForm {...defaultProps} status={{ submitError: 'Something went wrong' }} />,
    );

    expect(screen.getByText('Something went wrong')).toBeVisible();
  });

  it('should show secret dropdown when isURLInstall is true', () => {
    renderWithProviders(
      <HelmInstallUpgradeForm
        {...defaultProps}
        values={{ ...defaultValues, isURLInstall: true }}
      />,
    );

    expect(screen.getByText('Secret for Basic authentication')).toBeVisible();
  });
});
