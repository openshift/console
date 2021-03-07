import {
  k8sWatch,
} from '@console/internal/module/k8s';

/**
 * Use k8sWatch to wait for a resource to get into an expected condition.
 * Watches for resource by kind, namespace and optional name.
 * Promise resolves to a new resource version or rejects with a timeout.
 * @param {K8sKind} kind
 * @param {K8sResourceKind} resource
 * @param {(kind: K8sResourceKind) => boolean} checkCondition
 * @param {number} timeoutInMs
 * @returns {Promise<K8sResourceKind>}
 */
export const k8sWaitForUpdate = (kind, resource, checkCondition, timeoutInMs) => {
  const { namespace, name, resourceVersion } = resource.metadata;

  if (checkCondition(resource)) {
    return Promise.resolve(resource);
  }

  const watcher = k8sWatch(kind, {
    ns: namespace,
    resourceVersion,
  });
  const closeConnection = () => watcher.destroy();

  const waitForCondition = new Promise((resolve, reject) => {
    watcher.onbulkmessage((messages) => {
      messages.forEach(({ object }) => {
        if ((!name || name === object.metadata?.name)) {
          try {
            if (checkCondition(object)) {
              resolve(object);
            }
          } catch (err) {
            reject(err)
          }
        }
      });
    });
    watcher.onclose(() => reject(new Error('Connection closed')));
    watcher.ondestroy(() => reject(new Error('Connection destroyed')));
  });

  const waitForTimeout = new Promise((resolve, reject) => {
    setTimeout(() => reject(new Error('Timed out waiting for resource to finish')), timeoutInMs);
  });

  return Promise.race([waitForCondition, waitForTimeout]).finally(closeConnection);
};
