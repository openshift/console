import { useState } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useLocation, useNavigate } from 'react-router';
import { k8sGet } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import {
  ALL_NAMESPACES_KEY,
  LAST_NAMESPACE_NAME_LOCAL_STORAGE_KEY,
} from '@console/shared/src/constants/common';
import { useConsoleDispatch } from '@console/shared/src/hooks/useConsoleDispatch';
import { useFlag } from '@console/shared/src/hooks/useFlag';
import { usePreferredNamespace } from '../../../components/user-preferences/namespace/usePreferredNamespace';
import { useValuesForNamespaceContext } from '../namespace';
import { useLastNamespace } from '../useLastNamespace';

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useState: jest.fn(),
}));

jest.mock('@console/shared/src/hooks/useConsoleDispatch', () => ({
  useConsoleDispatch: jest.fn(),
}));

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useLocation: jest.fn(),
  useNavigate: jest.fn(),
}));

jest.mock('@console/shared/src/hooks/useFlag', () => ({
  useFlag: jest.fn<boolean, []>(),
}));

jest.mock('@console/dynamic-plugin-sdk/src/utils/k8s', () => ({
  k8sGet: jest.fn(),
}));

jest.mock('../useLastNamespace', () => ({
  useLastNamespace: jest.fn(),
}));

jest.mock('../../../components/user-preferences/namespace/usePreferredNamespace', () => ({
  usePreferredNamespace: jest.fn(),
}));

const useDispatchMock = useConsoleDispatch as jest.Mock;
const useFlagMock = useFlag as jest.Mock;
const useLocationMock = useLocation as jest.Mock;
const useNavigateMock = useNavigate as jest.Mock;
const useLastNamespaceMock = useLastNamespace as jest.Mock;
const usePreferredNamespaceMock = usePreferredNamespace as jest.Mock;
const k8sGetMock = k8sGet as jest.Mock;
const useStateMock = useState as jest.Mock;

const activeNamespace = 'active-ns';
const urlNamespace: string = 'url-ns';
const getLocationData = (valid = true) => ({
  pathname: valid ? `home/ns/${urlNamespace}` : 'home/invalid',
});
const lastNamespace: string = 'last-ns';
const preferredNamespace: string = 'preferred-ns';

describe('useValuesForNamespaceContext', () => {
  beforeEach(() => {
    useStateMock.mockImplementation(jest.requireActual('react').useState);
    useDispatchMock.mockReturnValue(jest.fn);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    sessionStorage.clear();
  });

  it('should return urlNamespace if it is defined', async () => {
    useFlagMock.mockReturnValue(true);
    k8sGetMock.mockReturnValue(Promise.resolve({}));
    useLocationMock.mockReturnValue(getLocationData());
    usePreferredNamespaceMock.mockReturnValue([preferredNamespace, jest.fn(), true]);
    useLastNamespaceMock.mockReturnValue([lastNamespace, jest.fn(), true]);

    const { result } = renderHook(() => useValuesForNamespaceContext());

    await waitFor(() => {
      expect(result.current.namespace).toEqual(urlNamespace);
    });
    expect(result.current.loaded).toBeTruthy();
  });

  it('should return activeNamespace if it it already defined', async () => {
    useFlagMock.mockReturnValue(true);
    k8sGetMock.mockReturnValue(Promise.resolve({}));
    useLocationMock.mockReturnValue(getLocationData(false));
    useStateMock.mockReturnValue([activeNamespace, jest.fn()]);
    usePreferredNamespaceMock.mockReturnValue([preferredNamespace, jest.fn(), true]);
    useLastNamespaceMock.mockReturnValue([lastNamespace, jest.fn(), true]);

    const { result } = renderHook(() => useValuesForNamespaceContext());

    await waitFor(() => {
      expect(result.current.namespace).toEqual(activeNamespace);
    });
    expect(result.current.loaded).toBeTruthy();
  });

  it('should return preferredNamespace if it exists', async () => {
    useFlagMock.mockReturnValue(true);
    k8sGetMock.mockReturnValue(Promise.resolve({}));
    useLocationMock.mockReturnValue(getLocationData(false));
    usePreferredNamespaceMock.mockReturnValue([preferredNamespace, jest.fn(), true]);
    useLastNamespaceMock.mockReturnValue([lastNamespace, jest.fn(), true]);

    const { result } = renderHook(() => useValuesForNamespaceContext());

    await waitFor(() => {
      expect(result.current.namespace).toEqual(preferredNamespace);
    });
    expect(result.current.loaded).toBeTruthy();
  });

  it('should return lastNamespace if it exists and preferredNamespace do not exist', async () => {
    useFlagMock.mockReturnValue(true);
    k8sGetMock.mockReturnValue(Promise.resolve({}));
    useLocationMock.mockReturnValue(getLocationData(false));
    usePreferredNamespaceMock.mockReturnValue([undefined, jest.fn(), true]);
    useLastNamespaceMock.mockReturnValue([lastNamespace, jest.fn(), true]);

    const { result } = renderHook(() => useValuesForNamespaceContext());

    await waitFor(() => {
      expect(result.current.namespace).toEqual(lastNamespace);
    });
    expect(result.current.loaded).toBeTruthy();
  });

  it('should return ALL_NAMESPACES_KEY if urlNamespacel, preferredNamespace, lastNamespace are not defined', async () => {
    useFlagMock.mockReturnValue(true);
    k8sGetMock.mockReturnValue(Promise.resolve({}));
    useLocationMock.mockReturnValue(getLocationData(false));
    usePreferredNamespaceMock.mockReturnValue([undefined, jest.fn(), true]);
    useLastNamespaceMock.mockReturnValue([undefined, jest.fn(), true]);

    const { result } = renderHook(() => useValuesForNamespaceContext());

    await waitFor(() => {
      expect(result.current.namespace).toEqual(ALL_NAMESPACES_KEY);
    });
    expect(result.current.loaded).toBeTruthy();
  });

  it('should return true for loaded if urlNamespace has loaded irrespective of loaded status for other resources', async () => {
    useFlagMock.mockReturnValue(undefined);
    k8sGetMock.mockReturnValue(Promise.resolve({}));
    useLocationMock.mockReturnValue(getLocationData(true));
    usePreferredNamespaceMock.mockReturnValue([preferredNamespace, jest.fn(), false]);
    useLastNamespaceMock.mockReturnValue([lastNamespace, jest.fn(), false]);

    const { result } = renderHook(() => useValuesForNamespaceContext());

    await waitFor(() => {
      expect(result.current.namespace).toEqual(urlNamespace);
    });
    expect(result.current.loaded).toBeTruthy();
  });

  it('should return true for loaded if urlNamespace is not defined and preferredNamespace and lastNamespace are loaded, and flags are not pending anymore', async () => {
    useFlagMock.mockReturnValue(true);
    k8sGetMock.mockReturnValue(Promise.resolve({}));
    useLocationMock.mockReturnValue(getLocationData(false));
    usePreferredNamespaceMock.mockReturnValue([preferredNamespace, jest.fn(), true]);
    useLastNamespaceMock.mockReturnValue([lastNamespace, jest.fn(), true]);

    const { result } = renderHook(() => useValuesForNamespaceContext());

    await waitFor(() => {
      expect(result.current.namespace).toEqual(preferredNamespace);
    });
    expect(result.current.loaded).toBeTruthy();
  });

  it('should return false for loaded if urlNamespace is undefined and no resources is loaded yet', async () => {
    useFlagMock.mockReturnValue(true);
    k8sGetMock.mockReturnValue(Promise.resolve({}));
    useLocationMock.mockReturnValue(getLocationData(false));
    usePreferredNamespaceMock.mockReturnValue([undefined, jest.fn(), false]);
    useLastNamespaceMock.mockReturnValue([lastNamespace, jest.fn(), false]);

    const { result } = renderHook(() => useValuesForNamespaceContext());

    await waitFor(() => {
      expect(result.current.namespace).toBeFalsy();
    });
    expect(result.current.loaded).toBeFalsy();
  });

  it('should return false for loaded if urlNamespace is undefined and flags are pending', async () => {
    useFlagMock.mockReturnValue(undefined);
    k8sGetMock.mockReturnValue(Promise.resolve({}));
    useLocationMock.mockReturnValue(getLocationData(false));
    usePreferredNamespaceMock.mockReturnValue([undefined, jest.fn(), true]);
    useLastNamespaceMock.mockReturnValue([lastNamespace, jest.fn(), true]);

    const { result } = renderHook(() => useValuesForNamespaceContext());

    await waitFor(() => {
      expect(result.current.namespace).toBeFalsy();
    });
    expect(result.current.loaded).toBeFalsy();
  });

  it('writes the last-namespace session storage entry before publishing when transitioning from ALL_NAMESPACES_KEY to a named namespace', () => {
    const namedNamespace = 'my-ns';

    // Capture what session storage holds at the exact moment the new active
    // namespace is published (setActiveNamespace). NavItemResource reads this
    // value synchronously during the render that publish triggers, so it must
    // already be up to date; writing it only afterwards (e.g. in an effect)
    // would leave the nav one render behind. See getLastNamespace usage.
    let storageAtPublish: string | null = null;
    const setActiveNamespaceSpy = jest.fn(() => {
      storageAtPublish = sessionStorage.getItem(LAST_NAMESPACE_NAME_LOCAL_STORAGE_KEY);
    });

    useFlagMock.mockReturnValue(true);
    k8sGetMock.mockReturnValue(Promise.resolve({}));
    useLocationMock.mockReturnValue(getLocationData());
    usePreferredNamespaceMock.mockReturnValue([undefined, jest.fn(), true]);
    useLastNamespaceMock.mockReturnValue([undefined, jest.fn(), true]);
    useNavigateMock.mockReturnValue(jest.fn());
    // Keep the published active namespace pinned so the transition guard always
    // sees the previous (ALL_NAMESPACES_KEY) value as current.
    useStateMock.mockReturnValue([ALL_NAMESPACES_KEY, setActiveNamespaceSpy]);

    const { result } = renderHook(() => useValuesForNamespaceContext());

    // Ignore any writes from mount-time effects; only the explicit transition matters.
    setActiveNamespaceSpy.mockClear();
    storageAtPublish = null;
    sessionStorage.setItem(LAST_NAMESPACE_NAME_LOCAL_STORAGE_KEY, ALL_NAMESPACES_KEY);

    act(() => {
      result.current.setNamespace(namedNamespace);
    });

    expect(setActiveNamespaceSpy).toHaveBeenCalledWith(namedNamespace);
    expect(storageAtPublish).toEqual(namedNamespace);
    expect(sessionStorage.getItem(LAST_NAMESPACE_NAME_LOCAL_STORAGE_KEY)).toEqual(namedNamespace);
  });
});
