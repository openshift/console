import { screen, configure } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigureCountModal } from '@console/internal/components/modals/configure-count-modal';
import { DeploymentConfigModel } from '@console/internal/models';
import { useNonScalableImageCheck } from '@console/shared/src/hooks/useNonScalableImageCheck';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';

jest.mock('@console/shared/src/hooks/useNonScalableImageCheck', () => ({
  ...jest.requireActual('@console/shared/src/hooks/useNonScalableImageCheck'),
  useNonScalableImageCheck: jest.fn(),
}));

jest.mock('@console/shared/src/hooks/usePromiseHandler', () => ({
  usePromiseHandler: () => [jest.fn().mockResolvedValue(undefined), false, ''],
}));

const mockUseNonScalableImageCheck = useNonScalableImageCheck as jest.Mock;

const baseProps = {
  defaultValue: 1,
  titleKey: 'public~Edit Pod count',
  messageKey: 'public~{{resourceKinds}} maintain the desired number of healthy pods.',
  messageVariables: { resourceKinds: 'Deployments' },
  path: '/spec/replicas',
  buttonTextKey: 'public~Save',
  resource: {
    kind: 'DeploymentConfig',
    apiVersion: 'apps.openshift.io/v1',
    metadata: { name: 'test-dc', namespace: 'test-ns' },
    spec: {
      replicas: 1,
      triggers: [
        {
          type: 'ImageChange',
          imageChangeParams: {
            from: { kind: 'ImageStreamTag', name: 'myapp:latest', namespace: 'test-ns' },
          },
        },
      ],
    },
  },
  resourceKind: DeploymentConfigModel,
  opts: { path: 'scale' },
  closeOverlay: jest.fn(),
};

describe('ConfigureCountModal - Non-scalable image warning', () => {
  beforeAll(() => {
    configure({ testIdAttribute: 'data-test' });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNonScalableImageCheck.mockReturnValue({ isNonScalable: false, loading: false });
  });

  it('should show warning when image is non-scalable and value > 1', () => {
    mockUseNonScalableImageCheck.mockReturnValue({ isNonScalable: true, loading: false });

    const resource = {
      ...baseProps.resource,
      spec: { ...baseProps.resource.spec, replicas: 2 },
    };
    renderWithProviders(<ConfigureCountModal {...baseProps} resource={resource} />);

    expect(screen.getByText('Non-scalable image')).toBeVisible();
    expect(
      screen.getByText(
        'This image is not intended to run with more than one replica. Running multiple instances is not supported and might cause issues.',
      ),
    ).toBeVisible();
  });

  it('should not show warning when image is non-scalable but value is 1', () => {
    mockUseNonScalableImageCheck.mockReturnValue({ isNonScalable: true, loading: false });

    renderWithProviders(<ConfigureCountModal {...baseProps} />);

    expect(screen.queryByText('Non-scalable image')).toBeNull();
  });

  it('should not show warning when image is scalable', () => {
    mockUseNonScalableImageCheck.mockReturnValue({ isNonScalable: false, loading: false });

    const resource = {
      ...baseProps.resource,
      spec: { ...baseProps.resource.spec, replicas: 3 },
    };
    renderWithProviders(<ConfigureCountModal {...baseProps} resource={resource} />);

    expect(screen.queryByText('Non-scalable image')).toBeNull();
  });

  it('should not show warning for non-replica paths (e.g., parallelism)', () => {
    mockUseNonScalableImageCheck.mockReturnValue({ isNonScalable: true, loading: false });

    const resource = {
      ...baseProps.resource,
      spec: { ...baseProps.resource.spec, parallelism: 3 },
    };
    renderWithProviders(
      <ConfigureCountModal {...baseProps} path="/spec/parallelism" resource={resource} />,
    );

    expect(screen.queryByText('Non-scalable image')).toBeNull();
  });

  it('should show warning when user increments from 1 to 2 for a non-scalable image', async () => {
    mockUseNonScalableImageCheck.mockReturnValue({ isNonScalable: true, loading: false });

    renderWithProviders(<ConfigureCountModal {...baseProps} />);
    expect(screen.queryByText('Non-scalable image')).toBeNull();

    const user = userEvent.setup();
    const incrementButton = screen.getByRole('button', { name: 'Increment' });
    await user.click(incrementButton);

    expect(screen.getByText('Non-scalable image')).toBeVisible();
  });
});
