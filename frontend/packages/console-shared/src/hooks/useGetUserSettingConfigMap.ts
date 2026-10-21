import { useMemo } from 'react';
import type { K8sResourceKind } from '@console/dynamic-plugin-sdk/src';
import { getImpersonate, getUser } from '@console/dynamic-plugin-sdk/src';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { ConfigMapModel } from '@console/internal/models';
import { useConsoleSelector } from '@console/shared/src/hooks/useConsoleSelector';
import { hashUsernameForSettings, USER_SETTING_CONFIGMAP_NAMESPACE } from '../utils/user-settings';

export const useGetUserSettingConfigMap = () => {
  const userUid = useConsoleSelector((state) => {
    const impersonateName = getImpersonate(state)?.name;
    const { uid, username } = getUser(state) ?? {};
    const hashName = hashUsernameForSettings(username, uid);
    return impersonateName || hashName || '';
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
