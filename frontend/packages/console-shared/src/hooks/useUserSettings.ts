import * as React from 'react';
// FIXME upgrading redux types is causing many errors at this time
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { useSelector } from 'react-redux';
import { RootState } from '@console/internal/redux';
import { ConfigMapModel, ProjectRequestModel, ProjectModel } from '@console/internal/models';
import {
  K8sResourceKind,
  k8sGet,
  k8sCreate,
  k8sPatch,
  ConfigMapKind,
} from '@console/internal/module/k8s';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';

// can't create project with name prefix with 'openshift-*', once we have proxy need to update
const USER_SETTING_CONFIGMAP_NAMESPACE = 'console-user-settings';

// This won't be needed once we have proxy api
const getProject = async () => {
  try {
    await k8sGet(ProjectModel, USER_SETTING_CONFIGMAP_NAMESPACE);
  } catch {
    await k8sCreate(ProjectRequestModel, {
      metadata: {
        name: USER_SETTING_CONFIGMAP_NAMESPACE,
      },
    });
  }
};

const createConfigMap = async (configMapData: K8sResourceKind): Promise<boolean> => {
  try {
    await k8sCreate(ConfigMapModel, configMapData);
    return true;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    return false;
  }
};

const updateConfigMap = async (configMap: ConfigMapKind, key: string, value: string) => {
  if (value !== configMap.data?.[key]) {
    const patch = [
      {
        op: 'replace',
        path: `/data/${key}`,
        value,
      },
    ];
    try {
      await k8sPatch(ConfigMapModel, configMap, patch);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
    }
  }
};

const deseralizeData = <T>(data: T) => {
  if (typeof data !== 'string') {
    return data;
  }
  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
};

const seralizeData = <T>(data: T) => {
  if (typeof data === 'string') {
    return data;
  }
  return JSON.stringify(data);
};

export const useUserSettings = <T>(
  key: string,
  defaultValue?: T,
): [T, React.Dispatch<React.SetStateAction<T>>, boolean] => {
  const defaultValueRef = React.useRef<T>(defaultValue);
  const keyRef = React.useRef<string>(key);
  const userUid = useSelector(
    (state: RootState) => state.UI.get('user')?.metadata?.uid ?? 'kubeadmin',
  );
  const configMapResource = React.useMemo(
    () => ({
      kind: ConfigMapModel.kind,
      namespace: USER_SETTING_CONFIGMAP_NAMESPACE,
      isList: false,
      name: `user-settings-${userUid}`,
    }),
    [userUid],
  );
  const [cfData, cfLoaded, cfLoadError] = useK8sWatchResource<K8sResourceKind>(configMapResource);
  const [settings, setSettings] = React.useState<T>();
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    if (cfLoadError || (!cfData && cfLoaded)) {
      (async () => {
        await getProject();
        const cmCreated = await createConfigMap({
          apiVersion: ConfigMapModel.apiVersion,
          kind: ConfigMapModel.kind,
          metadata: {
            name: `user-settings-${userUid}`,
            namespace: USER_SETTING_CONFIGMAP_NAMESPACE,
          },
          data: {
            ...(defaultValueRef.current !== undefined && {
              [keyRef.current]: seralizeData(defaultValueRef.current),
            }),
          },
        });
        if (!cmCreated) {
          setSettings(deseralizeData(defaultValueRef.current));
          setLoaded(true);
        }
      })();
    } else if (
      cfData &&
      cfLoaded &&
      (!cfData.data?.hasOwnProperty(keyRef.current) ||
        seralizeData(settings) !== cfData.data?.[keyRef.current])
    ) {
      setSettings(deseralizeData(cfData.data?.[keyRef.current]) ?? defaultValueRef.current);
      setLoaded(true);
    } else if (cfLoaded) {
      setSettings(deseralizeData(defaultValueRef.current));
      setLoaded(true);
    }
    // This effect should only be run on change of configmap data, status.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfLoaded, cfLoadError]);

  React.useEffect(() => {
    if (cfData && cfLoaded && settings !== undefined) {
      updateConfigMap(cfData, keyRef.current, seralizeData(settings));
    }
    // This effect should only be run on change of settings state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  return [settings, setSettings, loaded];
};
