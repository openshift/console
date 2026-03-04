import type { FC, ReactNode } from 'react';
import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { FormikConfig } from 'formik';
import { Formik } from 'formik';
import type { TriggersSectionFormData } from '../TriggersSection';
import TriggersSection from '../TriggersSection';

interface WrapperProps extends FormikConfig<TriggersSectionFormData> {
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
    const user = userEvent.setup();
    const onSubmit = jest.fn();

    const renderResult = render(
      <Wrapper initialValues={initialValues} onSubmit={onSubmit}>
        <TriggersSection namespace="a-namespace" />
      </Wrapper>,
    );

    // Change form
    await user.click(renderResult.getByTestId('config-change checkbox'));

    // Submit
    const submitButton = renderResult.getByRole('button', { name: 'Submit' });
    await user.click(submitButton);
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
    const user = userEvent.setup();
    const onSubmit = jest.fn();

    const renderResult = render(
      <Wrapper initialValues={initialValues} onSubmit={onSubmit}>
        <TriggersSection namespace="a-namespace" />
      </Wrapper>,
    );

    // Change form
    await user.click(renderResult.getByTestId('image-change checkbox'));

    // Submit
    const submitButton = renderResult.getByRole('button', { name: 'Submit' });
    await user.click(submitButton);
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
