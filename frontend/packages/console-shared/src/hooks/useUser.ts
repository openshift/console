import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { getUser, getUserResource, setUserResource } from '@console/dynamic-plugin-sdk';
import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import { UserModel } from '@console/internal/models';
import type { UserKind } from '@console/internal/module/k8s/types';

/**
 * Custom hook that provides centralized user data fetching and management.
 * This hook fetches both the UserInfo (from authentication) and UserKind (from k8s API)
 * and stores them in Redux for use throughout the application.
 *
 * @returns Object containing user info, user resource, and loading states
 */
export const useUser = () => {
  const { t } = useTranslation('public');
  const dispatch = useDispatch();

  // Get current user info from Redux (username, groups, etc.)
  const user = useSelector(getUser);

  // Get current user resource from Redux (fullName, identities, etc.)
  const userResource = useSelector(getUserResource);

  // Fetch user resource from k8s API
  const [userResourceData, userResourceLoaded, userResourceError] = useK8sGet<UserKind>(
    UserModel,
    '~',
  );

  // Update Redux when user resource is loaded
  useEffect(() => {
    if (userResourceLoaded && userResourceData && !userResourceError) {
      dispatch(setUserResource(userResourceData));
    }
  }, [dispatch, userResourceData, userResourceLoaded, userResourceError]);

  const currentUserResource = userResource || userResourceData;
  const currentUsername = user?.username;
  const currentFullName = currentUserResource?.fullName;

  // Create a robust display name that always has a fallback
  const getDisplayName = () => {
    // Prefer fullName if it exists and is not empty
    if (currentFullName && currentFullName.trim()) {
      return currentFullName.trim();
    }
    // Fallback to username if it exists and is not empty
    if (currentUsername && currentUsername.trim()) {
      return currentUsername.trim();
    }
    // Final fallback for edge cases
    return t('Unknown user');
  };

  return {
    user,
    userResource: currentUserResource,
    userResourceLoaded,
    userResourceError,
    // Computed properties for convenience
    username: currentUsername,
    fullName: currentFullName,
    displayName: getDisplayName(),
  };
};
