import * as React from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { applyMiddleware, combineReducers, createStore } from 'redux';
import thunk from 'redux-thunk';
import { testHook } from '../../../../../../../__tests__/utils/hooks-utils';
import {
  AccessReviewResourceAttributes,
  SelfSubjectAccessReviewKind,
} from '../../../../extensions/console-types';
import { SelfSubjectAccessReviewModel, ProjectModel } from '../../../../models';
import { k8sCreate } from '../../../../utils/k8s/k8s-resource';
import { SDKReducers } from '../../../redux';
import storeHandler from '../../../storeHandler';
import { checkAccess, useAccessReviewAllowed, useAccessReview } from '../rbac';

const DeploymentModel = {
  apiGroup: 'apps',
  plural: 'deployments',
};

const k8sCreateMock = k8sCreate as jest.Mock;

jest.mock('../../../../utils/k8s/k8s-resource', () => ({
  ...require.requireActual('../../../../utils/k8s/k8s-resource'),
  k8sCreate: jest.fn(),
}));

const originalConsole = { ...console };
const consoleMock = jest.fn();

beforeEach(() => {
  jest.resetAllMocks();

  const reduxStore = createStore(combineReducers(SDKReducers), {}, applyMiddleware(thunk));
  storeHandler.setStore(reduxStore);

  // eslint-disable-next-line no-console
  ['log', 'info', 'warn', 'error'].forEach((key) => (console[key] = consoleMock));
});

afterEach(async () => {
  cleanup();
  storeHandler.setStore(null);

  expect(consoleMock).toHaveBeenCalledTimes(0);
  // eslint-disable-next-line no-console
  ['log', 'info', 'warn', 'error'].forEach((key) => (console[key] = originalConsole[key]));
});

const getAccessResponse = (
  resource: AccessReviewResourceAttributes,
  allowed: boolean,
): SelfSubjectAccessReviewKind => {
  return {
    kind: 'SelfSubjectAccessReview',
    apiVersion: 'authorization.k8s.io/v1',
    metadata: {
      creationTimestamp: null,
    },
    spec: {
      resourceAttributes: resource,
    },
    status: {
      allowed,
    },
  };
};

describe('checkAccess', () => {
  it('should return true when API returns access granted', async () => {
    // Test and mock data
    const resource: AccessReviewResourceAttributes = {
      group: DeploymentModel.apiGroup,
      resource: DeploymentModel.plural,
      namespace: 'my-namespace',
      name: 'my-deployment-checkAccess-granted',
      verb: 'patch',
    };
    const response = getAccessResponse(resource, true);
    k8sCreateMock.mockReturnValueOnce(Promise.resolve(response));

    expect(await checkAccess(resource)).toEqual(response);

    // Assertions
    expect(k8sCreateMock).toHaveBeenCalledTimes(1);
    expect(k8sCreateMock).toHaveBeenCalledWith(SelfSubjectAccessReviewModel, {
      apiVersion: 'authorization.k8s.io/v1',
      kind: 'SelfSubjectAccessReview',
      spec: {
        resourceAttributes: {
          group: 'apps',
          resource: 'deployments',
          subresource: '',
          namespace: 'my-namespace',
          name: 'my-deployment-checkAccess-granted',
          verb: 'patch',
        },
      },
    });
  });

  it('should return false when API returns access denied', async () => {
    // Test and mock data
    const resource: AccessReviewResourceAttributes = {
      group: DeploymentModel.apiGroup,
      resource: DeploymentModel.plural,
      namespace: 'my-namespace',
      name: 'my-deployment-checkAccess-denied',
      verb: 'patch',
    };
    const response = getAccessResponse(resource, false);
    k8sCreateMock.mockReturnValueOnce(Promise.resolve(response));

    expect(await checkAccess(resource)).toEqual(response);

    // Assertions
    expect(k8sCreateMock).toHaveBeenCalledTimes(1);
    expect(k8sCreateMock).toHaveBeenCalledWith(SelfSubjectAccessReviewModel, {
      apiVersion: 'authorization.k8s.io/v1',
      kind: 'SelfSubjectAccessReview',
      spec: {
        resourceAttributes: {
          group: 'apps',
          resource: 'deployments',
          subresource: '',
          namespace: 'my-namespace',
          name: 'my-deployment-checkAccess-denied',
          verb: 'patch',
        },
      },
    });
  });

  it('should return false when API call fails', async () => {
    // Test and mock data
    const resource: AccessReviewResourceAttributes = {
      group: DeploymentModel.apiGroup,
      resource: DeploymentModel.plural,
      namespace: 'my-namespace',
      name: 'my-deployment-checkAccess-networkerror',
      verb: 'patch',
    };
    k8sCreateMock.mockReturnValueOnce(Promise.reject(new Error('Network error')));

    try {
      await checkAccess(resource);
      fail('Expect that checkAcces throws an error');
    } catch (error) {
      expect(error).toEqual(new Error('Network error'));
    }

    // Assertions
    expect(k8sCreateMock).toHaveBeenCalledTimes(1);
    expect(k8sCreateMock).toHaveBeenCalledWith(SelfSubjectAccessReviewModel, {
      apiVersion: 'authorization.k8s.io/v1',
      kind: 'SelfSubjectAccessReview',
      spec: {
        resourceAttributes: {
          group: 'apps',
          resource: 'deployments',
          subresource: '',
          namespace: 'my-namespace',
          name: 'my-deployment-checkAccess-networkerror',
          verb: 'patch',
        },
      },
    });
  });

  it('should check automatically set the namespace when checking a project access', async () => {
    // Test and mock data
    const resource: AccessReviewResourceAttributes = {
      group: ProjectModel.apiGroup,
      resource: ProjectModel.plural,
      name: 'my-project-checkAccess',
      verb: 'delete',
    };
    const response = getAccessResponse(resource, true);
    k8sCreateMock.mockReturnValueOnce(Promise.resolve(response));

    expect(await checkAccess(resource)).toEqual(response);

    // Assertions
    expect(k8sCreateMock).toHaveBeenCalledTimes(1);
    expect(k8sCreateMock).toHaveBeenCalledWith(SelfSubjectAccessReviewModel, {
      apiVersion: 'authorization.k8s.io/v1',
      kind: 'SelfSubjectAccessReview',
      spec: {
        resourceAttributes: {
          group: 'project.openshift.io',
          name: 'my-project-checkAccess',
          namespace: 'my-project-checkAccess',
          resource: 'projects',
          subresource: '',
          verb: 'delete',
        },
      },
    });
  });

  it('must not load permissions twice', async () => {
    // Test and mock data
    const resource: AccessReviewResourceAttributes = {
      group: DeploymentModel.apiGroup,
      resource: DeploymentModel.plural,
      namespace: 'my-namespace',
      name: 'my-deployment-checkAccess-fetchonce',
      verb: 'patch',
    };
    const response = getAccessResponse(resource, true);
    k8sCreateMock.mockReturnValueOnce(Promise.resolve(response));

    expect(await checkAccess(resource)).toEqual(response);
    expect(await checkAccess(resource)).toEqual(response);

    // Assertions
    expect(k8sCreateMock).toHaveBeenCalledTimes(1);
    expect(k8sCreateMock).toHaveBeenCalledWith(SelfSubjectAccessReviewModel, {
      apiVersion: 'authorization.k8s.io/v1',
      kind: 'SelfSubjectAccessReview',
      spec: {
        resourceAttributes: {
          group: 'apps',
          resource: 'deployments',
          subresource: '',
          namespace: 'my-namespace',
          name: 'my-deployment-checkAccess-fetchonce',
          verb: 'patch',
        },
      },
    });
  });
});

describe('useAccessReviewAllowed', () => {
  it('should return true when API returns access granted', async () => {
    // Test and mock data
    const resource: AccessReviewResourceAttributes = {
      group: DeploymentModel.apiGroup,
      resource: DeploymentModel.plural,
      namespace: 'my-namespace',
      name: 'my-deployment-useAccessReviewAllowed-granted',
      verb: 'patch',
    };
    const response = getAccessResponse(resource, true);
    k8sCreateMock.mockReturnValueOnce(Promise.resolve(response));

    // Run check
    const { result, rerender } = testHook(() => useAccessReviewAllowed(resource));
    expect(result.current).toBe(false);

    // Rerender to consume promise and update the hook result
    await act(async () => rerender());
    expect(result.current).toBe(true);

    // Assertions
    expect(k8sCreateMock).toHaveBeenCalledTimes(1);
    expect(k8sCreateMock).toHaveBeenCalledWith(SelfSubjectAccessReviewModel, {
      apiVersion: 'authorization.k8s.io/v1',
      kind: 'SelfSubjectAccessReview',
      spec: {
        resourceAttributes: {
          group: 'apps',
          resource: 'deployments',
          subresource: '',
          namespace: 'my-namespace',
          name: 'my-deployment-useAccessReviewAllowed-granted',
          verb: 'patch',
        },
      },
    });
  });

  it('should return false when API returns access denied', async () => {
    // Test and mock data
    const resource: AccessReviewResourceAttributes = {
      group: DeploymentModel.apiGroup,
      resource: DeploymentModel.plural,
      namespace: 'my-namespace',
      name: 'my-deployment-useAccessReviewAllowed-denied',
      verb: 'patch',
    };
    const response = getAccessResponse(resource, false);
    k8sCreateMock.mockReturnValueOnce(Promise.resolve(response));

    // Run check
    const { result, rerender } = testHook(() => useAccessReviewAllowed(resource));
    expect(result.current).toBe(false);

    // Rerender to consume promise and update the hook result
    await act(async () => rerender());
    expect(result.current).toBe(false);

    // Assertions
    expect(k8sCreateMock).toHaveBeenCalledTimes(1);
    expect(k8sCreateMock).toHaveBeenCalledWith(SelfSubjectAccessReviewModel, {
      apiVersion: 'authorization.k8s.io/v1',
      kind: 'SelfSubjectAccessReview',
      spec: {
        resourceAttributes: {
          group: 'apps',
          resource: 'deployments',
          subresource: '',
          namespace: 'my-namespace',
          name: 'my-deployment-useAccessReviewAllowed-denied',
          verb: 'patch',
        },
      },
    });
  });

  it('should return false when API call fails', async () => {
    // Test and mock data
    const resource: AccessReviewResourceAttributes = {
      group: DeploymentModel.apiGroup,
      resource: DeploymentModel.plural,
      namespace: 'my-namespace',
      name: 'my-deployment-useAccessReviewAllowed-networkerror',
      verb: 'patch',
    };
    k8sCreateMock.mockReturnValueOnce(Promise.reject(new Error('Network error')));

    // Run check
    const { result, rerender } = testHook(() => useAccessReviewAllowed(resource));
    expect(result.current).toBe(false);

    // Rerender to consume promise and update the hook result
    await act(async () => rerender());
    expect(result.current).toBe(true);

    // Assertions
    expect(k8sCreateMock).toHaveBeenCalledTimes(1);
    expect(k8sCreateMock).toHaveBeenCalledWith(SelfSubjectAccessReviewModel, {
      apiVersion: 'authorization.k8s.io/v1',
      kind: 'SelfSubjectAccessReview',
      spec: {
        resourceAttributes: {
          group: 'apps',
          resource: 'deployments',
          subresource: '',
          namespace: 'my-namespace',
          name: 'my-deployment-useAccessReviewAllowed-networkerror',
          verb: 'patch',
        },
      },
    });

    expect(consoleMock).toHaveBeenCalledTimes(1);
    expect(consoleMock).toHaveBeenLastCalledWith(
      'SelfSubjectAccessReview failed',
      new Error('Network error'),
    );
    consoleMock.mockClear();
  });

  it('should check automatically set the namespace when checking a project access', async () => {
    // Test and mock data
    const resource: AccessReviewResourceAttributes = {
      group: ProjectModel.apiGroup,
      resource: ProjectModel.plural,
      name: 'my-project-useAccessReviewAllowed',
      verb: 'delete',
    };
    const response = getAccessResponse(resource, true);
    k8sCreateMock.mockReturnValueOnce(Promise.resolve(response));

    // Run check
    const { result, rerender } = testHook(() => useAccessReviewAllowed(resource));
    expect(result.current).toBe(false);

    // Rerender to consume promise and update the hook result
    await act(async () => rerender());
    expect(result.current).toBe(true);

    // Assertions
    expect(k8sCreateMock).toHaveBeenCalledTimes(1);
    expect(k8sCreateMock).toHaveBeenCalledWith(SelfSubjectAccessReviewModel, {
      apiVersion: 'authorization.k8s.io/v1',
      kind: 'SelfSubjectAccessReview',
      spec: {
        resourceAttributes: {
          group: 'project.openshift.io',
          name: 'my-project-useAccessReviewAllowed',
          namespace: 'my-project-useAccessReviewAllowed',
          resource: 'projects',
          subresource: '',
          verb: 'delete',
        },
      },
    });
  });

  it('must not call the API when resource parameter is null', async () => {
    // Run check
    const { result } = testHook(() => useAccessReviewAllowed(null));
    expect(result.current).toEqual(true);

    // Assertions
    expect(k8sCreateMock).toHaveBeenCalledTimes(0);
  });

  it('must not load permissions twice', async () => {
    // Test and mock data
    const resource: AccessReviewResourceAttributes = {
      group: DeploymentModel.apiGroup,
      resource: DeploymentModel.plural,
      namespace: 'my-namespace',
      name: 'my-deployment-useAccessReviewAllowed-loadonce',
      verb: 'patch',
    };
    const response = getAccessResponse(resource, true);
    k8sCreateMock.mockReturnValueOnce(Promise.resolve(response));

    // Run check
    const { rerender } = testHook(() => {
      useAccessReviewAllowed(resource);
      useAccessReviewAllowed(resource);
    });

    // Rerender to consume promise and update the hook result
    await act(async () => rerender());

    // Assertions
    expect(k8sCreateMock).toHaveBeenCalledTimes(1);
    expect(k8sCreateMock).toHaveBeenCalledWith(SelfSubjectAccessReviewModel, {
      apiVersion: 'authorization.k8s.io/v1',
      kind: 'SelfSubjectAccessReview',
      spec: {
        resourceAttributes: {
          group: 'apps',
          resource: 'deployments',
          subresource: '',
          namespace: 'my-namespace',
          name: 'my-deployment-useAccessReviewAllowed-loadonce',
          verb: 'patch',
        },
      },
    });
  });

  it('should update the component just once after API call is finished', async () => {
    // Test and mock data
    const resource: AccessReviewResourceAttributes = {
      group: DeploymentModel.apiGroup,
      resource: DeploymentModel.plural,
      namespace: 'my-namespace',
      name: 'my-deployment-useAccessReviewAllowed-justonce',
      verb: 'patch',
    };
    const response = getAccessResponse(resource, true);
    k8sCreateMock.mockReturnValueOnce(Promise.resolve(response));

    // Test compontent
    const renderResult = jest.fn();
    const TestHook = () => {
      renderResult(useAccessReviewAllowed(resource));
      return null;
    };

    render(<TestHook />);
    // Consume the promise and update the hook result
    await act(async () => null);

    // Assertions
    expect(k8sCreateMock).toHaveBeenCalledTimes(1);
    expect(renderResult).toHaveBeenCalledTimes(2);
    expect(renderResult.mock.calls).toEqual([[false], [true]]);
  });

  it('should not update the component when API call result is cached', async () => {
    // Test and mock data
    const resource: AccessReviewResourceAttributes = {
      group: DeploymentModel.apiGroup,
      resource: DeploymentModel.plural,
      namespace: 'my-namespace',
      name: 'my-deployment-useAccessReviewAllowed-justonce',
      verb: 'patch',
    };
    const response = getAccessResponse(resource, true);
    k8sCreateMock.mockReturnValueOnce(Promise.resolve(response));

    // Test compontent
    const renderResult = jest.fn();
    const TestHook = () => {
      renderResult(useAccessReviewAllowed(resource));
      return null;
    };

    render(<TestHook />);
    // Consume the promise and update the hook result
    await act(async () => null);

    // Assertions
    expect(k8sCreateMock).toHaveBeenCalledTimes(0);
    expect(renderResult).toHaveBeenCalledTimes(1);
    expect(renderResult.mock.calls).toEqual([[true]]);
  });
});

describe('useAccessReview', () => {
  it('should return true when API returns access granted', async () => {
    // Test and mock data
    const resource: AccessReviewResourceAttributes = {
      group: DeploymentModel.apiGroup,
      resource: DeploymentModel.plural,
      namespace: 'my-namespace',
      name: 'my-deployment-useAccessReview-granted',
      verb: 'patch',
    };
    const response = getAccessResponse(resource, true);
    k8sCreateMock.mockReturnValueOnce(Promise.resolve(response));

    // Run check
    const { result, rerender } = testHook(() => useAccessReview(resource));
    expect(result.current).toEqual([false, true]);

    // Rerender to consume promise and update the hook result
    await act(async () => rerender());
    expect(result.current).toEqual([true, false]);

    // Assertions
    expect(k8sCreateMock).toHaveBeenCalledTimes(1);
    expect(k8sCreateMock).toHaveBeenCalledWith(SelfSubjectAccessReviewModel, {
      apiVersion: 'authorization.k8s.io/v1',
      kind: 'SelfSubjectAccessReview',
      spec: {
        resourceAttributes: {
          group: 'apps',
          resource: 'deployments',
          subresource: '',
          namespace: 'my-namespace',
          name: 'my-deployment-useAccessReview-granted',
          verb: 'patch',
        },
      },
    });
  });

  it('should return false when API returns access denied', async () => {
    // Test and mock data
    const resource: AccessReviewResourceAttributes = {
      group: DeploymentModel.apiGroup,
      resource: DeploymentModel.plural,
      namespace: 'my-namespace',
      name: 'my-deployment-useAccessReview-denied',
      verb: 'patch',
    };
    const response = getAccessResponse(resource, false);
    k8sCreateMock.mockReturnValueOnce(Promise.resolve(response));

    // Run check
    const { result, rerender } = testHook(() => useAccessReview(resource));
    expect(result.current).toEqual([false, true]);

    // Rerender to consume promise and update the hook result
    await act(async () => rerender());
    expect(result.current).toEqual([false, false]);

    // Assertions
    expect(k8sCreateMock).toHaveBeenCalledTimes(1);
    expect(k8sCreateMock).toHaveBeenCalledWith(SelfSubjectAccessReviewModel, {
      apiVersion: 'authorization.k8s.io/v1',
      kind: 'SelfSubjectAccessReview',
      spec: {
        resourceAttributes: {
          group: 'apps',
          resource: 'deployments',
          subresource: '',
          namespace: 'my-namespace',
          name: 'my-deployment-useAccessReview-denied',
          verb: 'patch',
        },
      },
    });
  });

  it('should return false when API call fails', async () => {
    // Test and mock data
    const resource: AccessReviewResourceAttributes = {
      group: DeploymentModel.apiGroup,
      resource: DeploymentModel.plural,
      namespace: 'my-namespace',
      name: 'my-deployment-useAccessReview-networkerror',
      verb: 'patch',
    };
    k8sCreateMock.mockReturnValueOnce(Promise.reject(new Error('Network error')));

    // Run check
    const { result, rerender } = testHook(() => useAccessReview(resource));
    expect(result.current).toEqual([false, true]);

    // Rerender to consume promise and update the hook result
    await act(async () => rerender());
    expect(result.current).toEqual([true, false]);

    // Assertions
    expect(k8sCreateMock).toHaveBeenCalledTimes(1);
    expect(k8sCreateMock).toHaveBeenCalledWith(SelfSubjectAccessReviewModel, {
      apiVersion: 'authorization.k8s.io/v1',
      kind: 'SelfSubjectAccessReview',
      spec: {
        resourceAttributes: {
          group: 'apps',
          resource: 'deployments',
          subresource: '',
          namespace: 'my-namespace',
          name: 'my-deployment-useAccessReview-networkerror',
          verb: 'patch',
        },
      },
    });

    expect(consoleMock).toHaveBeenCalledTimes(1);
    expect(consoleMock).toHaveBeenLastCalledWith(
      'SelfSubjectAccessReview failed',
      new Error('Network error'),
    );
    consoleMock.mockClear();
  });

  it('should check automatically set the namespace when checking a project access', async () => {
    // Test and mock data
    const resource: AccessReviewResourceAttributes = {
      group: ProjectModel.apiGroup,
      resource: ProjectModel.plural,
      name: 'my-project-useAccessReview',
      verb: 'delete',
    };
    const response = getAccessResponse(resource, true);
    k8sCreateMock.mockReturnValueOnce(Promise.resolve(response));

    // Run check
    const { result, rerender } = testHook(() => useAccessReview(resource));
    expect(result.current).toEqual([false, true]);

    // Rerender to consume promise and update the hook result
    await act(async () => rerender());
    expect(result.current).toEqual([true, false]);

    // Assertions
    expect(k8sCreateMock).toHaveBeenCalledTimes(1);
    expect(k8sCreateMock).toHaveBeenCalledWith(SelfSubjectAccessReviewModel, {
      apiVersion: 'authorization.k8s.io/v1',
      kind: 'SelfSubjectAccessReview',
      spec: {
        resourceAttributes: {
          group: 'project.openshift.io',
          name: 'my-project-useAccessReview',
          namespace: 'my-project-useAccessReview',
          resource: 'projects',
          subresource: '',
          verb: 'delete',
        },
      },
    });
  });

  it('must not call the API when resource parameter is null', async () => {
    // Run check
    const { result } = testHook(() => useAccessReview(null));
    expect(result.current).toEqual([true, false]);

    // Assertions
    expect(k8sCreateMock).toHaveBeenCalledTimes(0);
  });

  it('must not load permissions twice', async () => {
    // Test and mock data
    const resource: AccessReviewResourceAttributes = {
      group: DeploymentModel.apiGroup,
      resource: DeploymentModel.plural,
      namespace: 'my-namespace',
      name: 'my-deployment-useAccessReview-loadonce',
      verb: 'patch',
    };
    const response = getAccessResponse(resource, true);
    k8sCreateMock.mockReturnValueOnce(Promise.resolve(response));

    // Run check twice
    const { rerender } = testHook(() => {
      useAccessReview(resource);
      useAccessReview(resource);
    });

    // Rerender to consume promise and update the hook result
    await act(async () => rerender());

    // Assertions
    expect(k8sCreateMock).toHaveBeenCalledTimes(1);
    expect(k8sCreateMock).toHaveBeenCalledWith(SelfSubjectAccessReviewModel, {
      apiVersion: 'authorization.k8s.io/v1',
      kind: 'SelfSubjectAccessReview',
      spec: {
        resourceAttributes: {
          group: 'apps',
          resource: 'deployments',
          subresource: '',
          namespace: 'my-namespace',
          name: 'my-deployment-useAccessReview-loadonce',
          verb: 'patch',
        },
      },
    });
  });

  it('should update the component just once after API call is finished', async () => {
    // Test and mock data
    const resource: AccessReviewResourceAttributes = {
      group: DeploymentModel.apiGroup,
      resource: DeploymentModel.plural,
      namespace: 'my-namespace',
      name: 'my-deployment-useAccessReview-justonce',
      verb: 'patch',
    };
    const response = getAccessResponse(resource, true);
    k8sCreateMock.mockReturnValueOnce(Promise.resolve(response));

    // Test compontent
    const renderResult = jest.fn();
    const TestHook = () => {
      renderResult(useAccessReview(resource));
      return null;
    };

    render(<TestHook />);
    // Consume the promise and update the hook result
    await act(async () => null);

    // Assertions
    expect(k8sCreateMock).toHaveBeenCalledTimes(1);
    expect(renderResult).toHaveBeenCalledTimes(2);
    expect(renderResult.mock.calls).toEqual([[[false, true]], [[true, false]]]);
  });

  it('should not update the component when API call result is cached', async () => {
    // Test and mock data
    const resource: AccessReviewResourceAttributes = {
      group: DeploymentModel.apiGroup,
      resource: DeploymentModel.plural,
      namespace: 'my-namespace',
      name: 'my-deployment-useAccessReview-justonce',
      verb: 'patch',
    };
    const response = getAccessResponse(resource, true);
    k8sCreateMock.mockReturnValueOnce(Promise.resolve(response));

    // Test compontent
    const renderResult = jest.fn();
    const TestHook = () => {
      renderResult(useAccessReview(resource));
      return null;
    };

    render(<TestHook />);
    // Consume the promise and update the hook result
    await act(async () => null);

    // Assertions
    expect(k8sCreateMock).toHaveBeenCalledTimes(0);
    expect(renderResult).toHaveBeenCalledTimes(1);
    expect(renderResult.mock.calls).toEqual([[[true, false]]]);
  });
});
