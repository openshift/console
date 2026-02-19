import type { ComponentProps } from 'react';
import { screen, fireEvent } from '@testing-library/react';
import type { FormikProps, FormikValues } from 'formik';
import { formikFormProps } from '@console/shared/src/test-utils/formik-props-utils';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import ResourceLimitsModal from '../ResourceLimitsModal';

jest.mock('@console/dev-console/src/components/import/advanced/ResourceLimitSection', () => ({
  default: () => null,
}));

type ResourceLimitsModalProps = ComponentProps<typeof ResourceLimitsModal>;

describe('ResourceLimitsModal Form', () => {
  let formProps: ResourceLimitsModalProps;

  type Props = FormikProps<FormikValues> & ResourceLimitsModalProps;

  beforeEach(() => {
    jest.clearAllMocks();
    formProps = {
      ...formikFormProps,
      isSubmitting: false,
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

  it('renders the modal with the correct title and initial elements', () => {
    renderWithProviders(<ResourceLimitsModal {...formProps} />);

    expect(screen.getByText('Edit resource limits')).toBeVisible();
    expect(screen.getByRole('form', { name: 'Edit resource limits modal' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Save' })).toBeVisible();
  });

  it('calls the cancel function when the Cancel button is clicked', async () => {
    renderWithProviders(<ResourceLimitsModal {...formProps} />);

    await fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(formProps.cancel).toHaveBeenCalledTimes(1);
  });

  it('calls the handleSubmit function when the form is submitted', async () => {
    renderWithProviders(<ResourceLimitsModal {...formProps} />);

    await fireEvent.submit(screen.getByRole('form', { name: 'Edit resource limits modal' }));
    expect(formProps.handleSubmit).toHaveBeenCalledTimes(1);
  });
});
