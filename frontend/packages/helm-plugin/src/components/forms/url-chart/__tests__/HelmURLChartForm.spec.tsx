import { screen } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import HelmURLChartForm from '../HelmURLChartForm';

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
        placeholder={props.placeholder}
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

jest.mock('../useBasicAuthSecretDropdown', () => ({
  useBasicAuthSecretDropdown: jest.fn(() => ({ handleSecretChange: jest.fn() })),
  CREATE_SECRET_KEY: '__create_secret__',
}));

jest.mock('../useSecretResources', () => ({
  useSecretResources: jest.fn(() => [{ data: [], loaded: true, loadError: null, kind: 'Secret' }]),
}));

const defaultValues = {
  chartURL: '',
  releaseName: '',
  chartVersion: '',
  basicAuthSecretName: '',
  namespace: 'test-ns',
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
  namespace: 'test-ns',
  onNext: jest.fn(),
};

describe('HelmURLChartForm', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render the form title and description', () => {
    renderWithProviders(<HelmURLChartForm {...defaultProps} />);

    expect(screen.getByText('Install Helm Chart from URL')).toBeVisible();
  });

  it('should render Chart URL, Release name, and Chart version input fields', () => {
    renderWithProviders(<HelmURLChartForm {...defaultProps} />);

    expect(screen.getByLabelText('Chart URL')).toBeVisible();
    expect(screen.getByLabelText('Release name')).toBeVisible();
    expect(screen.getByLabelText('Chart version')).toBeVisible();
  });

  it('should render the Secret for Basic authentication dropdown', () => {
    renderWithProviders(<HelmURLChartForm {...defaultProps} />);

    expect(screen.getByText('Secret for Basic authentication')).toBeVisible();
  });

  it('should render Next as the submit button label', () => {
    renderWithProviders(<HelmURLChartForm {...defaultProps} />);

    expect(screen.getByRole('button', { name: 'Next' })).toBeVisible();
  });

  it('should disable Next button when form is not dirty', () => {
    renderWithProviders(<HelmURLChartForm {...defaultProps} dirty={false} />);

    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('should disable Next button when form is invalid', () => {
    renderWithProviders(<HelmURLChartForm {...defaultProps} dirty isValid={false} />);

    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('should enable Next button when form is valid and dirty', () => {
    renderWithProviders(<HelmURLChartForm {...defaultProps} dirty isValid isSubmitting={false} />);

    expect(screen.getByRole('button', { name: 'Next' })).not.toBeDisabled();
  });

  it('should display submit error message when status has submitError', () => {
    renderWithProviders(
      <HelmURLChartForm {...defaultProps} status={{ submitError: 'Chart not found' }} />,
    );

    expect(screen.getByText('Chart not found')).toBeVisible();
  });

  it('should render Cancel button', () => {
    renderWithProviders(<HelmURLChartForm {...defaultProps} />);

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeVisible();
  });
});
