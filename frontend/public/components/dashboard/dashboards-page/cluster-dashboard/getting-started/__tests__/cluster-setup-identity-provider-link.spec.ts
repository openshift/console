import { useAccessReview } from '@console/internal/components/utils/rbac';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { OAuthKind } from '@console/internal/module/k8s';

import { testHook } from '../../../../../../../__tests__/utils/hooks-utils';

import { useIdentityProviderLink } from '../cluster-setup-identity-provider-link';

jest.mock('react-i18next', () => ({
  ...require.requireActual('react-i18next'),
  useTranslation: () => ({ t: (key) => key.split('~')[1] }),
}));

jest.mock('@console/internal/components/utils/rbac', () => ({
  useAccessReview: jest.fn(),
}));

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResource: jest.fn(),
}));

const useAccessReviewMock = useAccessReview as jest.Mock;
const useK8sWatchResourceMock = useK8sWatchResource as jest.Mock;

describe('useIdentityProviderLink', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should not watch resource if it can not edit it', () => {
    useAccessReviewMock.mockReturnValue(false);
    useK8sWatchResourceMock.mockReturnValue([undefined, true, undefined]);

    const { result } = testHook(() => useIdentityProviderLink());

    expect(result.current).toBe(null);
    expect(useK8sWatchResourceMock).toHaveBeenCalledTimes(1);
    expect(useK8sWatchResourceMock).toHaveBeenCalledWith(null);
  });

  it('should watch resource if it can edit it, return null until it is loaded', () => {
    useAccessReviewMock.mockReturnValue(true);
    useK8sWatchResourceMock.mockReturnValue([undefined, false, undefined]);

    const { result } = testHook(() => useIdentityProviderLink());

    expect(result.current).toBe(null);
    expect(useK8sWatchResourceMock).toHaveBeenCalledTimes(1);
    expect(useK8sWatchResourceMock).toHaveBeenCalledWith({
      kind: 'config.openshift.io~v1~OAuth',
      isList: false,
      namespaced: false,
      name: 'cluster',
    });
  });

  it('should return link when there is no identity provider configured', () => {
    const oauthData: OAuthKind = {
      spec: {
        identityProviders: [],
      },
    };
    useAccessReviewMock.mockReturnValue(true);
    useK8sWatchResourceMock.mockReturnValue([oauthData, true, null]);

    const { result } = testHook(() => useIdentityProviderLink());

    expect(result.current).toEqual({
      id: 'identity-providers',
      title: 'Add identity providers',
      href: '/k8s/cluster/config.openshift.io~v1~OAuth/cluster',
    });
  });

  it('should return no link when there is at least one identity provider configured', () => {
    const oauthData: OAuthKind = {
      spec: {
        identityProviders: [
          {
            type: 'BasicAuth',
            name: 'basic-auth',
            basicAuth: {
              url: 'https://www.openshift.com',
            },
            mappingMethod: 'claim',
          },
        ],
      },
    };
    useAccessReviewMock.mockReturnValue(true);
    useK8sWatchResourceMock.mockReturnValue([oauthData, true, null]);

    const { result } = testHook(() => useIdentityProviderLink());

    expect(result.current).toBe(null);
  });

  it('should return no link if there is an error', () => {
    useAccessReviewMock.mockReturnValue(true);
    useK8sWatchResourceMock.mockReturnValue([null, true, new Error('Any error')]);

    const { result } = testHook(() => useIdentityProviderLink());

    expect(result.current).toBe(null);
  });
});
