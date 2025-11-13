import { useMemo, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getImpersonate, getUser, K8sResourceKind } from '@console/dynamic-plugin-sdk/src';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { ConfigMapModel } from '@console/internal/models';
import { RootState } from '@console/internal/redux';
import { USER_SETTING_CONFIGMAP_NAMESPACE } from '../utils/user-settings';

export const useGetUserSettingConfigMap = () => {
  const [hashedUsername, setHashedUsername] = useState<string | null>(null);

  const hashNameOrKubeadmin = async (name: string): Promise<string | null> => {
    if (!name) {
      return null;
    }

    if (name === 'kube:admin') {
      return 'kubeadmin';
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(name);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  };

  // User and impersonate info
  const userInfo = useSelector((state: RootState) => {
    const impersonateName = getImpersonate(state)?.name;
    const { uid, username } = getUser(state) ?? {};
    return { impersonateName, uid, username };
  });

  // Hash the username asynchronously
  useEffect(() => {
    if (userInfo.username) {
      hashNameOrKubeadmin(userInfo.username)
        .then(setHashedUsername)
        .catch(() => {
          setHashedUsername(null);
        });
    } else {
      setHashedUsername(null);
    }
  }, [userInfo.username]);

  // Compute the final user UID
  const userUid = userInfo.impersonateName || userInfo.uid || hashedUsername || '';

  const configMapResource = useMemo(
    () =>
      !userUid
        ? null
        : {
            kind: ConfigMapModel.kind,
            namespace: USER_SETTING_CONFIGMAP_NAMESPACE,
            isList: false,
            name: `user-settings-${userUid}`,
          },
    [userUid],
  );
  const [cfData, cfLoaded, cfLoadError] = useK8sWatchResource<K8sResourceKind>(configMapResource);
  return [cfData, cfLoaded, cfLoadError];
};
