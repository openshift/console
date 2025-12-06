import { screen, waitFor, fireEvent } from '@testing-library/react';
import { Map as ImmutableMap } from 'immutable';
import * as k8sResourceModule from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource';
import * as modal from '@console/internal/components/factory/modal';
import { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { testResourceInstance, testModel } from '../../../../../mocks';
import {
  ResourceRequirementsModal,
  ResourceRequirementsModalProps,
  ResourceRequirementsModalLink,
} from '../resource-requirements';

jest.mock('@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource', () => {
  const actual = jest.requireActual('@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource');
  return {
    ...actual,
    k8sUpdate: jest.fn(),
  };
});

jest.mock('@console/internal/components/factory/modal', () => {
  const actual = jest.requireActual('@console/internal/components/factory/modal');
  return {
    ...actual,
    createModalLauncher: jest.fn(),
  };
});

const k8sUpdateMock = k8sResourceModule.k8sUpdate as jest.Mock;
const createModalLauncherMock = modal.createModalLauncher as jest.Mock;

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
    k8sUpdateMock.mockResolvedValue({} as K8sResourceKind);

    renderModal();

    fireEvent.change(screen.getByRole('textbox', { name: 'CPU cores' }), {
      target: { value: '200m' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Memory' }), {
      target: { value: '20Mi' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Storage' }), {
      target: { value: '50Mi' },
    });

    const saveButton = screen.getByRole('button', { name: 'Save' });
    fireEvent.click(saveButton);

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
    jest.clearAllMocks();
  });

  it('should render button link with resource requests', () => {
    renderWithProviders(
      <ResourceRequirementsModalLink obj={obj} type="requests" path="resources" />,
      {
        initialState: {
          k8s: ImmutableMap({
            RESOURCES: ImmutableMap({
              models: ImmutableMap({
                'testapp.coreos.com~v1alpha1~TestResource': testModel,
              }),
            }),
          }),
        },
      },
    );

    const { memory, cpu, 'ephemeral-storage': storage } = obj.spec.resources.requests;
    expect(
      screen.getByRole('button', { name: `CPU: ${cpu}, Memory: ${memory}, Storage: ${storage}` }),
    ).toBeVisible();
  });

  it('should render button link with resource limits', () => {
    renderWithProviders(
      <ResourceRequirementsModalLink obj={obj} type="limits" path="resources" />,
      {
        initialState: {
          k8s: ImmutableMap({
            RESOURCES: ImmutableMap({
              models: ImmutableMap({
                'testapp.coreos.com~v1alpha1~TestResource': testModel,
              }),
            }),
          }),
        },
      },
    );

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
      {
        initialState: {
          k8s: ImmutableMap({
            RESOURCES: ImmutableMap({
              models: ImmutableMap({
                'testapp.coreos.com~v1alpha1~TestResource': testModel,
              }),
            }),
          }),
        },
      },
    );

    expect(
      screen.getByRole('button', {
        name: 'CPU: None, Memory: None, Storage: None',
      }),
    ).toBeVisible();
  });

  it('should open resource requirements modal when button is clicked', async () => {
    const modalSpy = jest.fn();
    createModalLauncherMock.mockReturnValue(modalSpy);

    renderWithProviders(
      <ResourceRequirementsModalLink obj={obj} type="limits" path="resources" />,
      {
        initialState: {
          k8s: ImmutableMap({
            RESOURCES: ImmutableMap({
              models: ImmutableMap({
                'testapp.coreos.com~v1alpha1~TestResource': testModel,
              }),
            }),
          }),
        },
      },
    );

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(modalSpy).toHaveBeenCalled();
    });

    const modalArgs = modalSpy.mock.calls[0][0];
    expect(modalArgs.title).toEqual(`${obj.kind} Resource Limits`);
    expect(modalArgs.description).toEqual(
      'Define the resource limits for this TestResource instance.',
    );
    expect(modalArgs.obj).toEqual(obj);
    expect(modalArgs.model).toEqual(testModel);
    expect(modalArgs.type).toEqual('limits');
    expect(modalArgs.path).toEqual('resources');
  });
});
