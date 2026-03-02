import { renderHook } from '@testing-library/react';
import { useSelector, useDispatch } from 'react-redux';
import type { K8sResourceKind } from '@console/dynamic-plugin-sdk/src';
import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import { useUser } from '../useUser';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
  useDispatch: jest.fn(),
}));

jest.mock('@console/internal/components/utils/k8s-get-hook', () => ({
  useK8sGet: jest.fn(),
}));

const baseUserResource: K8sResourceKind = {
  apiVersion: 'user.openshift.io/v1',
  kind: 'User',
};

const mockSetUserResource = jest.fn((userResource) => ({
  type: 'setUserResource',
  payload: { userResource },
}));

jest.mock('@console/dynamic-plugin-sdk', () => ({
  ...jest.requireActual('@console/dynamic-plugin-sdk'),
  getUser: jest.fn(),
  getUserResource: jest.fn(),
  setUserResource: (userResource: unknown) => mockSetUserResource(userResource),
}));

const dispatchMock = jest.fn();
const useSelectorMock = useSelector as jest.MockedFunction<typeof useSelector>;
const useDispatchMock = useDispatch as jest.MockedFunction<typeof useDispatch>;
const useK8sGetMock = useK8sGet as jest.MockedFunction<typeof useK8sGet>;

describe('useUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useDispatchMock.mockReturnValue(dispatchMock);
  });

  it('should return user data with displayName from fullName when available', () => {
    const mockUser = { username: 'testuser@example.com', uid: '123' };
    const mockUserResource = {
      ...baseUserResource,
      fullName: 'Test User',
      identities: ['testuser'],
    };

    useSelectorMock
      .mockReturnValueOnce(mockUser) // for getUser
      .mockReturnValueOnce(mockUserResource); // for getUserResource

    useK8sGetMock.mockReturnValue([mockUserResource, true, null]);

    const { result } = renderHook(() => useUser());

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.userResource).toEqual(mockUserResource);
    expect(result.current.username).toBe('testuser@example.com');
    expect(result.current.fullName).toBe('Test User');
    expect(result.current.displayName).toBe('Test User'); // Should prefer fullName
  });

  it('should fallback to username when fullName is not available', () => {
    const mockUser = { username: 'testuser@example.com', uid: '123' };
    const mockUserResource = { ...baseUserResource, identities: ['testuser'] }; // No fullName

    useSelectorMock.mockReturnValueOnce(mockUser).mockReturnValueOnce(mockUserResource);

    useK8sGetMock.mockReturnValue([mockUserResource, true, null]);

    const { result } = renderHook(() => useUser());

    expect(result.current.displayName).toBe('testuser@example.com'); // Should fallback to username
    expect(result.current.fullName).toBeUndefined();
  });

  it('should dispatch setUserResource when user resource is loaded', () => {
    const mockUser = { username: 'testuser@example.com' };
    const mockUserResource = { ...baseUserResource, fullName: 'Test User' };

    useSelectorMock.mockReturnValueOnce(mockUser).mockReturnValueOnce(null); // No userResource in Redux yet

    useK8sGetMock.mockReturnValue([mockUserResource, true, null]);

    renderHook(() => useUser());

    expect(dispatchMock).toHaveBeenCalledWith({
      type: 'setUserResource',
      payload: { userResource: mockUserResource },
    });
  });

  it('should handle edge cases with empty strings and fallback to "Unknown user"', () => {
    const mockUser = { username: '' }; // Empty username
    const mockUserResource = { ...baseUserResource, fullName: '   ' }; // Whitespace-only fullName

    useSelectorMock.mockReturnValueOnce(mockUser).mockReturnValueOnce(mockUserResource);

    useK8sGetMock.mockReturnValue([mockUserResource, true, null]);

    const { result } = renderHook(() => useUser());

    expect(result.current.displayName).toBe('Unknown user'); // Should fallback to translated "Unknown user"
  });

  it('should trim whitespace from fullName and username', () => {
    const mockUser = { username: '  testuser@example.com  ' };
    const mockUserResource = { ...baseUserResource, fullName: '  Test User  ' };

    useSelectorMock.mockReturnValueOnce(mockUser).mockReturnValueOnce(mockUserResource);

    useK8sGetMock.mockReturnValue([mockUserResource, true, null]);

    const { result } = renderHook(() => useUser());

    expect(result.current.displayName).toBe('Test User'); // Should be trimmed
  });
});
