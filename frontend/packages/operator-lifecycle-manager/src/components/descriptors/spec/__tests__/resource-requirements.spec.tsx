import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as k8sResourceModule from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource';
import type { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { testResourceInstance, testModel } from '../../../../../mocks';
import type { ResourceRequirementsModalProps } from '../resource-requirements';
import { ResourceRequirementsModal, ResourceRequirementsModalLink } from '../resource-requirements';

const useK8sModelMock = jest.fn();
const useOverlayMock = jest.fn();

jest.mock('@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource', () => ({
  ...jest.requireActual('@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource'),
  k8sUpdate: jest.fn(),
}));

jest.mock('@console/shared/src/hooks/useK8sModel', () => ({
  useK8sModel: (...args) => useK8sModelMock(...args),
}));

jest.mock('@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay', () => ({
  useOverlay: (...args) => useOverlayMock(...args),
}));

const k8sUpdateMock = k8sResourceModule.k8sUpdate as jest.Mock;

describe('ResourceRequirementsModal', () => {
  const title = 'TestResource Resource Requests';
  const description = 'Define the resource requests for this TestResource instance.';
  const cancel = jest.fn();
  const close = jest.fn();

  const renderModal = (props: Partial<ResourceRequirementsModalProps> = {}) => {
    return renderWithProviders(
      <ResourceRequirementsModal
        title={title}
        description={description}
        obj={testResourceInstance}
        model={testModel}
        type="requests"
        cancel={cancel}
        path="resources"
        close={close}
        {...props}
      />,
    );
  };

  beforeEach(() => {
    cancel.mockClear();
    close.mockClear();
    jest.clearAllMocks();
  });

  it('should render modal form with title and description', () => {
    renderModal();

    expect(screen.getByRole('heading', { name: title })).toBeVisible();
    expect(screen.getByText(description)).toBeVisible();
    expect(screen.getByRole('button', { name: 'Save' })).toBeVisible();
  });

  it('should call k8sUpdate when form is submitted', async () => {
    const user = userEvent.setup();
    k8sUpdateMock.mockResolvedValue({} as K8sResourceKind);

    renderModal();

    const cpuInput = screen.getByRole('textbox', { name: 'CPU cores' });
    await user.clear(cpuInput);
    await user.type(cpuInput, '200m');
    const memoryInput = screen.getByRole('textbox', { name: 'Memory' });
    await user.clear(memoryInput);
    await user.type(memoryInput, '20Mi');
    const storageInput = screen.getByRole('textbox', { name: 'Storage' });
    await user.clear(storageInput);
    await user.type(storageInput, '50Mi');

    const saveButton = screen.getByRole('button', { name: 'Save' });
    await user.click(saveButton);

    await waitFor(() => {
      expect(k8sUpdateMock).toHaveBeenCalled();
    });

    const [model, newObj] = k8sUpdateMock.mock.calls[0] as [K8sKind, K8sResourceKind];
    expect(model).toEqual(testModel);
    expect(newObj.spec.resources.requests).toEqual({
      cpu: '200m',
      memory: '20Mi',
      'ephemeral-storage': '50Mi',
    });
  });
});

describe('ResourceRequirementsModalLink', () => {
  let obj: K8sResourceKind;
  let launchModalMock: jest.Mock;

  beforeEach(() => {
    obj = {
      ...testResourceInstance,
      spec: {
        ...testResourceInstance.spec,
        resources: {
          limits: { memory: '50Mi', cpu: '500m', 'ephemeral-storage': '50Mi' },
          requests: { memory: '50Mi', cpu: '500m', 'ephemeral-storage': '50Mi' },
        },
      },
    };

    launchModalMock = jest.fn();
    useK8sModelMock.mockReturnValue([testModel, false]);
    useOverlayMock.mockReturnValue(launchModalMock);

    jest.clearAllMocks();
  });

  it('should render button link with resource requests', () => {
    renderWithProviders(
      <ResourceRequirementsModalLink obj={obj} type="requests" path="resources" />,
    );

    const { memory, cpu, 'ephemeral-storage': storage } = obj.spec.resources.requests;
    expect(
      screen.getByRole('button', { name: `CPU: ${cpu}, Memory: ${memory}, Storage: ${storage}` }),
    ).toBeVisible();
  });

  it('should render button link with resource limits', () => {
    renderWithProviders(<ResourceRequirementsModalLink obj={obj} type="limits" path="resources" />);

    const { memory, cpu, 'ephemeral-storage': storage } = obj.spec.resources.limits;
    expect(
      screen.getByRole('button', {
        name: `CPU: ${cpu}, Memory: ${memory}, Storage: ${storage}`,
      }),
    ).toBeVisible();
  });

  it('should render default values when resources are undefined', () => {
    const objWithoutResources = {
      ...testResourceInstance,
      spec: {
        ...testResourceInstance.spec,
        resources: undefined,
      },
    };
    renderWithProviders(
      <ResourceRequirementsModalLink obj={objWithoutResources} type="limits" path="resources" />,
    );

    expect(
      screen.getByRole('button', {
        name: 'CPU: None, Memory: None, Storage: None',
      }),
    ).toBeVisible();
  });

  it('should open resource requirements modal when button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ResourceRequirementsModalLink obj={obj} type="limits" path="resources" />);

    await user.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(launchModalMock).toHaveBeenCalled();
    });

    const [, modalProps] = launchModalMock.mock.calls[0];
    expect(modalProps.title).toEqual(`${obj.kind} Resource Limits`);
    expect(modalProps.description).toEqual(
      'Define the resource limits for this TestResource instance.',
    );
    expect(modalProps.obj).toEqual(obj);
    expect(modalProps.model).toEqual(testModel);
    expect(modalProps.type).toEqual('limits');
    expect(modalProps.path).toEqual('resources');
  });
});
