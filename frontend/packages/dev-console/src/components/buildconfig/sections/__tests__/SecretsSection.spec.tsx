import type { FC, ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { FormikConfig } from 'formik';
import { Formik } from 'formik';
import { Provider } from 'react-redux';
import store from '@console/internal/redux';
import type { SecretsSectionFormData } from '../SecretsSection';
import SecretsSection from '../SecretsSection';

interface WrapperProps extends FormikConfig<SecretsSectionFormData> {
  children?: ReactNode;
}

const Wrapper: FC<WrapperProps> = ({ children, ...formikConfig }) => (
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

    render(
      <Wrapper initialValues={initialValues} onSubmit={onSubmit}>
        <SecretsSection namespace="a-namespace" />
      </Wrapper>,
    );

    expect(screen.getByTestId('section secrets')).toBeInTheDocument();
    expect(screen.getByText('Secrets')).toBeVisible();
    expect(screen.getByText('Add secret')).toBeVisible();

    expect(onSubmit).toHaveBeenCalledTimes(0);
  });

  it('should render a secrets and mount point table after selecting add secret', async () => {
    const user = userEvent.setup();
    const initialValues: SecretsSectionFormData = {
      formData: {
        secrets: [],
      },
    };
    const onSubmit = jest.fn();

    render(
      <Wrapper initialValues={initialValues} onSubmit={onSubmit}>
        <SecretsSection namespace="a-namespace" />
      </Wrapper>,
    );

    // Do not render table by default
    expect(screen.queryByText('Secret')).toBeFalsy();
    expect(screen.queryByText('Mount point')).toBeFalsy();

    await user.click(screen.getByText('Add secret'));

    // Now expecting that there is a table to select a secret
    expect(screen.getByText('Secret')).toBeVisible();
    expect(screen.getByText('Mount point')).toBeVisible();

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

    render(
      <Wrapper initialValues={initialValues} onSubmit={onSubmit}>
        <SecretsSection namespace="a-namespace" />
      </Wrapper>,
    );

    // Expecting that the table is automatically shown
    expect(screen.getByText('Secret')).toBeVisible();
    expect(screen.getByText('Mount point')).toBeVisible();
    // Each row contains a textbox for mount point
    expect(screen.queryAllByRole('textbox')).toHaveLength(2);

    expect(onSubmit).toHaveBeenCalledTimes(0);
  });
});
