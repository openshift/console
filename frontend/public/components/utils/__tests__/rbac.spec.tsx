import * as React from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { applyMiddleware, combineReducers, createStore } from 'redux';
import thunk from 'redux-thunk';
import { SDKReducers } from '@console/dynamic-plugin-sdk/src/app/redux';
import { k8sCreate } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource';
import storeHandler from '@console/dynamic-plugin-sdk/src/app/storeHandler';
import {
  AccessReviewResourceAttributes,
  SelfSubjectAccessReviewKind,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { testHook } from '../../../../__tests__/utils/hooks-utils';
import { DeploymentModel } from '../../../models';
import { useMultipleAccessReviews } from '../rbac';

const k8sCreateMock = k8sCreate as jest.Mock;

jest.mock('@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource', () => ({
  ...require.requireActual('@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource'),
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

describe('useMultipleAccessReviews', () => {
  it('should return the correct allowed/denied values', async () => {
    // Test and mock data
    const resources: AccessReviewResourceAttributes[] = [
      {
        group: DeploymentModel.apiGroup,
        resource: DeploymentModel.plural,
        namespace: 'my-namespace',
        name: 'my-deployment-useMultipleAccessReviews-granted',
        verb: 'patch',
      },
      {
        group: DeploymentModel.apiGroup,
        resource: DeploymentModel.plural,
        namespace: 'my-namespace',
        name: 'my-deployment-useMultipleAccessReviews-denied',
        verb: 'patch',
      },
    ];
    k8sCreateMock.mockReturnValueOnce(Promise.resolve(getAccessResponse(resources[0], true)));
    k8sCreateMock.mockReturnValueOnce(Promise.resolve(getAccessResponse(resources[1], false)));

    // Run check
    const { result, rerender } = testHook(() => useMultipleAccessReviews(resources));
    expect(result.current).toEqual([[], true]);

    // Rerender to consume promise and update the hook result
    await act(async () => rerender());
    expect(result.current).toEqual([
      [
        {
          allowed: true,
          resourceAttributes: {
            group: 'apps',
            name: 'my-deployment-useMultipleAccessReviews-granted',
            namespace: 'my-namespace',
            resource: 'deployments',
            verb: 'patch',
          },
        },
        {
          allowed: false,
          resourceAttributes: {
            group: 'apps',
            name: 'my-deployment-useMultipleAccessReviews-denied',
            namespace: 'my-namespace',
            resource: 'deployments',
            verb: 'patch',
          },
        },
      ],
      false,
    ]);

    // Assertions
    expect(k8sCreateMock).toHaveBeenCalledTimes(2);
  });

  it('should return false if one api call fails', async () => {
    // Test and mock data
    const resources: AccessReviewResourceAttributes[] = [
      {
        group: DeploymentModel.apiGroup,
        resource: DeploymentModel.plural,
        namespace: 'my-namespace',
        name: 'my-deployment-useMultipleAccessReviews-onefailed-granted',
        verb: 'patch',
      },
      {
        group: DeploymentModel.apiGroup,
        resource: DeploymentModel.plural,
        namespace: 'my-namespace',
        name: 'my-deployment-useMultipleAccessReviews-onefailed-denied',
        verb: 'patch',
      },
      {
        group: DeploymentModel.apiGroup,
        resource: DeploymentModel.plural,
        namespace: 'my-namespace',
        name: 'my-deployment-useMultipleAccessReviews-onefailed-failed',
        verb: 'patch',
      },
    ];
    k8sCreateMock.mockReturnValueOnce(Promise.resolve(getAccessResponse(resources[0], true)));
    k8sCreateMock.mockReturnValueOnce(Promise.resolve(getAccessResponse(resources[1], false)));
    k8sCreateMock.mockReturnValueOnce(Promise.reject(new Error('Network error')));

    // Run check
    const { result, rerender } = testHook(() => useMultipleAccessReviews(resources));
    expect(result.current).toEqual([[], true]);

    // Rerender to consume promise and update the hook result
    await act(async () => rerender());
    expect(result.current).toEqual([[], false]);

    // Assertions
    expect(k8sCreateMock).toHaveBeenCalledTimes(3);

    expect(consoleMock).toHaveBeenCalledTimes(1);
    expect(consoleMock).toHaveBeenLastCalledWith(
      'SelfSubjectAccessReview failed',
      new Error('Network error'),
    );
    consoleMock.mockClear();
  });

  it('must not call the API when resource parameter is empty', async () => {
    // Test and mock data
    const resources: AccessReviewResourceAttributes[] = [];

    // Run check and assert that loading is true
    const { result, rerender } = testHook(() => useMultipleAccessReviews(resources));
    expect(result.current).toEqual([[], true]);

    // Rerender to consume Promise.all
    await act(async () => rerender());

    // Assert that loading is false
    expect(result.current).toEqual([[], false]);
    expect(k8sCreateMock).toHaveBeenCalledTimes(0);
  });

  it('must not load same permission twice', async () => {
    // Test and mock data
    const resources: AccessReviewResourceAttributes[] = [
      {
        group: DeploymentModel.apiGroup,
        resource: DeploymentModel.plural,
        namespace: 'my-namespace',
        name: 'my-deployment-useMultipleAccessReviews-twice',
        verb: 'patch',
      },
      {
        group: DeploymentModel.apiGroup,
        resource: DeploymentModel.plural,
        namespace: 'my-namespace',
        name: 'my-deployment-useMultipleAccessReviews-twice',
        verb: 'patch',
      },
    ];
    k8sCreateMock.mockReturnValueOnce(Promise.resolve(getAccessResponse(resources[0], true)));

    // Run check
    const { rerender } = testHook(() => {
      useMultipleAccessReviews(resources);
      useMultipleAccessReviews(resources);
    });

    // Rerender to consume promise and update the hook result
    await act(async () => rerender());

    // Assertions
    expect(k8sCreateMock).toHaveBeenCalledTimes(1);
  });

  it('should update the component just once after API call is finished', async () => {
    // Test and mock data
    const resources: AccessReviewResourceAttributes[] = [
      {
        group: DeploymentModel.apiGroup,
        resource: DeploymentModel.plural,
        namespace: 'my-namespace',
        name: 'my-deployment-useMultipleAccessReviews-justonce',
        verb: 'patch',
      },
    ];
    const response = getAccessResponse(resources[0], true);
    k8sCreateMock.mockReturnValueOnce(Promise.resolve(response));

    // Test compontent
    const renderResult = jest.fn();
    const TestHook = () => {
      renderResult(useMultipleAccessReviews(resources));
      return null;
    };

    render(<TestHook />);
    // Consume the promise and update the hook result
    await act(async () => null);

    // Assertions
    expect(k8sCreateMock).toHaveBeenCalledTimes(1);
    expect(renderResult).toHaveBeenCalledTimes(2);
    expect(renderResult.mock.calls).toEqual([
      [[[], true]],
      [
        [
          [
            {
              allowed: true,
              resourceAttributes: {
                group: 'apps',
                name: 'my-deployment-useMultipleAccessReviews-justonce',
                namespace: 'my-namespace',
                resource: 'deployments',
                verb: 'patch',
              },
            },
          ],
          false,
        ],
      ],
    ]);
  });

  it('should not update the component when API call result is cached', async () => {
    // Test and mock data
    const resources: AccessReviewResourceAttributes[] = [
      {
        group: DeploymentModel.apiGroup,
        resource: DeploymentModel.plural,
        namespace: 'my-namespace',
        name: 'my-deployment-useMultipleAccessReviews-justonce',
        verb: 'patch',
      },
    ];
    const response = getAccessResponse(resources[0], true);
    k8sCreateMock.mockReturnValueOnce(Promise.resolve(response));

    // Test compontent
    const renderResult = jest.fn();
    const TestHook = () => {
      renderResult(useMultipleAccessReviews(resources));
      return null;
    };

    render(<TestHook />);
    // Consume the promise and update the hook result
    await act(async () => null);

    // Assertions
    expect(k8sCreateMock).toHaveBeenCalledTimes(0);
    // In theorie this could be one, but useMultipleAccessReviews doesn't use resultCache yet.
    expect(renderResult).toHaveBeenCalledTimes(2);
    expect(renderResult.mock.calls).toEqual([
      [[[], true]],
      [
        [
          [
            {
              allowed: true,
              resourceAttributes: {
                group: 'apps',
                name: 'my-deployment-useMultipleAccessReviews-justonce',
                namespace: 'my-namespace',
                resource: 'deployments',
                verb: 'patch',
              },
            },
          ],
          false,
        ],
      ],
    ]);
  });
});
