import { screen } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import CloudShellSetupForm from '../CloudShellSetupForm';

jest.mock('react-i18next', () => ({
  ...jest.requireActual('react-i18next'),
  Trans: ({ children }: { children }) => children || null,
}));

jest.mock('@openshift-console/plugin-shared/src/hooks/useResizeObserver', () => ({
  useResizeObserver: jest.fn(),
}));

jest.mock('formik', () => ({
  useField: jest.fn(() => [{}, {}]),
  useFormikContext: jest.fn(() => ({
    setFieldValue: jest.fn(),
    setFieldTouched: jest.fn(),
    validateForm: jest.fn(),
  })),
  getFieldId: jest.fn(),
}));

describe('CloudShellSetupForm', () => {
  it('should disable submit button', () => {
    const { rerender } = renderWithProviders(
      <CloudShellSetupForm
        errors={{}}
        isSubmitting={false}
        handleSubmit={() => {}}
        handleReset={() => {}}
      />,
    );
    expect(screen.getByTestId('save-changes')).not.toBeDisabled();

    rerender(
      <CloudShellSetupForm
        errors={{}}
        isSubmitting
        handleSubmit={() => {}}
        handleReset={() => {}}
      />,
    );
    expect(screen.getByTestId('save-changes')).toBeDisabled();

    rerender(
      <CloudShellSetupForm
        errors={{ test: 'test' }}
        isSubmitting={false}
        handleSubmit={() => {}}
        handleReset={() => {}}
      />,
    );
    expect(screen.getByTestId('save-changes')).toBeDisabled();
  });

  it('should display submit errors', () => {
    renderWithProviders(
      <CloudShellSetupForm
        errors={{}}
        isSubmitting={false}
        handleSubmit={() => {}}
        handleReset={() => {}}
        status={{ submitError: 'test' }}
      />,
    );
    expect(screen.getByTestId('alert-error')).toHaveTextContent('test');
  });

  it('should display AdminNamespaceSection for admins and not display NamespaceSection', () => {
    renderWithProviders(
      <CloudShellSetupForm
        errors={{}}
        isSubmitting={false}
        handleSubmit={() => {}}
        handleReset={() => {}}
        isAdmin
      />,
    );
    expect(screen.queryByTestId('webterminal-namespace-dropdown')).not.toBeInTheDocument();
    expect(screen.getByTestId('admin-namespace-section')).toBeInTheDocument();
  });

  it('should display NamespaceSection for non admins and not display AdminNamespaceSection', () => {
    renderWithProviders(
      <CloudShellSetupForm
        errors={{}}
        isSubmitting={false}
        handleSubmit={() => {}}
        handleReset={() => {}}
      />,
    );
    expect(screen.queryByTestId('admin-namespace-section')).not.toBeInTheDocument();
    expect(screen.getByTestId('webterminal-namespace-dropdown')).toBeInTheDocument();
  });
});
