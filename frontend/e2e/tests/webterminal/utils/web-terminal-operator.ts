import KubernetesClient, { isAlreadyExists } from '../../../clients/kubernetes-client';

/**
 * User-preference key the console writes with the namespace a terminal last ran
 * in (CLOUD_SHELL_NAMESPACE_CONFIG_USER_PREFERENCE_KEY in webterminal-plugin).
 */
export const TERMINAL_NAMESPACE_PREFERENCE = 'console.terminal.namespace';

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

/**
 * Idempotent: several web terminal suites, in more than one Playwright project,
 * call this against the same cluster. It always waits for the controller to be
 * ready — an existing Subscription does not mean the operator is usable yet,
 * and until it is the console renders "Restricted access" instead of the
 * terminal.
 */
export async function ensureWebTerminalOperatorInstalled(
  k8sClient: KubernetesClient,
): Promise<void> {
  let subscriptionExists = false;
  try {
    await k8sClient.getCustomResource(
      SUBSCRIPTION_GROUP,
      SUBSCRIPTION_VERSION,
      OPERATOR_NAMESPACE,
      SUBSCRIPTION_PLURAL,
      'web-terminal',
    );
    subscriptionExists = true;
  } catch {
    // Subscription doesn't exist — create it below.
  }

  if (!subscriptionExists) {
    try {
      await k8sClient.createCustomResource(
        SUBSCRIPTION_GROUP,
        SUBSCRIPTION_VERSION,
        OPERATOR_NAMESPACE,
        SUBSCRIPTION_PLURAL,
        webTerminalSubscription,
      );
    } catch (err) {
      // Another suite can create the Subscription between the read above and
      // this write, so treat "already exists" as success.
      if (!isAlreadyExists(err)) {
        throw err;
      }
    }
  }

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
