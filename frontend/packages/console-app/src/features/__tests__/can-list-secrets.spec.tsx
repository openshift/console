import { act, renderHook, waitFor } from '@testing-library/react';
import { useLocation } from 'react-router';
import type { SelfSubjectAccessReviewKind } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { k8sCreateResource } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource';
import { ALL_NAMESPACES_KEY } from '@console/shared/src/constants/common';
import { useActiveNamespace } from '@console/shared/src/hooks/useActiveNamespace';
import { useConsoleSelector } from '@console/shared/src/hooks/useConsoleSelector';
import { FLAG_CAN_LIST_SECRETS } from '../../consts';
import { useCanListSecrets } from '../can-list-secrets';

jest.mock('react-router', () => ({ useLocation: jest.fn() }));
jest.mock('@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource', () => ({
  k8sCreateResource: jest.fn(),
}));
jest.mock('@console/shared/src/hooks/useActiveNamespace', () => ({
  useActiveNamespace: jest.fn(),
}));
jest.mock('@console/shared/src/hooks/useConsoleSelector', () => ({
  useConsoleSelector: jest.fn(),
}));

const create = jest.mocked(k8sCreateResource<SelfSubjectAccessReviewKind>);
const setFeatureFlag = jest.fn();
const review = (allowed: boolean): SelfSubjectAccessReviewKind => ({
  apiVersion: 'authorization.k8s.io/v1',
  kind: 'SelfSubjectAccessReview',
  spec: {},
  status: { allowed },
});
const setPath = (pathname: string) =>
  jest.mocked(useLocation).mockReturnValue({ pathname } as ReturnType<typeof useLocation>);

beforeEach(() => {
  jest.clearAllMocks();
  setPath('/k8s/cluster/projects/example');
  jest.mocked(useActiveNamespace).mockReturnValue(['other-project', jest.fn()]);
  jest.mocked(useConsoleSelector).mockReturnValue(undefined);
  create.mockResolvedValue(review(true));
});

it('checks the route project rather than the active namespace', async () => {
  renderHook(() => useCanListSecrets(setFeatureFlag));
  expect(create).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({
        spec: { resourceAttributes: { resource: 'secrets', verb: 'list', namespace: 'example' } },
      }),
    }),
  );
  await waitFor(() => expect(setFeatureFlag).toHaveBeenCalledWith(FLAG_CAN_LIST_SECRETS, true));
});

it('uses the active namespace when the route has no namespace', async () => {
  setPath('/dashboards');
  renderHook(() => useCanListSecrets(setFeatureFlag));
  expect(create).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({
        spec: {
          resourceAttributes: { resource: 'secrets', verb: 'list', namespace: 'other-project' },
        },
      }),
    }),
  );
  await waitFor(() => expect(setFeatureFlag).toHaveBeenCalledWith(FLAG_CAN_LIST_SECRETS, true));
});

it('hides the item when access is denied', async () => {
  create.mockResolvedValue(review(false));
  renderHook(() => useCanListSecrets(setFeatureFlag));
  await waitFor(() => expect(setFeatureFlag).toHaveBeenCalledWith(FLAG_CAN_LIST_SECRETS, false));
});

it('fails open without caching a failed review', async () => {
  create.mockRejectedValueOnce(new Error('temporary failure'));
  const { unmount } = renderHook(() => useCanListSecrets(setFeatureFlag));
  await waitFor(() => expect(setFeatureFlag).toHaveBeenCalledWith(FLAG_CAN_LIST_SECRETS, true));
  unmount();
  create.mockResolvedValue(review(false));
  renderHook(() => useCanListSecrets(setFeatureFlag));
  await waitFor(() =>
    expect(setFeatureFlag).toHaveBeenLastCalledWith(FLAG_CAN_LIST_SECRETS, false),
  );
  expect(create).toHaveBeenCalledTimes(2);
});

it('ignores responses from the previous project without clearing the flag during navigation', async () => {
  let resolvePrevious: (value: SelfSubjectAccessReviewKind) => void;
  create.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        resolvePrevious = resolve;
      }),
  );
  create.mockResolvedValue(review(false));
  const { rerender } = renderHook(() => useCanListSecrets(setFeatureFlag));
  expect(setFeatureFlag).not.toHaveBeenCalled();
  setPath('/k8s/cluster/projects/next-project');
  rerender();
  expect(setFeatureFlag).not.toHaveBeenCalled();
  await waitFor(() =>
    expect(setFeatureFlag).toHaveBeenLastCalledWith(FLAG_CAN_LIST_SECRETS, false),
  );
  await act(async () => resolvePrevious(review(true)));
  expect(setFeatureFlag).toHaveBeenCalledTimes(1);
});

it('refreshes the review when impersonation changes', async () => {
  const { rerender } = renderHook(() => useCanListSecrets(setFeatureFlag));
  await waitFor(() => expect(setFeatureFlag).toHaveBeenCalledWith(FLAG_CAN_LIST_SECRETS, true));
  jest.mocked(useConsoleSelector).mockReturnValue({ kind: 'User', name: 'restricted-user' });
  create.mockResolvedValue(review(false));
  rerender();
  await waitFor(() =>
    expect(setFeatureFlag).toHaveBeenLastCalledWith(FLAG_CAN_LIST_SECRETS, false),
  );
  expect(create).toHaveBeenCalledTimes(2);
});

it.each([undefined, ALL_NAMESPACES_KEY])(
  'skips reviews without a single namespace (%s)',
  (namespace) => {
    setPath('/dashboards');
    jest.mocked(useActiveNamespace).mockReturnValue([namespace, jest.fn()]);
    renderHook(() => useCanListSecrets(setFeatureFlag));
    expect(create).not.toHaveBeenCalled();
    expect(setFeatureFlag).toHaveBeenCalledWith(FLAG_CAN_LIST_SECRETS, false);
  },
);
