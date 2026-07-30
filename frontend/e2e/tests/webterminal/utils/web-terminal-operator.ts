import KubernetesClient from '../../../clients/kubernetes-client';

const SUBSCRIPTION_GROUP = 'operators.coreos.com';
const SUBSCRIPTION_VERSION = 'v1alpha1';
const SUBSCRIPTION_PLURAL = 'subscriptions';
const OPERATOR_NAMESPACE = 'openshift-operators';

const webTerminalSubscription = {
  apiVersion: 'operators.coreos.com/v1alpha1',
  kind: 'Subscription',
  metadata: {
    name: 'web-terminal',
    namespace: OPERATOR_NAMESPACE,
  },
  spec: {
    channel: 'fast',
    installPlanApproval: 'Automatic',
    name: 'web-terminal',
    source: 'redhat-operators',
    sourceNamespace: 'openshift-marketplace',
  },
};

export async function ensureWebTerminalOperatorInstalled(
  k8sClient: KubernetesClient,
): Promise<void> {
  try {
    await k8sClient.getCustomResource(
      SUBSCRIPTION_GROUP,
      SUBSCRIPTION_VERSION,
      OPERATOR_NAMESPACE,
      SUBSCRIPTION_PLURAL,
      'web-terminal',
    );
    return;
  } catch {
    // Subscription doesn't exist — create it
  }

  await k8sClient.createCustomResource(
    SUBSCRIPTION_GROUP,
    SUBSCRIPTION_VERSION,
    OPERATOR_NAMESPACE,
    SUBSCRIPTION_PLURAL,
    webTerminalSubscription,
  );

  const maxWaitMs = 300_000;
  const pollIntervalMs = 10_000;
  const deadline = Date.now() + maxWaitMs;

  while (Date.now() < deadline) {
    const pods = await k8sClient.getPods(OPERATOR_NAMESPACE);
    const controllerPod = pods.find(
      (pod) =>
        pod.metadata?.name?.includes('web-terminal-controller') &&
        pod.status?.phase === 'Running' &&
        pod.status?.conditions?.some((c) => c.type === 'Ready' && c.status === 'True'),
    );
    if (controllerPod) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error('Web Terminal operator controller pod not ready within 5 minutes');
}

const CSV_PLURAL = 'clusterserviceversions';

export async function uninstallWebTerminalOperator(
  k8sClient: KubernetesClient,
): Promise<void> {
  try {
    await k8sClient.deleteCustomResource(
      SUBSCRIPTION_GROUP,
      SUBSCRIPTION_VERSION,
      OPERATOR_NAMESPACE,
      SUBSCRIPTION_PLURAL,
      'web-terminal',
    );

    const csvs = await k8sClient.listCustomResources(
      SUBSCRIPTION_GROUP,
      SUBSCRIPTION_VERSION,
      OPERATOR_NAMESPACE,
      CSV_PLURAL,
    );
    const webTerminalCsv = csvs.find(
      (csv) => (csv as any).metadata?.name?.startsWith('web-terminal'),
    );
    if (webTerminalCsv) {
      await k8sClient.deleteCustomResource(
        SUBSCRIPTION_GROUP,
        SUBSCRIPTION_VERSION,
        OPERATOR_NAMESPACE,
        CSV_PLURAL,
        (webTerminalCsv as any).metadata.name,
      );
    }
  } catch (err) {
    console.warn('[Cleanup] Failed to uninstall Web Terminal operator:', err);
  }
}
