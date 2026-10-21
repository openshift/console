import type { FC, ReactNode } from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Formik } from 'formik';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import type { TriggersSectionFormData } from '../TriggersSection';
import TriggersSection from '../TriggersSection';

// Mock PatternFly topology to prevent console warnings during tests
jest.mock('@patternfly/react-topology', () => ({}));

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResources: jest.fn(),
}));

const mockUseK8sWatchResources = useK8sWatchResources as jest.Mock;

const initialValues: TriggersSectionFormData = {
  formData: {
    triggers: {
      configChange: false,
      imageChange: false,
      otherTriggers: [],
    },
  },
};

interface FormikWrapperProps {
  children: ReactNode;
  onSubmit: jest.Mock;
}

const FormikWrapper: FC<FormikWrapperProps> = ({ children, onSubmit }) => (
  <Formik initialValues={initialValues} onSubmit={onSubmit}>
    {(formikProps) => (
      <form onSubmit={formikProps.handleSubmit}>
        {children}
        <input type="submit" value="Submit" />
      </form>
    )}
  </Formik>
);

const renderTriggersSection = (onSubmit: jest.Mock) => {
  renderWithProviders(
    <FormikWrapper onSubmit={onSubmit}>
      <TriggersSection namespace="a-namespace" />
    </FormikWrapper>,
  );
};

describe('TriggersSection', () => {
  beforeEach(() => {
    mockUseK8sWatchResources.mockReturnValue({
      secrets: { data: [], loaded: true, loadError: null },
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render all trigger configuration options', () => {
    const onSubmit = jest.fn();

    renderTriggersSection(onSubmit);

    expect(screen.getByTestId('section triggers')).toBeInTheDocument();
    expect(screen.getByText('Triggers')).toBeVisible();
    expect(
      screen.getByText('Automatically build a new image when config changes'),
    ).toBeInTheDocument();
    expect(screen.getByText('Automatically build a new image when image changes')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Add trigger' })).toBeVisible();

    const imageChangeCheckbox = screen.getByTestId('image-change checkbox') as HTMLInputElement;
    expect(imageChangeCheckbox).not.toBeChecked();

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('should toggle config change checkbox and submit form with updated value', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    renderTriggersSection(onSubmit);

    const configChangeCheckbox = screen.getByTestId('config-change checkbox');
    await user.click(configChangeCheckbox);

    const submitButton = screen.getByRole('button', { name: 'Submit' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    expect(onSubmit.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        formData: expect.objectContaining({
          triggers: expect.objectContaining({
            configChange: true,
          }),
        }),
      }),
    );
  });

  it('should toggle image change checkbox and submit form with updated value', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    renderTriggersSection(onSubmit);

    const imageChangeCheckbox = screen.getByTestId('image-change checkbox');
    await user.click(imageChangeCheckbox);

    const submitButton = screen.getByRole('button', { name: 'Submit' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    expect(onSubmit.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        formData: expect.objectContaining({
          triggers: expect.objectContaining({
            imageChange: true,
          }),
        }),
      }),
    );
  });
});
