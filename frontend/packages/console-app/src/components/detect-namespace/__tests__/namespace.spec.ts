import * as React from 'react';
import { act } from 'react-dom/test-utils';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { k8sGet } from '@console/internal/module/k8s';
import { ALL_NAMESPACES_KEY } from '@console/shared/src/constants';
import { useFlag } from '@console/shared/src/hooks/flag';
import { testHook } from '../../../../../../__tests__/utils/hooks-utils';
import { usePreferredNamespace } from '../../user-preferences/namespace';
import { useValuesForNamespaceContext } from '../namespace';
import { useLastNamespace } from '../useLastNamespace';

jest.mock('react-redux', () => ({
  ...require.requireActual('react-redux'),
  useDispatch: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...require.requireActual('react-router-dom'),
  useLocation: jest.fn(),
}));

jest.mock('@console/shared/src/hooks/flag', () => ({
  useFlag: jest.fn(),
}));

jest.mock('@console/internal/module/k8s/resource', () => ({
  k8sGet: jest.fn(),
}));

jest.mock('../useLastNamespace', () => ({
  useLastNamespace: jest.fn(),
}));

jest.mock('../../user-preferences/namespace/usePreferredNamespace', () => ({
  usePreferredNamespace: jest.fn(),
}));

const useDispatchMock = useDispatch as jest.Mock;
const useFlagMock = useFlag as jest.Mock;
const useLocationMock = useLocation as jest.Mock;
const useLastNamespaceMock = useLastNamespace as jest.Mock;
const usePreferredNamespaceMock = usePreferredNamespace as jest.Mock;
const k8sGetMock = k8sGet as jest.Mock;

const activeNamespace = 'active-ns';
const urlNamespace: string = 'url-ns';
const getLocationData = (valid = true) => ({
  pathname: valid ? `home/ns/${urlNamespace}` : 'home/invalid',
});
const lastNamespace: string = 'last-ns';
const preferredNamespace: string = 'preferred-ns';

describe('useValuesForNamespaceContext', () => {
  beforeEach(() => {
    useDispatchMock.mockReturnValue(jest.fn);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should return urlNamespace if it is defined', async () => {
    useFlagMock.mockReturnValue(true);
    k8sGetMock.mockReturnValue(Promise.resolve({}));
    useLocationMock.mockReturnValue(getLocationData());
    usePreferredNamespaceMock.mockReturnValue([preferredNamespace, jest.fn(), true]);
    useLastNamespaceMock.mockReturnValue([lastNamespace, jest.fn(), true]);

    const { result, rerender } = testHook(() => useValuesForNamespaceContext());
    await act(async () => {
      rerender();
    });
    const { namespace, loaded } = result.current;

    expect(namespace).toEqual(urlNamespace);
    expect(loaded).toBeTruthy();
  });

  it('should return activeNamespace if it it already defined', async () => {
    useFlagMock.mockReturnValue(true);
    k8sGetMock.mockReturnValue(Promise.resolve({}));
    useLocationMock.mockReturnValue(getLocationData(false));
    spyOn(React, 'useState').and.returnValue([activeNamespace, jest.fn()]);
    usePreferredNamespaceMock.mockReturnValue([preferredNamespace, jest.fn(), true]);
    useLastNamespaceMock.mockReturnValue([lastNamespace, jest.fn(), true]);

    const { result, rerender } = testHook(() => useValuesForNamespaceContext());
    await act(async () => {
      rerender();
    });
    const { namespace, loaded } = result.current;

    expect(namespace).toEqual(activeNamespace);
    expect(loaded).toBeTruthy();
  });

  it('should return preferredNamespace if it exists', async () => {
    useFlagMock.mockReturnValue(true);
    k8sGetMock.mockReturnValue(Promise.resolve({}));
    useLocationMock.mockReturnValue(getLocationData(false));
    usePreferredNamespaceMock.mockReturnValue([preferredNamespace, jest.fn(), true]);
    useLastNamespaceMock.mockReturnValue([lastNamespace, jest.fn(), true]);

    const { result, rerender } = testHook(() => useValuesForNamespaceContext());
    await act(async () => {
      rerender();
    });
    const { namespace, loaded } = result.current;

    expect(namespace).toEqual(preferredNamespace);
    expect(loaded).toBeTruthy();
  });

  it('should return lastNamespace if it exists and preferredNamespace do not exist', async () => {
    useFlagMock.mockReturnValue(true);
    k8sGetMock.mockReturnValue(Promise.resolve({}));
    useLocationMock.mockReturnValue(getLocationData(false));
    usePreferredNamespaceMock.mockReturnValue([undefined, jest.fn(), true]);
    useLastNamespaceMock.mockReturnValue([lastNamespace, jest.fn(), true]);

    const { result, rerender } = testHook(() => useValuesForNamespaceContext());
    await act(async () => {
      rerender();
    });
    const { namespace, loaded } = result.current;

    expect(namespace).toEqual(lastNamespace);
    expect(loaded).toBeTruthy();
  });

  it('should return ALL_NAMESPACES_KEY if urlNamespacel, preferredNamespace, lastNamespace are not defined', async () => {
    useFlagMock.mockReturnValue(true);
    k8sGetMock.mockReturnValue(Promise.resolve({}));
    useLocationMock.mockReturnValue(getLocationData(false));
    usePreferredNamespaceMock.mockReturnValue([undefined, jest.fn(), true]);
    useLastNamespaceMock.mockReturnValue([undefined, jest.fn(), true]);

    const { result, rerender } = testHook(() => useValuesForNamespaceContext());
    await act(async () => {
      rerender();
    });

    const { namespace, loaded } = result.current;
    expect(namespace).toEqual(ALL_NAMESPACES_KEY);
    expect(loaded).toBeTruthy();
  });

  it('should return true for loaded if urlNamespace has loaded irrespective of loaded status for other resources', async () => {
    useFlagMock.mockReturnValue(undefined);
    k8sGetMock.mockReturnValue(Promise.resolve({}));
    useLocationMock.mockReturnValue(getLocationData(true));
    usePreferredNamespaceMock.mockReturnValue([preferredNamespace, jest.fn(), false]);
    useLastNamespaceMock.mockReturnValue([lastNamespace, jest.fn(), false]);

    const { result, rerender } = testHook(() => useValuesForNamespaceContext());
    await act(async () => {
      rerender();
    });
    const { namespace, loaded } = result.current;

    expect(namespace).toEqual(urlNamespace);
    expect(loaded).toBeTruthy();
  });

  it('should return true for loaded if urlNamespace is not defined and preferredNamespace and lastNamespace are loaded, and flags are not pending anymore', async () => {
    useFlagMock.mockReturnValue(true);
    k8sGetMock.mockReturnValue(Promise.resolve({}));
    useLocationMock.mockReturnValue(getLocationData(false));
    usePreferredNamespaceMock.mockReturnValue([preferredNamespace, jest.fn(), true]);
    useLastNamespaceMock.mockReturnValue([lastNamespace, jest.fn(), true]);

    const { result, rerender } = testHook(() => useValuesForNamespaceContext());
    await act(async () => {
      rerender();
    });
    const { namespace, loaded } = result.current;

    expect(namespace).toEqual(preferredNamespace);
    expect(loaded).toBeTruthy();
  });

  it('should return false for loaded if urlNamespace is undefined and no resources is loaded yet', async () => {
    useFlagMock.mockReturnValue(true);
    k8sGetMock.mockReturnValue(Promise.resolve({}));
    useLocationMock.mockReturnValue(getLocationData(false));
    usePreferredNamespaceMock.mockReturnValue([undefined, jest.fn(), false]);
    useLastNamespaceMock.mockReturnValue([lastNamespace, jest.fn(), false]);

    const { result, rerender } = testHook(() => useValuesForNamespaceContext());
    await act(async () => {
      rerender();
    });
    const { namespace, loaded } = result.current;

    expect(namespace).toBeFalsy();
    expect(loaded).toBeFalsy();
  });

  it('should return false for loaded if urlNamespace is undefined and flags are pending', async () => {
    useFlagMock.mockReturnValue(undefined);
    k8sGetMock.mockReturnValue(Promise.resolve({}));
    useLocationMock.mockReturnValue(getLocationData(false));
    usePreferredNamespaceMock.mockReturnValue([undefined, jest.fn(), true]);
    useLastNamespaceMock.mockReturnValue([lastNamespace, jest.fn(), true]);

    const { result, rerender } = testHook(() => useValuesForNamespaceContext());
    await act(async () => {
      rerender();
    });
    const { namespace, loaded } = result.current;

    expect(namespace).toBeFalsy();
    expect(loaded).toBeFalsy();
  });
});
