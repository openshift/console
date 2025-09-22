import { useSelector, useDispatch } from 'react-redux';
import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import { testHook } from '@console/shared/src/test-utils/hooks-utils';
import { useUser } from '../useUser';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
  useDispatch: jest.fn(),
}));

jest.mock('@console/internal/components/utils/k8s-get-hook', () => ({
  useK8sGet: jest.fn(),
}));

jest.mock('@console/dynamic-plugin-sdk', () => ({
  ...jest.requireActual('@console/dynamic-plugin-sdk'),
  getUser: jest.fn(),
  getUserResource: jest.fn(),
  setUserResource: jest.fn(),
}));

const mockDispatch = jest.fn();
const mockUseSelector = useSelector as jest.Mock;
const mockUseK8sGet = useK8sGet as jest.Mock;
const mockUseDispatch = useDispatch as jest.Mock;

describe('useUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDispatch.mockReturnValue(mockDispatch);
  });

  it('should return user data with displayName from fullName when available', () => {
    const mockUser = { username: 'testuser@example.com', uid: '123' };
    const mockUserResource = { fullName: 'Test User', identities: ['testuser'] };

    mockUseSelector
      .mockReturnValueOnce(mockUser) // for getUser
      .mockReturnValueOnce(mockUserResource); // for getUserResource

    mockUseK8sGet.mockReturnValue([mockUserResource, true, null]);

    const { result } = testHook(() => useUser());

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.userResource).toEqual(mockUserResource);
    expect(result.current.username).toBe('testuser@example.com');
    expect(result.current.fullName).toBe('Test User');
    expect(result.current.displayName).toBe('Test User'); // Should prefer fullName
  });

  it('should fallback to username when fullName is not available', () => {
    const mockUser = { username: 'testuser@example.com', uid: '123' };
    const mockUserResource = { identities: ['testuser'] }; // No fullName

    mockUseSelector.mockReturnValueOnce(mockUser).mockReturnValueOnce(mockUserResource);

    mockUseK8sGet.mockReturnValue([mockUserResource, true, null]);

    const { result } = testHook(() => useUser());

    expect(result.current.displayName).toBe('testuser@example.com'); // Should fallback to username
    expect(result.current.fullName).toBeUndefined();
  });

  it('should dispatch setUserResource when user resource is loaded', () => {
    const mockUser = { username: 'testuser@example.com' };
    const mockUserResource = { fullName: 'Test User' };

    mockUseSelector.mockReturnValueOnce(mockUser).mockReturnValueOnce(null); // No userResource in Redux yet

    mockUseK8sGet.mockReturnValue([mockUserResource, true, null]);

    testHook(() => useUser());

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'setUserResource',
      payload: { userResource: mockUserResource },
    });
  });
});
