import KubernetesClient from '../../../clients/kubernetes-client';

const SUBSCRIPTION_GROUP = 'operators.coreos.com';
const SUBSCRIPTION_VERSION = 'v1alpha1';
const SUBSCRIPTION_PLURAL = 'subscriptions';

/**
 * Check whether an OLM operator subscription exists in the cluster.
 * Searches the given namespace (defaults to openshift-operators) for a
 * Subscription whose metadata.name matches `subscriptionName`.
 */
export async function hasOperatorSubscription(
  k8sClient: KubernetesClient,
  subscriptionName: string,
  namespace = 'openshift-operators',
): Promise<boolean> {
  try {
    await k8sClient.getCustomResource(
      SUBSCRIPTION_GROUP,
      SUBSCRIPTION_VERSION,
      namespace,
      SUBSCRIPTION_PLURAL,
      subscriptionName,
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Check whether a ClusterServiceVersion whose name starts with
 * `csvPrefix` exists in the given namespace and has phase "Succeeded".
 */
export async function hasCSVReady(
  k8sClient: KubernetesClient,
  csvPrefix: string,
  namespace = 'openshift-operators',
): Promise<boolean> {
  try {
    const csvs = await k8sClient.listCustomResources(
      SUBSCRIPTION_GROUP,
      SUBSCRIPTION_VERSION,
      namespace,
      'clusterserviceversions',
    );
    return csvs.some(
      (csv) =>
        (csv as any).metadata?.name?.startsWith(csvPrefix) &&
        (csv as any).status?.phase === 'Succeeded',
    );
  } catch {
    return false;
  }
}
