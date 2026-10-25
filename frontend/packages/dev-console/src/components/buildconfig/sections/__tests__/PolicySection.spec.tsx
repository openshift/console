import type { FC, ReactNode } from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { FormikConfig } from 'formik';
import { Formik } from 'formik';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { BuildConfigRunPolicy } from '../../types';
import type { PolicySectionFormData } from '../PolicySection';
import PolicySection from '../PolicySection';

interface WrapperProps extends FormikConfig<PolicySectionFormData> {
  children?: ReactNode;
}

const Wrapper: FC<WrapperProps> = ({ children, ...formikConfig }) => (
  <Formik {...formikConfig}>
    {(formikProps) => (
      <form onSubmit={formikProps.handleSubmit}>
        {children}
        <input type="submit" value="Submit" />
      </form>
    )}
  </Formik>
);

const initialValues: PolicySectionFormData = {
  formData: {
    policy: {
      runPolicy: null,
    },
  },
};

describe('PolicySectionFormData', () => {
  it('should render form', () => {
    const onSubmit = jest.fn();

    renderWithProviders(
      <Wrapper initialValues={initialValues} onSubmit={onSubmit}>
        <PolicySection />
      </Wrapper>,
    );

    expect(screen.getByTestId('section policy')).toBeInTheDocument();
    expect(screen.getByText('Policy')).toBeVisible();
    expect(screen.getByText('Run policy')).toBeVisible();
    expect(screen.getByTestId('dropdown run-policy')).toBeVisible();

    expect(onSubmit).toHaveBeenCalledTimes(0);
  });

  it('should submit the right value when switching to parallel', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();

    renderWithProviders(
      <Wrapper initialValues={initialValues} onSubmit={onSubmit}>
        <PolicySection />
      </Wrapper>,
    );

    await user.click(screen.getByText('Serial'));
    await user.click(screen.getByText('Parallel'));

    // Submit
    const submitButton = screen.getByRole('button', { name: 'Submit' });
    await user.click(submitButton);
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    const expectedFormData: PolicySectionFormData = {
      formData: {
        policy: {
          runPolicy: BuildConfigRunPolicy.Parallel,
        },
      },
    };
    expect(onSubmit).toHaveBeenLastCalledWith(expectedFormData, expect.anything());
  });

  it('should submit the right value when switching to serial latest only', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();

    renderWithProviders(
      <Wrapper initialValues={initialValues} onSubmit={onSubmit}>
        <PolicySection />
      </Wrapper>,
    );

    await user.click(screen.getByText('Serial'));
    await user.click(screen.getByText('Serial latest only'));

    // Submit
    const submitButton = screen.getByRole('button', { name: 'Submit' });
    await user.click(submitButton);
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    const expectedFormData: PolicySectionFormData = {
      formData: {
        policy: {
          runPolicy: BuildConfigRunPolicy.SerialLatestOnly,
        },
      },
    };
    expect(onSubmit).toHaveBeenLastCalledWith(expectedFormData, expect.anything());
  });
});
