import { saveAs } from 'file-saver';
import { coFetch } from '@console/shared/src/utils/console-fetch';

export type KubeconfigResourceType = 'ServiceAccount' | 'User';

/**
 * Downloads a kubeconfig file for the given resource by POSTing to the backend
 * /api/kubeconfig endpoint and triggering a browser file save.
 *
 * For a ServiceAccount, the backend mints a bound token via the TokenRequest
 * API. For the current user, the current session token is embedded. RBAC is
 * enforced by the backend using the requesting user's credentials.
 */
export const downloadKubeconfig = async (
  resourceType: KubeconfigResourceType,
  name?: string,
  namespace?: string,
): Promise<void> => {
  const response = await coFetch('/api/kubeconfig', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resourceType, name, namespace }),
  });
  const blob = await response.blob();
  saveAs(blob, 'kubeconfig');
};
