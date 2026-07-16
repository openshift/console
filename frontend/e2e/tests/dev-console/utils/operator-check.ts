import KubernetesClient from '../../../clients/kubernetes-client';

const SUBSCRIPTION_GROUP = 'operators.coreos.com';
const SUBSCRIPTION_VERSION = 'v1alpha1';
const SUBSCRIPTION_PLURAL = 'subscriptions';

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
  } catch (err) {
    const code =
      (err as any).statusCode ??
      (err as any).response?.statusCode ??
      (err as any).code;
    if (code === 404) {
      return false;
    }
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('404') || msg.includes('not found') || msg.includes('Not Found')) {
      return false;
    }
    throw err;
  }
}
