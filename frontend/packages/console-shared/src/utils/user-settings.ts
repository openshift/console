import { ConfigMapModel, ProjectRequestModel, ProjectModel } from '@console/internal/models';
import {
  K8sResourceKind,
  k8sGet,
  k8sCreate,
  k8sPatch,
  ConfigMapKind,
} from '@console/internal/module/k8s';

// can't create project with name prefix with 'openshift-*', once we have proxy need to update
export const USER_SETTING_CONFIGMAP_NAMESPACE = 'console-user-settings';

export const getProject = async (): Promise<boolean> => {
  try {
    await k8sGet(ProjectModel, USER_SETTING_CONFIGMAP_NAMESPACE);
    return true;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    return false;
  }
};

export const createProject = async () => {
  try {
    await k8sCreate(ProjectRequestModel, {
      metadata: {
        name: USER_SETTING_CONFIGMAP_NAMESPACE,
      },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
  }
};

export const createConfigMap = async (configMapData: K8sResourceKind): Promise<K8sResourceKind> => {
  try {
    const configMapDataResp = await k8sCreate(ConfigMapModel, configMapData);
    return configMapDataResp;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    const error: Error & { response?: object } = new Error(err.message);
    error.response = err.response;
    throw error;
  }
};

export const updateConfigMap = async (configMap: ConfigMapKind, key: string, value: string) => {
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

export const deseralizeData = (data: string | null) => {
  if (typeof data !== 'string') {
    return data;
  }
  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
};

export const seralizeData = <T>(data: T) => {
  if (typeof data === 'string') {
    return data;
  }
  return JSON.stringify(data);
};
