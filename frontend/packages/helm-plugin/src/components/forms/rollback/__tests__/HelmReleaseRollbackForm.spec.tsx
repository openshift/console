import { screen } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { HelmActionType } from '../../../../types/helm-types';
import type { HelmRelease } from '../../../../types/helm-types';
import HelmReleaseRollbackForm from '../HelmReleaseRollbackForm';

jest.mock('react-i18next', () => ({
  ...jest.requireActual('react-i18next'),
  useTranslation: () => ({
    t: (key: string) => key.replace(/^helm-plugin~/, ''),
    i18n: { language: 'en' },
  }),
  Trans: () => <span>Select the version to rollback to</span>,
}));

jest.mock('@console/shared/src/components/form-utils/FormBody', () => ({
  FormBody: ({ children }: any) => <div data-test="form-body">{children}</div>,
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

jest.mock('../../../details-page/history/HelmReleaseHistoryTable', () => ({
  __esModule: true,
  default: ({ releaseHistory }: any) => (
    <table data-test="history-table">
      <tbody>
        {releaseHistory.map((r: HelmRelease) => (
          <tr key={r.version}>
            <td>{r.name}</td>
            <td>{r.version}</td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
}));

const mockReleaseHistory: HelmRelease[] = [
  {
    name: 'my-release',
    namespace: 'test-ns',
    chart: {
      files: [],
      metadata: {
        name: 'test-chart',
        version: '1.0.0',
        apiVersion: 'v2',
        urls: [],
      },
      templates: [],
      values: {},
    },
    info: {
      description: 'Revision 1',
      deleted: '',
      first_deployed: '2026-01-01T00:00:00Z',
      last_deployed: '2026-01-01T00:00:00Z',
      status: 'deployed',
      notes: '',
    },
    version: 1,
  },
  {
    name: 'my-release',
    namespace: 'test-ns',
    chart: {
      files: [],
      metadata: {
        name: 'test-chart',
        version: '1.0.0',
        apiVersion: 'v2',
        urls: [],
      },
      templates: [],
      values: {},
    },
    info: {
      description: 'Revision 2',
      deleted: '',
      first_deployed: '2026-01-01T00:00:00Z',
      last_deployed: '2026-01-02T00:00:00Z',
      status: 'deployed',
      notes: '',
    },
    version: 2,
  },
];

const defaultFormikProps = {
  values: { version: 1 },
  errors: {},
  touched: {},
  isSubmitting: false,
  isValidating: false,
  status: undefined,
  submitCount: 0,
  dirty: false,
  isValid: true,
  initialValues: { version: 1 },
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
  releaseName: 'my-release',
  releaseHistory: mockReleaseHistory,
  helmActionConfig: {
    type: HelmActionType.Rollback,
    title: 'Rollback Helm Release',
    subTitle: 'Select a version to rollback to.',
    helmReleaseApi: '/api/helm/release',
    fetch: jest.fn(),
    redirectURL: '/helm-releases',
  },
};

describe('HelmReleaseRollbackForm', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render the form title', () => {
    renderWithProviders(<HelmReleaseRollbackForm {...defaultProps} />);

    expect(screen.getByText('Rollback Helm Release')).toBeVisible();
  });

  it('should display the rollback help text', () => {
    renderWithProviders(<HelmReleaseRollbackForm {...defaultProps} />);

    expect(screen.getByText('Select the version to rollback to')).toBeVisible();
  });

  it('should render the revision history table with release entries', () => {
    renderWithProviders(<HelmReleaseRollbackForm {...defaultProps} />);

    expect(screen.getByTestId('history-table')).toBeVisible();
    expect(screen.getByText('Revision history')).toBeVisible();
  });

  it('should render Rollback as the submit button label', () => {
    renderWithProviders(<HelmReleaseRollbackForm {...defaultProps} />);

    expect(screen.getByRole('button', { name: 'Rollback' })).toBeVisible();
  });

  it('should disable submit button when form is not dirty', () => {
    renderWithProviders(<HelmReleaseRollbackForm {...defaultProps} dirty={false} />);

    expect(screen.getByRole('button', { name: 'Rollback' })).toBeDisabled();
  });

  it('should disable submit button when form is submitting', () => {
    renderWithProviders(<HelmReleaseRollbackForm {...defaultProps} dirty isSubmitting />);

    expect(screen.getByRole('button', { name: 'Rollback' })).toBeDisabled();
  });

  it('should enable submit button when form is dirty and has no errors', () => {
    renderWithProviders(<HelmReleaseRollbackForm {...defaultProps} dirty isSubmitting={false} />);

    expect(screen.getByRole('button', { name: 'Rollback' })).not.toBeDisabled();
  });

  it('should display submit error when status has submitError', () => {
    renderWithProviders(
      <HelmReleaseRollbackForm {...defaultProps} status={{ submitError: 'Rollback failed' }} />,
    );

    expect(screen.getByText('Rollback failed')).toBeVisible();
  });

  it('should render Cancel button', () => {
    renderWithProviders(<HelmReleaseRollbackForm {...defaultProps} />);

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeVisible();
  });
});
