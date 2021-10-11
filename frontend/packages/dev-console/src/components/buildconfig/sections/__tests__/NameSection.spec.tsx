import * as React from 'react';
import { configure, render, screen, waitFor } from '@testing-library/react';
import { Formik, FormikConfig } from 'formik';
import userEvent from '../../__tests__/user-event';
import NameSection, { NameSectionFormData } from '../NameSection';

configure({ testIdAttribute: 'data-test' });

const Wrapper: React.FC<FormikConfig<NameSectionFormData>> = ({ children, ...formikConfig }) => (
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

    userEvent.type(nameInput, 'changed name');

    await waitFor(() => {
      expect(screen.getAllByRole('textbox')[0].getAttribute('value')).toEqual('changed name');
    });

    expect(nameInput.value).toEqual('changed name');
    expect(nameInput.disabled).toBeFalsy();

    // Submit
    const submitButton = renderResult.getByRole('button', { name: 'Submit' });
    userEvent.click(submitButton);
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    const expectedFormData: NameSectionFormData = { formData: { name: 'changed name' } };
    expect(onSubmit).toHaveBeenLastCalledWith(expectedFormData, expect.anything());
  });
});
