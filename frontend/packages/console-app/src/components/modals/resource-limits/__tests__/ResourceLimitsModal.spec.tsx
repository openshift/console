import * as React from 'react';
import { screen, configure, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FormikProps, FormikValues } from 'formik';
import { formikFormProps } from '@console/shared/src/test-utils/formik-props-utils';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import ResourceLimitsModal from '../ResourceLimitsModal';

type ResourceLimitsModalProps = React.ComponentProps<typeof ResourceLimitsModal>;

describe('ResourceLimitsModal Form', () => {
  let formProps: ResourceLimitsModalProps;

  type Props = FormikProps<FormikValues> & ResourceLimitsModalProps;

  beforeAll(() => {
    configure({ testIdAttribute: 'data-test' });
  });

  beforeEach(() => {
    formProps = {
      ...formikFormProps,
      cancel: jest.fn(),
      resource: {
        apiVersion: 'apps/v1',
        kind: 'Deployment',
        metadata: {
          name: 'xyz-deployment',
        },
        spec: {
          selector: {
            matchLabels: {
              app: 'hello-openshift',
            },
          },
          replicas: 1,
          template: {
            metadata: {
              labels: {
                app: 'hello-openshift',
              },
            },
            spec: {
              containers: [
                {
                  name: 'hello-openshift',
                  image: 'openshift/hello-openshift',
                  ports: [
                    {
                      containerPort: 8080,
                    },
                  ],
                },
              ],
            },
          },
        },
      },
    } as Props;
  });

  it('should render accessible ResourceLimitsModal with proper form structure', () => {
    renderWithProviders(<ResourceLimitsModal {...formProps} />);

    // Semantic query priority: Role → Label → Text → TestId
    const modal = screen.getByRole('dialog');
    expect(modal).toBeInTheDocument();
    expect(modal).toBeVisible();

    // Verify modal has accessible form
    const form = screen.getByRole('form');
    expect(form).toBeInTheDocument();
    expect(form).toBeVisible();

    // Verify form content is accessible to users
    expect(screen.getByText('Resource Limits')).toBeInTheDocument();
  });

  it('should handle form submission through user interaction', () => {
    renderWithProviders(<ResourceLimitsModal {...formProps} />);

    // User-centric: Verify modal and form are accessible
    const modal = screen.getByRole('dialog');
    expect(modal).toBeVisible();

    const form = screen.getByRole('form');
    expect(form).toBeVisible();

    // Simulate real user form submission behavior
    fireEvent.submit(form);

    // Verify form handler was called correctly
    expect(formProps.handleSubmit).toHaveBeenCalledTimes(1);
  });

  it('should handle modal cancellation through user interaction', () => {
    renderWithProviders(<ResourceLimitsModal {...formProps} />);

    // User-centric: Find cancel button
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    expect(cancelButton).toBeVisible();
    expect(cancelButton).not.toBeDisabled();

    // Simulate user clicking cancel
    fireEvent.click(cancelButton);

    // Verify cancel handler was called
    expect(formProps.cancel).toHaveBeenCalledTimes(1);
  });
});
