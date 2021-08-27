import * as React from 'react';
import { configure, render, waitFor } from '@testing-library/react';
import { Formik, FormikConfig } from 'formik';
import { Provider } from 'react-redux';
import store from '@console/internal/redux';
import userEvent from '../../__tests__/user-event';
import EnvironmentVariablesSection, {
  EnvironmentVariablesSectionFormData,
} from '../EnvironmentVariablesSection';

configure({ testIdAttribute: 'data-test' });

const Wrapper: React.FC<FormikConfig<EnvironmentVariablesSectionFormData>> = ({
  children,
  ...formikConfig
}) => (
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

describe('EnvironmentVariablesSection', () => {
  it('should render one row of input fields to enter a environment variable', async () => {
    const initialValues: EnvironmentVariablesSectionFormData = {
      formData: {
        environmentVariables: [],
      },
    };
    const onSubmit = jest.fn();

    const renderResult = render(
      <Wrapper initialValues={initialValues} onSubmit={onSubmit}>
        <EnvironmentVariablesSection namespace="my-namespace" />
      </Wrapper>,
    );

    renderResult.getByTestId('section environment-variables');
    renderResult.getByText('Environment Variables');
    expect(renderResult.queryAllByPlaceholderText('Name')).toHaveLength(1);
    expect(renderResult.queryAllByPlaceholderText('Value')).toHaveLength(1);
    renderResult.getByText('Add value');
    renderResult.getByText('Add from ConfigMap or Secret');

    expect(onSubmit).toHaveBeenCalledTimes(0);
  });

  it('should render multiple rows when initial values contains some environment variables', async () => {
    const initialValues: EnvironmentVariablesSectionFormData = {
      formData: {
        environmentVariables: [
          { name: 'env-name', value: 'env value 1' },
          { name: 'another-env', value: 'env value 2' },
          { name: 'and-one-more-env', value: 'env value 3' },
        ],
      },
    };
    const onSubmit = jest.fn();

    const renderResult = render(
      <Wrapper initialValues={initialValues} onSubmit={onSubmit}>
        <EnvironmentVariablesSection namespace="my-namespace" />
      </Wrapper>,
    );

    renderResult.getByTestId('section environment-variables');
    renderResult.getByText('Environment Variables');
    expect(renderResult.queryAllByPlaceholderText('Name')).toHaveLength(3);
    expect(renderResult.queryAllByPlaceholderText('Value')).toHaveLength(3);

    expect(onSubmit).toHaveBeenCalledTimes(0);
  });

  it('should render also ConfigMap and Secret references', async () => {
    const initialValues: EnvironmentVariablesSectionFormData = {
      formData: {
        environmentVariables: [
          { name: 'env-name', value: 'env value 1' },
          {
            name: 'a-configmap-env',
            valueFrom: {
              configMapKeyRef: {
                name: 'config-service-cabundle',
                key: 'service-ca.crt',
              },
            },
          },
          {
            name: 'a-secret-env',
            valueFrom: {
              secretKeyRef: {
                name: 'nodeinfo-serverless-generic-webhook-secret',
                key: 'WebHookSecretKey',
              },
            },
          },
        ],
      },
    };
    const onSubmit = jest.fn();

    const renderResult = render(
      <Wrapper initialValues={initialValues} onSubmit={onSubmit}>
        <EnvironmentVariablesSection namespace="my-namespace" />
      </Wrapper>,
    );

    renderResult.getByTestId('section environment-variables');
    renderResult.getByText('Environment Variables');
    expect(renderResult.queryAllByPlaceholderText('Name')).toHaveLength(3);
    expect(renderResult.queryAllByPlaceholderText('Value')).toHaveLength(1);

    expect(onSubmit).toHaveBeenCalledTimes(0);
  });

  it('should update formik data', async () => {
    const initialValues: EnvironmentVariablesSectionFormData = {
      formData: {
        environmentVariables: [],
      },
    };
    const onSubmit = jest.fn();

    const renderResult = render(
      <Wrapper initialValues={initialValues} onSubmit={onSubmit}>
        <EnvironmentVariablesSection namespace="my-namespace" />
      </Wrapper>,
    );

    userEvent.click(renderResult.getByText('Add value'));
    userEvent.click(renderResult.getByText('Add value'));

    expect(renderResult.queryAllByPlaceholderText('Name')).toHaveLength(3);
    expect(renderResult.queryAllByPlaceholderText('Value')).toHaveLength(3);

    const [name1, name2, name3] = renderResult.queryAllByPlaceholderText('Name');
    const [value1, value2, value3] = renderResult.queryAllByPlaceholderText('Value');

    userEvent.type(name1, 'env key 1');
    userEvent.type(value1, 'env value 1');
    userEvent.type(name2, 'env key 2');
    userEvent.type(value2, 'env value 2');
    userEvent.type(name3, 'env key 3');
    userEvent.type(value3, 'env value 3');

    // Submit
    const submitButton = renderResult.getByRole('button', { name: 'Submit' });
    userEvent.click(submitButton);
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    const expectedFormData: EnvironmentVariablesSectionFormData = {
      formData: {
        environmentVariables: [
          { name: 'env key 1', value: 'env value 1' },
          { name: 'env key 2', value: 'env value 2' },
          { name: 'env key 3', value: 'env value 3' },
        ],
      },
    };
    expect(onSubmit).toHaveBeenLastCalledWith(expectedFormData, expect.anything());
  });
});
