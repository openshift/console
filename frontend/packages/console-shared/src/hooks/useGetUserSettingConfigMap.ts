import { createHash } from 'crypto';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { getImpersonate, getUser, K8sResourceKind } from '@console/dynamic-plugin-sdk/src';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { ConfigMapModel } from '@console/internal/models';
import { RootState } from '@console/internal/redux';
import { USER_SETTING_CONFIGMAP_NAMESPACE } from '../utils/user-settings';

export const useGetUserSettingConfigMap = () => {
  const hashNameOrKubeadmin = (name: string): string | null => {
    if (!name) {
      return null;
    }

    if (name === 'kube:admin') {
      return 'kubeadmin';
    }
    const hash = createHash('sha256');
    hash.update(name);
    return hash.digest('hex');
  };
  // User and impersonate
  const userUid = useSelector((state: RootState) => {
    const impersonateName = getImpersonate(state)?.name;
    const { uid, username } = getUser(state) ?? {};
    const hashName = hashNameOrKubeadmin(username);
    return impersonateName || uid || hashName || '';
  });

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
