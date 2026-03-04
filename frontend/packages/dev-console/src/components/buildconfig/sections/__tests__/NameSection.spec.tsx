import type { FC, ReactNode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { FormikConfig } from 'formik';
import { Formik } from 'formik';
import type { NameSectionFormData } from '../NameSection';
import NameSection from '../NameSection';

interface WrapperProps extends FormikConfig<NameSectionFormData> {
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

describe('NameSection', () => {
  it('should render annodated form section without initial formData', () => {
    const initialValues = {} as NameSectionFormData;
    const onSubmit = jest.fn();

    const renderResult = render(
      <Wrapper initialValues={initialValues} onSubmit={onSubmit}>
        <NameSection />
      </Wrapper>,
    );

    renderResult.getByTestId('section name');
    renderResult.getByText('Name');
    const inputFields = renderResult.getAllByRole('textbox') as HTMLInputElement[];

    expect(inputFields[0].getAttribute('label')).toEqual('Name');
    expect(inputFields[0].disabled).toBeFalsy();
    expect(inputFields[0].value).toEqual('');

    expect(onSubmit).toHaveBeenCalledTimes(0);
  });

  it('should render annodated form section without initial name', () => {
    const initialValues: NameSectionFormData = { formData: {} };
    const onSubmit = jest.fn();

    const renderResult = render(
      <Wrapper initialValues={initialValues} onSubmit={onSubmit}>
        <NameSection />
      </Wrapper>,
    );

    renderResult.getByTestId('section name');
    renderResult.getByText('Name');
    const inputFields = renderResult.getAllByRole('textbox') as HTMLInputElement[];

    expect(inputFields[0].getAttribute('label')).toEqual('Name');
    expect(inputFields[0].disabled).toBeFalsy();
    expect(inputFields[0].value).toEqual('');

    expect(onSubmit).toHaveBeenCalledTimes(0);
  });

  it('should render annodated form section with initial data', () => {
    const initialValues: NameSectionFormData = { formData: { name: 'initial name' } };
    const onSubmit = jest.fn();

    const renderResult = render(
      <Wrapper initialValues={initialValues} onSubmit={onSubmit}>
        <NameSection />
      </Wrapper>,
    );

    renderResult.getByTestId('section name');
    renderResult.getByText('Name');
    const inputFields = renderResult.getAllByRole('textbox') as HTMLInputElement[];

    expect(inputFields[0].getAttribute('label')).toEqual('Name');
    expect(inputFields[0].disabled).toBeTruthy();
    expect(inputFields[0].value).toEqual('initial name');

    expect(onSubmit).toHaveBeenCalledTimes(0);
  });

  it('should update formik data', async () => {
    const user = userEvent.setup();
    const initialValues: NameSectionFormData = { formData: { name: '' } };
    const onSubmit = jest.fn();

    const renderResult = render(
      <Wrapper initialValues={initialValues} onSubmit={onSubmit}>
        <NameSection />
      </Wrapper>,
    );

    const [nameInput] = renderResult.getAllByRole('textbox') as HTMLInputElement[];

    expect(nameInput.value).toEqual('');
    expect(nameInput.disabled).toBeFalsy();

    await user.type(nameInput, 'changed name');

    await waitFor(() => {
      expect(screen.getAllByRole('textbox')[0].getAttribute('value')).toEqual('changed name');
    });

    expect(nameInput.value).toEqual('changed name');
    expect(nameInput.disabled).toBeFalsy();

    // Submit
    const submitButton = renderResult.getByRole('button', { name: 'Submit' });
    await user.click(submitButton);
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    const expectedFormData: NameSectionFormData = { formData: { name: 'changed name' } };
    expect(onSubmit).toHaveBeenLastCalledWith(expectedFormData, expect.anything());
  }, 30000); // userEvent.type is slow
});
