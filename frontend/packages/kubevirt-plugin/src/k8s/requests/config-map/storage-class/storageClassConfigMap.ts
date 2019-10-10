import { ConfigMapModel } from '@console/internal/models';
import { ConfigMapKind } from '@console/internal/module/k8s';
import { STORAGE_CLASS_CONFIG_MAP_NAME, STORAGE_CLASS_CONFIG_MAP_NAMESPACES } from './constants';

const { warn } = console;

const getStorageClassConfigMapInNamespace = async ({
  k8sGet,
  namespace,
}: {
  namespace: string;
  k8sGet: (...opts: any) => Promise<any>;
}): Promise<ConfigMapKind> => {
  try {
    return await k8sGet(ConfigMapModel, STORAGE_CLASS_CONFIG_MAP_NAME, namespace, null, {
      disableHistory: true,
    });
  } catch (e) {
    return null;
  }
};

export const getStorageClassConfigMap = async (props: {
  k8sGet: (...opts: any[]) => Promise<any>;
}): Promise<ConfigMapKind> => {
  // query namespaces sequentially to respect order
  // eslint-disable-next-line @typescript-eslint/prefer-for-of
  for (let index = 0; index < STORAGE_CLASS_CONFIG_MAP_NAMESPACES.length; index++) {
    // eslint-disable-next-line no-await-in-loop
    const configMap = await getStorageClassConfigMapInNamespace({
      namespace: STORAGE_CLASS_CONFIG_MAP_NAMESPACES[index],
      ...props,
    });
    if (configMap) {
      return configMap;
    }
  }
  warn(
    `The ${STORAGE_CLASS_CONFIG_MAP_NAME} can not be found in none of following namespaces: `,
    JSON.stringify(STORAGE_CLASS_CONFIG_MAP_NAMESPACES),
    '. The PVCs will be created with default values.',
  );
  return null;
};
