import { execSync } from 'child_process';
import * as path from 'path';

import { test as setup } from '@playwright/test';

import KubernetesClient from '../clients/kubernetes-client';

const SUBSCRIPTION_YAML = path.resolve(
  import.meta.dirname,
  '../mocks/knative/serverlessOperatorSubscription.yaml',
);

const SERVING_YAML = path.resolve(
  import.meta.dirname,
  '../mocks/knative/knative-serving.yaml',
);

const EVENTING_YAML = path.resolve(
  import.meta.dirname,
  '../mocks/knative/knative-eventing.yaml',
);

const isRetryableError = (err: unknown): boolean => {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes('not found') ||
    msg.includes('NotFound') ||
    msg.includes('404') ||
    msg.includes('429') ||
    msg.includes('TooManyRequests') ||
    msg.includes('ECONNREFUSED') ||
    msg.includes('ECONNRESET') ||
    msg.includes('ETIMEDOUT') ||
    msg.includes('the server was unable to return a response')
  );
};

setup.describe.configure({ mode: 'serial' });

setup('install OpenShift Serverless operator if not present', async ({ }) => {
  setup.setTimeout(600_000);

  const k8sClient = new KubernetesClient(
    {
      clusterUrl: process.env.CLUSTER_URL || '',
      username: process.env.OPENSHIFT_USERNAME || 'kubeadmin',
      password: process.env.BRIDGE_KUBEADMIN_PASSWORD || '',
    },
    process.env.KUBECONFIG,
  );

  // Check if the Serverless operator is already installed
  try {
    const csvList = await k8sClient.customObjectsApi.listNamespacedCustomObject({
      group: 'operators.coreos.com',
      version: 'v1alpha1',
      namespace: 'openshift-serverless',
      plural: 'clusterserviceversions',
    });
    const items = (csvList as { items?: Array<{ status?: { phase?: string } }> }).items || [];
    const installed = items.some((csv) => csv.status?.phase === 'Succeeded');
    if (installed) {
      // eslint-disable-next-line no-console
      console.log('Serverless operator already installed, skipping installation');
      return;
    }
  } catch (err) {
    if (!isRetryableError(err)) throw err;
    // Namespace may not exist yet — proceed with installation
  }

  // Install using oc apply — same approach as the Cypress tests.
  // Using oc apply ensures OLM creates deployments with proper seccompProfile
  // which is required on OCP 5.0 clusters with PodSecurity "restricted".
  // eslint-disable-next-line no-console
  console.log('Installing Serverless operator...');
  try {
    const output = execSync(`oc apply -f ${SUBSCRIPTION_YAML}`, {
      encoding: 'utf-8',
      timeout: 60_000,
    });
    // eslint-disable-next-line no-console
    console.log(output.trim());
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes('already exists') && !msg.includes('AlreadyExists')) {
      throw err;
    }
  }

  // Wait for the CSV to reach Succeeded phase
  // eslint-disable-next-line no-console
  console.log('Waiting for Serverless operator CSV to succeed...');
  const startTime = Date.now();
  const csvTimeout = 540_000;
  let csvSucceeded = false;
  while (Date.now() - startTime < csvTimeout) {
    try {
      const csvList = await k8sClient.customObjectsApi.listNamespacedCustomObject({
        group: 'operators.coreos.com',
        version: 'v1alpha1',
        namespace: 'openshift-serverless',
        plural: 'clusterserviceversions',
      });
      const items = (csvList as { items?: Array<{ status?: { phase?: string } }> }).items || [];
      if (items.some((csv) => csv.status?.phase === 'Succeeded')) {
        // eslint-disable-next-line no-console
        console.log('Serverless operator installed successfully');
        csvSucceeded = true;
        break;
      }
    } catch (err) {
      if (!isRetryableError(err)) throw err;
    }
    await new Promise((r) => setTimeout(r, 10_000));
  }
  if (!csvSucceeded) {
    throw new Error(`Serverless operator CSV did not reach Succeeded phase after ${Math.round((Date.now() - startTime) / 1000)}s`);
  }
});

setup('create KnativeServing and KnativeEventing instances', async ({ }) => {
  setup.setTimeout(600_000);

  const k8sClient = new KubernetesClient(
    {
      clusterUrl: process.env.CLUSTER_URL || '',
      username: process.env.OPENSHIFT_USERNAME || 'kubeadmin',
      password: process.env.BRIDGE_KUBEADMIN_PASSWORD || '',
    },
    process.env.KUBECONFIG,
  );

  // Apply KnativeServing and KnativeEventing using oc apply
  try {
    execSync(`oc apply -f ${SERVING_YAML}`, { encoding: 'utf-8', timeout: 30_000 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes('already exists') && !msg.includes('AlreadyExists')) {
      throw err;
    }
  }
  try {
    execSync(`oc apply -f ${EVENTING_YAML}`, { encoding: 'utf-8', timeout: 30_000 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes('already exists') && !msg.includes('AlreadyExists')) {
      throw err;
    }
  }

  // Wait for Serving and Eventing to be Ready
  // eslint-disable-next-line no-console
  console.log('Waiting for KnativeServing and KnativeEventing to be ready...');
  const waitForReady = async (
    plural: string,
    namespace: string,
    name: string,
    timeoutMs = 270_000,
  ) => {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      try {
        const resource = (await k8sClient.customObjectsApi.getNamespacedCustomObject({
          group: 'operator.knative.dev',
          version: 'v1beta1',
          namespace,
          plural,
          name,
        })) as { status?: { conditions?: Array<{ type: string; status: string }> } };
        const ready = resource.status?.conditions?.find(
          (c: { type: string }) => c.type === 'Ready',
        );
        if (ready?.status === 'True') {
          // eslint-disable-next-line no-console
          console.log(`${name} in ${namespace} is Ready`);
          return;
        }
      } catch (err) {
        if (!isRetryableError(err)) throw err;
      }
      await new Promise((r) => setTimeout(r, 10_000));
    }
    throw new Error(`${name} in ${namespace} not ready after ${timeoutMs}ms`);
  };

  await waitForReady('knativeservings', 'knative-serving', 'knative-serving');
  await waitForReady('knativeeventings', 'knative-eventing', 'knative-eventing');
});
