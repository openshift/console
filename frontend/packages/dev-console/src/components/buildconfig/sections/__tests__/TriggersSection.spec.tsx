import * as React from 'react';
import { configure, render, waitFor } from '@testing-library/react';
import { Formik, FormikConfig } from 'formik';
import userEvent from '../../__tests__/user-event';
import TriggersSection, { TriggersSectionFormData } from '../TriggersSection';

configure({ testIdAttribute: 'data-test' });

const Wrapper: React.FC<FormikConfig<TriggersSectionFormData>> = ({
  children,
  ...formikConfig
}) => (
  <Formik {...formikConfig}>
    {(formikProps) => (
      <form onSubmit={formikProps.handleSubmit}>
        {children}
        <input type="submit" value="Submit" />
      </form>
    )}
  </Formik>
);

const initialValues: TriggersSectionFormData = {
  formData: {
    triggers: {
      configChange: false,
      imageChange: false,
      otherTriggers: [],
    },
  },
};

describe('TriggersSection', () => {
  it('should render empty form', () => {
    const onSubmit = jest.fn();

    const renderResult = render(
      <Wrapper initialValues={initialValues} onSubmit={onSubmit}>
        <TriggersSection namespace="a-namespace" />
      </Wrapper>,
    );

    renderResult.getByTestId('section triggers');
    renderResult.getByText('Triggers');
    renderResult.getByText('Automatically build a new image when config changes');
    renderResult.getByText('Automatically build a new image when image changes');
    renderResult.getByText('Add trigger');

    expect((renderResult.getByTestId('image-change checkbox') as HTMLInputElement).checked).toBe(
      false,
    );

    expect(onSubmit).toHaveBeenCalledTimes(0);
  });

  it('should allow user to change config change checkbox trigger and save this data', async () => {
    const onSubmit = jest.fn();

    const renderResult = render(
      <Wrapper initialValues={initialValues} onSubmit={onSubmit}>
        <TriggersSection namespace="a-namespace" />
      </Wrapper>,
    );

    // Change form
    userEvent.click(renderResult.getByTestId('config-change checkbox'));

    // Submit
    const submitButton = renderResult.getByRole('button', { name: 'Submit' });
    userEvent.click(submitButton);
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    const expectedFormData: TriggersSectionFormData = {
      formData: {
        triggers: {
          configChange: true,
          imageChange: false,
          otherTriggers: [],
        },
      },
    };
    expect(onSubmit).toHaveBeenLastCalledWith(expectedFormData, expect.anything());
  });

  it('should allow user to change image change checkbox trigger and save this data', async () => {
    const onSubmit = jest.fn();

    const renderResult = render(
      <Wrapper initialValues={initialValues} onSubmit={onSubmit}>
        <TriggersSection namespace="a-namespace" />
      </Wrapper>,
    );

    // Change form
    userEvent.click(renderResult.getByTestId('image-change checkbox'));

    // Submit
    const submitButton = renderResult.getByRole('button', { name: 'Submit' });
    userEvent.click(submitButton);
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    const expectedFormData: TriggersSectionFormData = {
      formData: {
        triggers: {
          configChange: false,
          imageChange: true,
          otherTriggers: [],
        },
      },
    };
    expect(onSubmit).toHaveBeenLastCalledWith(expectedFormData, expect.anything());
  });
});
