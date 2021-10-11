import * as React from 'react';
import { configure, render, waitFor } from '@testing-library/react';
import { Formik, FormikConfig } from 'formik';
import { Provider } from 'react-redux';
import store from '@console/internal/redux';
import userEvent from '../../__tests__/user-event';
import { BuildConfigRunPolicy } from '../../types';
import PolicySection, { PolicySectionFormData } from '../PolicySection';

configure({ testIdAttribute: 'data-test' });

const Wrapper: React.FC<FormikConfig<PolicySectionFormData>> = ({ children, ...formikConfig }) => (
  <Provider store={store}>
    <Formik {...formikConfig}>
      {(formikProps) => (
        <form onSubmit={formikProps.handleSubmit}>
          {children}
          <input type="submit" value="Submit" />
        </form>
      )}
    </Formik>
  </Provider>
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

    const renderResult = render(
      <Wrapper initialValues={initialValues} onSubmit={onSubmit}>
        <PolicySection />
      </Wrapper>,
    );

    renderResult.getByTestId('section policy');
    renderResult.getByText('Policy');
    renderResult.getByText('Run policy');
    renderResult.getByTestId('dropdown run-policy');

    expect(onSubmit).toHaveBeenCalledTimes(0);
  });

  it('should submit the right value when switching to parallel', async () => {
    const onSubmit = jest.fn();

    const renderResult = render(
      <Wrapper initialValues={initialValues} onSubmit={onSubmit}>
        <PolicySection />
      </Wrapper>,
    );

    userEvent.click(renderResult.getByText('Serial'));
    userEvent.click(renderResult.getByText('Parallel'));

    // Submit
    const submitButton = renderResult.getByRole('button', { name: 'Submit' });
    userEvent.click(submitButton);
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
    const onSubmit = jest.fn();

    const renderResult = render(
      <Wrapper initialValues={initialValues} onSubmit={onSubmit}>
        <PolicySection />
      </Wrapper>,
    );

    userEvent.click(renderResult.getByText('Serial'));
    userEvent.click(renderResult.getByText('Serial latest only'));

    // Submit
    const submitButton = renderResult.getByRole('button', { name: 'Submit' });
    userEvent.click(submitButton);
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
