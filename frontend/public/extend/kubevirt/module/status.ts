import { k8sBasePath } from '../../../module/k8s/k8s';
import { coFetchJSON } from '../../../co-fetch';

import { kubevirtApiSubresourceGroup, kubevirtApiVersion } from '../constants';

export const getKubeVirtVersion = () =>
  coFetchJSON(`${k8sBasePath}/apis/${kubevirtApiSubresourceGroup}/${kubevirtApiVersion}/version`);
