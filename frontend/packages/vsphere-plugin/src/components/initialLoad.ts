import { K8sModel, k8sGet } from '@console/dynamic-plugin-sdk/src/api/core-api';
import { ConfigMap, Secret } from '../resources';
import { ConnectionFormContextSetters } from './types';
import { decodeBase64, parseKeyValue } from './utils';

// TODO: Adopt npm/ini package to do following parsing (see persist.ts)
export const initialLoad = async (
  setters: ConnectionFormContextSetters,
  secretModel: K8sModel,
  cloudProviderConfig: ConfigMap,
): Promise<void> => {
  const config = cloudProviderConfig.data?.config;
  if (!config) {
    return;
  }

  const keyValues = parseKeyValue(config);

  const server = keyValues.server || '';
  const dc = keyValues.datacenter || '';
  const ds = keyValues['default-datastore'] || '';
  const folder = keyValues.folder || '';
  let username = '';
  let pwd = '';

  // query Secret
  if (keyValues['secret-name'] && keyValues['secret-namespace']) {
    // parse secret for username and password
    try {
      const secret = await k8sGet<Secret>({
        model: secretModel,
        name: keyValues['secret-name'],
        ns: keyValues['secret-namespace'],
      });

      if (!secret.data) {
        // eslint-disable-next-line no-console
        console.error(`Unexpected structure of the "${keyValues['secret-name']}" secret`);
      }

      const secretKeyValues = secret.data;
      username = decodeBase64(secretKeyValues[`${server}.username`]);
      pwd = decodeBase64(secretKeyValues[`${server}.password`]);
    } catch (e) {
      // It should be there if referenced
      // eslint-disable-next-line no-console
      console.error(
        `Failed to load "${keyValues['secret-name']}" from "${keyValues['secret-namespace']}" secret: `,
        e,
      );
    }
  }

  setters.setVcenter(server);
  setters.setDatacenter(dc);
  setters.setDefaultDatastore(ds);
  setters.setFolder(folder);
  setters.setUsername(username);
  setters.setPassword(pwd);

  setters.setDirty(false);
};
