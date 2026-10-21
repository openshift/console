import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Formik } from 'formik';
import type { ObjectSchema } from 'yup';
import * as yup from 'yup';
import { limitsValidationSchema } from '@console/dev-console/src/components/import/validation-schema';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { getLimitsDataFromResource } from '@console/shared/src/utils/resource-utils';
import { t } from '../../../../../../../__mocks__/i18next';
import ResourceLimitsModal from '../ResourceLimitsModal';

jest.mock('@patternfly/react-topology', () => ({}));

const emptyLimits = {
  cpu: {
    request: '',
    requestUnit: '',
    defaultRequestUnit: '',
    limit: '',
    limitUnit: '',
    defaultLimitUnit: '',
  },
  memory: {
    request: '',
    requestUnit: 'Mi',
    defaultRequestUnit: 'Mi',
    limit: '',
    limitUnit: 'Mi',
    defaultLimitUnit: 'Mi',
  },
};

const resourceLimitsSchema = yup.object().shape({
  limits: limitsValidationSchema(t),
});

const limitsFormValues = {
  limits: emptyLimits,
  container: 'hello-openshift',
};

const baseDeployment = (): K8sResourceKind =>
  ({
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
  } as K8sResourceKind);

type RenderResourceLimitsModalOptions = {
  resource?: K8sResourceKind;
  validationSchema?: ObjectSchema<unknown>;
  onSubmit?: jest.Mock;
  cancel?: jest.Mock;
};

const renderResourceLimitsModal = ({
  resource,
  validationSchema,
  onSubmit: onSubmitOption,
  cancel: cancelOption,
}: RenderResourceLimitsModalOptions = {}) => {
  const onSubmit = onSubmitOption ?? jest.fn();
  const cancel = cancelOption ?? jest.fn();
  const initialValues = resource
    ? {
        limits: getLimitsDataFromResource(resource),
        container: resource.spec.template.spec.containers[0].name,
      }
    : limitsFormValues;

  return {
    onSubmit,
    cancel,
    ...renderWithProviders(
      <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={onSubmit}>
        {(formikProps) => (
          <ResourceLimitsModal {...formikProps} cancel={cancel} isSubmitting={false} />
        )}
      </Formik>,
    ),
  };
};

describe('ResourceLimitsModal Form', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the modal title', () => {
    renderResourceLimitsModal();

    expect(screen.getByText('Edit resource limits')).toBeVisible();
  });

  it('renders the form with Cancel and Save actions', () => {
    renderResourceLimitsModal();

    expect(screen.getByRole('form')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Save' })).toBeVisible();
  });

  it('calls the cancel function when the Cancel button is clicked', async () => {
    const user = userEvent.setup();
    const cancel = jest.fn();
    renderResourceLimitsModal({ cancel });

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it('submits the form when Save is clicked', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    renderResourceLimitsModal({ onSubmit });

    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});

describe('ResourceLimitsModal with validation (resource limits schema)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('populates CPU and Memory request/limit fields from the workload resource', () => {
    const resource = baseDeployment();
    resource.spec.template.spec.containers[0].resources = {
      requests: { cpu: '100m', memory: '128Mi' },
      limits: { cpu: '500m', memory: '256Mi' },
    };

    renderResourceLimitsModal({ resource, validationSchema: resourceLimitsSchema });

    expect(screen.getByDisplayValue('100')).toBeVisible();
    expect(screen.getByDisplayValue('500')).toBeVisible();
    expect(screen.getByDisplayValue('128')).toBeVisible();
    expect(screen.getByDisplayValue('256')).toBeVisible();
  });

  it('disables Save when CPU request is greater than CPU limit', async () => {
    const user = userEvent.setup();
    const resource = baseDeployment();
    resource.spec.template.spec.containers[0].resources = {
      requests: { cpu: '100m', memory: '128Mi' },
      limits: { cpu: '200m', memory: '256Mi' },
    };

    renderResourceLimitsModal({ resource, validationSchema: resourceLimitsSchema });

    const save = screen.getByRole('button', { name: 'Save' });
    expect(save).not.toBeDisabled();

    const cpuRequest = screen.getByRole('spinbutton', { name: 'CPU request' });
    await user.click(cpuRequest);
    await user.keyboard('{Control>}a{/Control}');
    await user.keyboard('300');

    await waitFor(() => expect(save).toBeDisabled());
    expect(
      await screen.findByText('CPU request must be less than or equal to limit.'),
    ).toBeVisible();
  });

  it('disables Save when Memory request is greater than Memory limit', async () => {
    const user = userEvent.setup();
    const resource = baseDeployment();
    resource.spec.template.spec.containers[0].resources = {
      requests: { cpu: '100m', memory: '128Mi' },
      limits: { cpu: '500m', memory: '256Mi' },
    };

    renderResourceLimitsModal({ resource, validationSchema: resourceLimitsSchema });

    const save = screen.getByRole('button', { name: 'Save' });
    const memoryRequest = screen.getByRole('spinbutton', { name: 'Memory request' });

    await user.click(memoryRequest);
    await user.keyboard('{Control>}a{/Control}');
    await user.keyboard('512');

    await waitFor(() => expect(save).toBeDisabled());
    expect(
      await screen.findByText('Memory request must be less than or equal to limit.'),
    ).toBeVisible();
  });
});
