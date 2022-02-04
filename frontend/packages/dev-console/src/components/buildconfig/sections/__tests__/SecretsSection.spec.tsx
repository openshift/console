import * as React from 'react';
import { configure, render } from '@testing-library/react';
import { Formik, FormikConfig } from 'formik';
import { Provider } from 'react-redux';
import store from '@console/internal/redux';
import userEvent from '../../__tests__/user-event';
import SecretsSection, { SecretsSectionFormData } from '../SecretsSection';

configure({ testIdAttribute: 'data-test' });

// Skip Firehose fetching and render just the children
jest.mock('@console/internal/components/utils/firehose', () => {
  const firehose = jest.requireActual('@console/internal/components/utils/firehose');
  return {
    ...firehose,
    Firehose: ({ children }) => children,
  };
});

const Wrapper: React.FC<FormikConfig<SecretsSectionFormData>> = ({ children, ...formikConfig }) => (
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

describe('SecretsSection', () => {
  it('should render empty form', () => {
    const initialValues: SecretsSectionFormData = {
      formData: {
        secrets: [],
      },
    };
    const onSubmit = jest.fn();

    const renderResult = render(
      <Wrapper initialValues={initialValues} onSubmit={onSubmit}>
        <SecretsSection namespace="a-namespace" />
      </Wrapper>,
    );

    renderResult.getByTestId('section secrets');
    renderResult.getByText('Secrets');
    renderResult.getByText('Add secret');

    expect(onSubmit).toHaveBeenCalledTimes(0);
  });

  it('should render a secrets and mount point table after selecting add secret', () => {
    const initialValues: SecretsSectionFormData = {
      formData: {
        secrets: [],
      },
    };
    const onSubmit = jest.fn();

    const renderResult = render(
      <Wrapper initialValues={initialValues} onSubmit={onSubmit}>
        <SecretsSection namespace="a-namespace" />
      </Wrapper>,
    );

    // Do not render table by default
    expect(renderResult.queryByText('Secret')).toBeFalsy();
    expect(renderResult.queryByText('Mount point')).toBeFalsy();

    userEvent.click(renderResult.getByText('Add secret'));

    // Now expecting that there is a table to select a secret
    renderResult.getByText('Secret');
    renderResult.getByText('Mount point');

    expect(onSubmit).toHaveBeenCalledTimes(0);
  });

  it('should render default secrets as table', () => {
    const initialValues: SecretsSectionFormData = {
      formData: {
        secrets: [
          { secret: 'build-secret', mountPoint: '/secrets' },
          { secret: 'another-build-secret', mountPoint: '/more-secrets' },
        ],
      },
    };
    const onSubmit = jest.fn();

    const renderResult = render(
      <Wrapper initialValues={initialValues} onSubmit={onSubmit}>
        <SecretsSection namespace="a-namespace" />
      </Wrapper>,
    );

    // Expecting that the table is automatically shown
    renderResult.getByText('Secret');
    renderResult.getByText('Mount point');
    expect(renderResult.container.querySelectorAll('[data-test~="row"]')).toHaveLength(2);
    expect(renderResult.queryAllByRole('textbox')).toHaveLength(2);

    expect(onSubmit).toHaveBeenCalledTimes(0);
  });
});
