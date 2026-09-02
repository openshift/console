import * as k8s from '@kubernetes/client-node';
import { test as setup } from '@playwright/test';

import KubernetesClient from '../clients/kubernetes-client';

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

setup('install Web Terminal operator if not present', async () => {
  setup.setTimeout(600_000);

  const k8sClient = new KubernetesClient(
    {
      clusterUrl: process.env.CLUSTER_URL || '',
      username: process.env.OPENSHIFT_USERNAME || 'kubeadmin',
      password: process.env.BRIDGE_KUBEADMIN_PASSWORD || '',
    },
    process.env.KUBECONFIG,
  );

  try {
    await k8sClient.getCustomResource(
      SUBSCRIPTION_GROUP,
      SUBSCRIPTION_VERSION,
      OPERATOR_NAMESPACE,
      SUBSCRIPTION_PLURAL,
      'web-terminal',
    );
    // Subscription exists — fall through to readiness poll
  } catch (err) {
    if (!(err instanceof k8s.ApiException && err.code === 404)) {
      throw err;
    }
    try {
      await k8sClient.createCustomResource(
        SUBSCRIPTION_GROUP,
        SUBSCRIPTION_VERSION,
        OPERATOR_NAMESPACE,
        SUBSCRIPTION_PLURAL,
        webTerminalSubscription,
      );
    } catch (err) {
      if (!(err instanceof k8s.ApiException && err.code === 409)) {
        throw err;
      }
    }
  }

  const pollIntervalMs = 10_000;
  const deadline = Date.now() + 300_000;

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
});
