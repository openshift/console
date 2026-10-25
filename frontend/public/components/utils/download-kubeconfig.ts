import { saveAs } from 'file-saver';
import { coFetch } from '@console/shared/src/utils/console-fetch';

export type KubeconfigResourceType = 'ServiceAccount' | 'User';

/**
 * Extracts the filename from a Content-Disposition header value, falling back to
 * `kubeconfig` when the header is absent or unparseable. The backend derives a
 * descriptive name (e.g. `kubeconfig-<namespace>-<sa>`) so downloads for
 * different resources don't overwrite each other.
 */
const filenameFromContentDisposition = (header: string | null): string => {
  const match = header && /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(header);
  return match ? decodeURIComponent(match[1].trim()) : 'kubeconfig';
};

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
  saveAs(blob, filenameFromContentDisposition(response.headers.get('Content-Disposition')));
};
