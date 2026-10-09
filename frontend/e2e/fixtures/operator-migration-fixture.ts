import { createHash, randomUUID } from 'crypto';
import { gunzipSync } from 'zlib';

import type KubernetesClient from '../clients/kubernetes-client';
import { isNotFound } from '../clients/kubernetes-client';
import { OperatorMigrationPage } from '../pages/operator-migration-page';
import { loginFromEnv } from '../setup/login-helper';
import { test as base, expect } from './index';
import type { CleanupFixture } from './cleanup-fixture';

export const OLM_GROUP = 'operators.coreos.com';
export const TARGET_GROUP = 'olm.operatorframework.io';
export const PACKAGES = {
  first: 'console-migration-a',
  second: 'console-migration-b',
  ownNamespace: 'console-migration-own-namespace',
  noTarget: 'console-migration-no-target',
};

type Resource = {
  metadata: {
    name: string;
    namespace?: string;
    uid?: string;
    generation?: number;
    resourceVersion?: string;
    creationTimestamp?: string;
    deletionTimestamp?: string;
    finalizers?: string[];
    annotations?: Record<string, string>;
  };
  spec?: {
    namespace?: string;
    lifecycleState?: string;
    source?: { catalog?: { packageName?: string } };
  };
  status?: {
    completedAt?: string;
    installedCSV?: string;
    installPlanRef?: { name: string };
    phase?: string;
    conditions?: { type: string; status: string; reason?: string; observedGeneration?: number }[];
    connectionState?: { lastObservedState?: string };
  };
};

export type MigrationOperator = {
  packageName: string;
  subscriptionName: string;
  namespace: string;
  csvName: string;
};

export class OperatorMigrationFixture {
  private readonly suffix = randomUUID().slice(0, 8);
  private readonly catalogNamespace = 'openshift-marketplace';
  private readonly catalogName = `migration-catalog-${this.suffix}`;
  private readonly operators: MigrationOperator[] = [];
  private readonly jobs = new Set<string>();
  private readonly rollbackHolds = new Set<() => Promise<void>>();

  /** Creates isolated catalog identifiers and shares cleanup and authentication configuration. */
  constructor(
    private readonly client: KubernetesClient,
    private readonly cleanup: CleanupFixture,
    readonly authDisabled: boolean,
  ) {}

  /** Installs real source and target catalogs and waits until both serve bundles. */
  async createCatalogs(sourceImage: string, targetImage: string): Promise<void> {
    // This global catalog namespace makes the source visible to fixture subscriptions
    // in their own install namespaces. Track only our CatalogSource, not the shared namespace.
    this.cleanup.trackCustomResource(
      this.catalogName,
      this.catalogNamespace,
      OLM_GROUP,
      'v1alpha1',
      'catalogsources',
    );
    await this.client.createCustomResource(
      OLM_GROUP,
      'v1alpha1',
      this.catalogNamespace,
      'catalogsources',
      {
        apiVersion: `${OLM_GROUP}/v1alpha1`,
        kind: 'CatalogSource',
        metadata: { name: this.catalogName, namespace: this.catalogNamespace },
        spec: {
          sourceType: 'grpc',
          image: sourceImage,
          displayName: 'Console migration fixtures',
          publisher: 'Console E2E',
          grpcPodConfig: { securityContextConfig: 'restricted' },
        },
      },
    );
    this.cleanup.trackClusterCustomResource(
      this.catalogName,
      TARGET_GROUP,
      'v1',
      'clustercatalogs',
    );
    await this.client.createClusterCustomResource(TARGET_GROUP, 'v1', 'clustercatalogs', {
      apiVersion: `${TARGET_GROUP}/v1`,
      kind: 'ClusterCatalog',
      metadata: { name: this.catalogName },
      spec: { source: { type: 'Image', image: { ref: targetImage } } },
    });
    await expect
      .poll(
        async () => {
          const catalog = (await this.client.getCustomResource(
            OLM_GROUP,
            'v1alpha1',
            this.catalogNamespace,
            'catalogsources',
            this.catalogName,
          )) as Resource;
          return catalog.status?.connectionState?.lastObservedState;
        },
        { timeout: 300_000, message: 'Fixture CatalogSource must serve real bundles' },
      )
      .toBe('READY');
    await expect
      .poll(
        async () => {
          const catalog = (await this.client.getClusterCustomResource(
            TARGET_GROUP,
            'v1',
            'clustercatalogs',
            this.catalogName,
          )) as Resource;
          return catalog.status?.conditions?.some(
            ({ type, status }) => type === 'Serving' && status === 'True',
          );
        },
        { timeout: 300_000, message: 'Fixture ClusterCatalog must serve migration targets' },
      )
      .toBe(true);
  }

  /** Installs a source operator with completed OLM v0 state and a reconciled operand. */
  async install(packageName: string): Promise<MigrationOperator> {
    const namespace = `${packageName}-${this.suffix}`;
    const subscriptionName = namespace;
    await this.client.createNamespace(namespace, undefined, { runLevelZero: false });
    this.cleanup.trackNamespace(namespace);
    await this.client.waitForNamespaceReady(namespace);
    // Track targets before installing, so cleanup deletes them before source CRDs.
    this.cleanup.trackClusterCustomResource(
      subscriptionName,
      TARGET_GROUP,
      'v1',
      'clusterextensions',
    );
    this.cleanup.trackClusterCustomResource(
      `${subscriptionName}-1`,
      TARGET_GROUP,
      'v1',
      'clusterobjectsets',
    );
    this.cleanup.trackClusterCustomResource(
      `workloads.${packageName}.migration-fixtures.console.openshift.io`,
      'apiextensions.k8s.io',
      'v1',
      'customresourcedefinitions',
    );
    await this.client.createCustomResource(OLM_GROUP, 'v1', namespace, 'operatorgroups', {
      apiVersion: `${OLM_GROUP}/v1`,
      kind: 'OperatorGroup',
      metadata: { name: 'fixture', namespace },
      spec: packageName === PACKAGES.ownNamespace ? { targetNamespaces: [namespace] } : {},
    });
    await this.client.createCustomResource(OLM_GROUP, 'v1alpha1', namespace, 'subscriptions', {
      apiVersion: `${OLM_GROUP}/v1alpha1`,
      kind: 'Subscription',
      metadata: { name: subscriptionName, namespace },
      spec: {
        name: packageName,
        channel: 'stable',
        source: this.catalogName,
        sourceNamespace: this.catalogNamespace,
        installPlanApproval: 'Automatic',
      },
    });
    let csvName: string;
    await expect
      .poll(
        async () => {
          const subscription = await this.getSubscription({ subscriptionName, namespace });
          csvName = subscription.status?.installedCSV;
          if (!csvName) {
            return undefined;
          }
          const csv = (await this.client.getCustomResource(
            OLM_GROUP,
            'v1alpha1',
            namespace,
            'clusterserviceversions',
            csvName,
          )) as Resource;
          return csv.status?.phase;
        },
        { timeout: 300_000, message: `${packageName} fixture must install successfully in OLMv0` },
      )
      .toBe('Succeeded');
    await expect
      .poll(
        async () => {
          const subscription = await this.getSubscription({ subscriptionName, namespace });
          const name = subscription.status?.installPlanRef?.name;
          if (!name) return undefined;
          const plan = (await this.client.getCustomResource(
            OLM_GROUP,
            'v1alpha1',
            namespace,
            'installplans',
            name,
          )) as Resource;
          return plan.status?.phase;
        },
        { timeout: 120_000, message: 'The source InstallPlan must finish before migration review' },
      )
      .toBe('Complete');
    const operator = { packageName, subscriptionName, namespace, csvName };
    this.operators.push(operator);
    await this.createOperand(operator, 'before-migration');
    return operator;
  }

  /** Creates and tracks a separate namespace for cross-namespace operand checks. */
  async createOperandNamespace(): Promise<string> {
    const namespace = `migration-operands-${this.suffix}`;
    this.cleanup.trackNamespace(namespace);
    await this.client.createNamespace(namespace, undefined, { runLevelZero: false });
    await this.client.waitForNamespaceReady(namespace);
    return namespace;
  }

  /** Creates a fixture Workload and waits for its controller to produce an available Deployment. */
  async createOperand(
    operator: MigrationOperator,
    name: string,
    namespace = operator.namespace,
  ): Promise<void> {
    const group = `${operator.packageName}.migration-fixtures.console.openshift.io`;
    await this.client.createCustomResource(group, 'v1alpha1', namespace, 'workloads', {
      apiVersion: `${group}/v1alpha1`,
      kind: 'Workload',
      metadata: { name, namespace },
      spec: {},
    });
    await expect
      .poll(
        async () => {
          try {
            const deployment = await this.client.appsV1Api.readNamespacedDeployment({
              name,
              namespace,
            });
            return deployment.status?.availableReplicas;
          } catch (error) {
            if (isNotFound(error)) {
              return 0;
            }
            throw error;
          }
        },
        { timeout: 120_000, message: 'Fixture controller must reconcile the operand' },
      )
      .toBe(1);
  }

  /** Reads the operator's source Subscription using the real Kubernetes client. */
  async getSubscription(
    operator: Pick<MigrationOperator, 'subscriptionName' | 'namespace'>,
  ): Promise<Resource> {
    return this.client.getCustomResource(
      OLM_GROUP,
      'v1alpha1',
      operator.namespace,
      'subscriptions',
      operator.subscriptionName,
    ) as Promise<Resource>;
  }

  /** Reads the source CSV recorded when the fixture operator was installed. */
  async getCSV(operator: MigrationOperator): Promise<Resource> {
    return this.client.getCustomResource(
      OLM_GROUP,
      'v1alpha1',
      operator.namespace,
      'clusterserviceversions',
      operator.csvName,
    ) as Promise<Resource>;
  }

  /** Reads the cluster-scoped target named for the fixture Subscription. */
  async getExtension(operator: MigrationOperator): Promise<Resource> {
    return this.client.getClusterCustomResource(
      TARGET_GROUP,
      'v1',
      'clusterextensions',
      operator.subscriptionName,
    ) as Promise<Resource>;
  }

  /** Declares an unavailable dependency on the real installed fixture CSV. */
  async declareMissingDependency(operator: MigrationOperator): Promise<void> {
    const csv = await this.getCSV(operator);
    const annotation = 'operatorframework.io/properties';
    const existing: unknown[] | { properties?: unknown[] } = JSON.parse(
      csv.metadata.annotations?.[annotation] || '[]',
    );
    const properties = Array.isArray(existing) ? existing : (existing.properties ?? []);
    const dependency = {
      packageName: `missing-dependency-${this.suffix}`,
      versionRange: '>=1.0.0',
    };
    const encoded = JSON.stringify({
      properties: [...properties, { type: 'olm.package.required', value: dependency }],
    });
    await this.client.patchCustomResource(
      OLM_GROUP,
      'v1alpha1',
      operator.namespace,
      'clusterserviceversions',
      operator.csvName,
      [
        {
          op: 'add',
          path: '/metadata/annotations/operatorframework.io~1properties',
          value: encoded,
        },
      ],
    );
    expect((await this.getCSV(operator)).metadata.annotations?.[annotation]).toBe(encoded);
  }

  /** Breaks the fixture controller's image and waits for actual OLM health degradation. */
  async makeCSVUnhealthy(operator: MigrationOperator): Promise<void> {
    const image = 'registry.invalid/console-migration/unavailable:0';
    // Recreate removes the old ready controller instead of leaving it available
    // while a rolling update waits forever for the broken image.
    await this.client.patchCustomResource(
      OLM_GROUP,
      'v1alpha1',
      operator.namespace,
      'clusterserviceversions',
      operator.csvName,
      [
        {
          op: 'add',
          path: '/spec/install/spec/deployments/0/spec/strategy',
          value: { type: 'Recreate' },
        },
        {
          op: 'replace',
          path: '/spec/install/spec/deployments/0/spec/template/spec/containers/0/image',
          value: image,
        },
      ],
    );
    // Keep the CSV strategy and actual Deployment consistent so OLM cannot
    // repair the injected fault before eligibility is reviewed.
    await this.client.patchDeployment(operator.packageName, operator.namespace, [
      { op: 'add', path: '/spec/strategy', value: { type: 'Recreate' } },
      { op: 'replace', path: '/spec/template/spec/containers/0/image', value: image },
    ]);
    await expect
      .poll(
        async () => {
          const pods = await this.client.coreV1Api.listNamespacedPod({
            namespace: operator.namespace,
            labelSelector: `app=${operator.packageName}`,
          });
          return pods.items.some(({ status }) =>
            status?.containerStatuses?.some(({ state }) =>
              ['ErrImagePull', 'ImagePullBackOff'].includes(state?.waiting?.reason),
            ),
          );
        },
        { timeout: 180_000, message: 'Fixture controller must fail to pull its image' },
      )
      .toBe(true);
    await expect
      .poll(
        async () => {
          const phase = (await this.getCSV(operator)).status?.phase;
          return Boolean(phase && phase !== 'Succeeded');
        },
        {
          timeout: 300_000,
          message: 'OLM must report the broken fixture CSV as unhealthy',
        },
      )
      .toBe(true);
  }

  /** Samples control-plane handover and controller readiness; this does not measure reconciliation latency. */
  async withHandoverObservations(
    operator: MigrationOperator,
    action: () => Promise<void>,
  ): Promise<void> {
    const started = performance.now();
    const samples: {
      elapsedMs: number;
      sourceCSVPresent: boolean;
      targetInstalled: boolean;
      readyControllerPods: number;
    }[] = [];
    /** Records source presence, target installation, and controller readiness for handover evidence. */
    const sample = async () => {
      /** Treats an absent migration resource as a missing sample while propagating other API errors. */
      const present = async (get: () => Promise<Resource>): Promise<Resource | undefined> => {
        try {
          return await get();
        } catch (error) {
          if (isNotFound(error)) return undefined;
          throw error;
        }
      };
      const [csv, extension, pods] = await Promise.all([
        present(() => this.getCSV(operator)),
        present(() => this.getExtension(operator)),
        this.client.coreV1Api.listNamespacedPod({
          namespace: operator.namespace,
          labelSelector: `app=${operator.packageName}`,
        }),
      ]);
      samples.push({
        elapsedMs: Math.round(performance.now() - started),
        sourceCSVPresent: Boolean(csv),
        targetInstalled: Boolean(
          extension?.status?.conditions?.some(
            ({ type, status }) => type === 'Installed' && status === 'True',
          ),
        ),
        readyControllerPods: pods.items.filter(({ status }) =>
          status?.conditions?.some(
            ({ type, status: value }) => type === 'Ready' && value === 'True',
          ),
        ).length,
      });
    };
    await sample();
    expect(samples[0].sourceCSVPresent).toBe(true);
    expect(samples[0].readyControllerPods).toBeGreaterThan(0);
    let finished = false;
    let samplingError: unknown;
    /** Samples controller handover while the measured action runs. */
    const monitor = async () => {
      while (!finished) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        if (!finished) await sample();
      }
    };
    const monitoring = monitor().catch((error: unknown) => {
      samplingError = error;
    });
    try {
      await action();
    } finally {
      finished = true;
      await monitoring;
      await sample();
      const lastSource = [...samples].reverse().find(({ sourceCSVPresent }) => sourceCSVPresent);
      const firstTarget = samples.find(({ targetInstalled }) => targetInstalled);
      await base.info().attach('operator-migration-handover.json', {
        body: JSON.stringify(
          {
            operator: `${operator.namespace}/${operator.subscriptionName}`,
            sampleIntervalMs: 1000,
            // Time from the last observed CSV to the first observed Installed target.
            // This is not a measurement of controller reconciliation downtime.
            sampledHandoverIntervalMs:
              firstTarget && lastSource
                ? Math.max(0, firstTarget.elapsedMs - lastSource.elapsedMs)
                : undefined,
            samples,
          },
          null,
          2,
        ),
        contentType: 'application/json',
      });
    }
    if (samplingError) throw samplingError;
    expect(samples[samples.length - 1].sourceCSVPresent).toBe(false);
    expect(samples[samples.length - 1].targetInstalled).toBe(true);
    expect(samples[samples.length - 1].readyControllerPods).toBeGreaterThan(0);
  }

  /** Verifies an installed target, source management removal, and fresh operand reconciliation. */
  async expectMigrated(operator: MigrationOperator): Promise<void> {
    await expect
      .poll(
        async () => {
          const extension = (await this.client.getClusterCustomResource(
            TARGET_GROUP,
            'v1',
            'clusterextensions',
            operator.subscriptionName,
          )) as Resource;
          return extension.status?.conditions?.some(
            ({ type, status }) => type === 'Installed' && status === 'True',
          );
        },
        { timeout: 300_000 },
      )
      .toBe(true);
    const extension = (await this.client.getClusterCustomResource(
      TARGET_GROUP,
      'v1',
      'clusterextensions',
      operator.subscriptionName,
    )) as Resource;
    expect(extension.spec?.namespace).toBe(operator.namespace);
    expect(extension.spec?.source?.catalog?.packageName).toBe(operator.packageName);
    await this.expectAbsent(
      OLM_GROUP,
      'v1alpha1',
      'subscriptions',
      operator.subscriptionName,
      operator.namespace,
    );
    await this.expectAbsent(
      OLM_GROUP,
      'v1alpha1',
      'clusterserviceversions',
      operator.csvName,
      operator.namespace,
    );
    await this.createOperand(operator, `after-migration-${randomUUID().slice(0, 8)}`);
  }

  /** Waits until the specified namespaced or cluster-scoped resource is deleted. */
  async expectAbsent(
    group: string,
    version: string,
    plural: string,
    name: string,
    namespace?: string,
  ): Promise<void> {
    await expect
      .poll(
        async () => {
          try {
            if (namespace) {
              await this.client.getCustomResource(group, version, namespace, plural, name);
            } else {
              await this.client.getClusterCustomResource(group, version, plural, name);
            }
            return false;
          } catch (error) {
            if (isNotFound(error)) {
              return true;
            }
            throw error;
          }
        },
        { timeout: 60_000, message: `${plural}/${name} must be removed` },
      )
      .toBe(true);
  }

  /** Waits for healthy Classic management and confirms target revisions and reference Secrets are removed. */
  async expectRecovered(operator: MigrationOperator): Promise<void> {
    await expect
      .poll(
        async () => {
          const sub = await this.getSubscription(operator);
          if (!sub.status?.installedCSV) {
            return undefined;
          }
          const csv = (await this.client.getCustomResource(
            OLM_GROUP,
            'v1alpha1',
            operator.namespace,
            'clusterserviceversions',
            sub.status.installedCSV,
          )) as Resource;
          return csv.status?.phase;
        },
        { timeout: 300_000 },
      )
      .toBe('Succeeded');
    await this.expectAbsent(TARGET_GROUP, 'v1', 'clusterextensions', operator.subscriptionName);
    await expect
      .poll(
        async () => {
          const labelSelector = `olm.operatorframework.io/owner-name=${operator.subscriptionName}`;
          const revisions = (await this.client.customObjectsApi.listClusterCustomObject({
            group: TARGET_GROUP,
            version: 'v1',
            plural: 'clusterobjectsets',
            labelSelector,
          })) as { items: Resource[] };
          const references = await this.client.coreV1Api.listSecretForAllNamespaces({
            labelSelector,
          });
          return { revisions: revisions.items.length, references: references.items.length };
        },
        {
          timeout: 60_000,
          message: 'Recovery must remove all migration revisions and reference Secrets',
        },
      )
      .toEqual({ revisions: 0, references: 0 });
  }

  /** Verifies retained migration resources and reconciliation, including an archived handover revision. */
  async expectPreservedMigration(operator: MigrationOperator): Promise<void> {
    await expect(async () => {
      const objectSet = (await this.client.getClusterCustomResource(
        TARGET_GROUP,
        'v1',
        'clusterobjectsets',
        `${operator.subscriptionName}-1`,
      )) as Resource;
      const ready = objectSet.status?.conditions?.find(({ type }) => type === 'Ready');
      const succeeded = objectSet.status?.conditions?.find(({ type }) => type === 'Succeeded');
      const available = objectSet.status?.conditions?.find(({ type }) => type === 'Available');
      if (objectSet.spec?.lifecycleState === 'Archived') {
        // An archived revision no longer reports readiness. Require recorded
        // rollout completion and an installed extension before accepting it.
        if (ready) {
          expect(ready.reason).toBe('Archived');
          expect(['False', 'Unknown']).toContain(ready.status);
          expect(objectSet.status.completedAt).toBeTruthy();
        } else {
          expect(succeeded?.status).toBe('True');
          expect(available).toMatchObject({ status: 'Unknown', reason: 'Archived' });
        }
        const extension = await this.getExtension(operator);
        expect(extension.status?.conditions?.find(({ type }) => type === 'Installed')?.status).toBe(
          'True',
        );
      } else {
        if (ready) {
          expect(ready.status).toBe('True');
          expect(ready.observedGeneration).toBe(objectSet.metadata.generation);
        } else {
          expect(succeeded?.status).toBe('True');
          expect(available?.status).toBe('True');
        }
      }
    }).toPass({ timeout: 120_000 });
    const secrets = await this.client.coreV1Api.listSecretForAllNamespaces({
      labelSelector: `olm.operatorframework.io/owner-name=${operator.subscriptionName}`,
    });
    expect(secrets.items.length).toBeGreaterThan(0);
    // The controller must still reconcile while the failed handoff awaits explicit recovery.
    await this.createOperand(operator, `after-halted-migration-${randomUUID().slice(0, 8)}`);
  }

  /** Asserts operand pod identities, readiness, and restart counts remain stable throughout an action. */
  async withOperandContinuity(
    operators: Pick<MigrationOperator, 'namespace'>[],
    action: () => Promise<void>,
  ): Promise<void> {
    /** Reads operand pod identities and readiness across the monitored namespaces. */
    const snapshot = async () =>
      Promise.all(
        operators.map(async ({ namespace }) => {
          const pods = await this.client.coreV1Api.listNamespacedPod({
            namespace,
            labelSelector: 'app=before-migration',
          });
          return pods.items.map(({ metadata, status }) => ({
            uid: metadata.uid,
            phase: status?.phase,
            ready: status?.conditions?.some(
              (condition) => condition.type === 'Ready' && condition.status === 'True',
            ),
            restarts: status?.containerStatuses?.map(({ restartCount }) => restartCount),
          }));
        }),
      );
    const original = await snapshot();
    original.forEach((pods) => {
      expect(pods).toHaveLength(1);
      expect(pods[0].ready).toBe(true);
    });
    const observations: Awaited<ReturnType<typeof snapshot>>[] = [];
    let finished = false;
    let monitoringError: unknown;
    /** Checks operand continuity repeatedly until the protected action finishes. */
    const monitor = async () => {
      while (!finished) {
        observations.push(await snapshot());
        // Sample workload readiness throughout the migration, rather than only at its end.
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    };
    const monitoring = monitor().catch((error: unknown) => {
      monitoringError = error;
    });
    try {
      await action();
    } finally {
      finished = true;
      await monitoring;
    }
    if (monitoringError) {
      throw monitoringError;
    }
    observations.push(await snapshot());
    observations.forEach((observation) => expect(observation).toEqual(original));
  }

  /** Records actual controller responses to new CRs without starting extra probe pods. */
  async withReconciliationObservations(
    operator: MigrationOperator,
    namespace: string,
    action: () => Promise<void>,
  ): Promise<void> {
    const observations: {
      workload: string;
      requestedAt: string;
      reconciledAt: string;
      latencyMs: number;
    }[] = [];
    const group = `${operator.packageName}.migration-fixtures.console.openshift.io`;
    let finished = false;
    let monitoringError: unknown;
    let nextProbe = 0;
    /** Creates a zero-replica Workload and records when its Deployment is reconciled. */
    const probe = async () => {
      const name = `reconciliation-probe-${nextProbe++}`;
      const workload = (await this.client.createCustomResource(
        group,
        'v1alpha1',
        namespace,
        'workloads',
        {
          apiVersion: `${group}/v1alpha1`,
          kind: 'Workload',
          metadata: { name, namespace },
          spec: { enabled: false },
        },
      )) as Resource;
      let reconciledAt: string;
      await expect
        .poll(
          async () => {
            try {
              const deployment = await this.client.appsV1Api.readNamespacedDeployment({
                name,
                namespace,
              });
              reconciledAt = deployment.metadata.creationTimestamp?.toISOString();
              return Boolean(reconciledAt);
            } catch (error) {
              if (isNotFound(error)) return false;
              throw error;
            }
          },
          { timeout: 120_000, message: 'The controller must reconcile a workload during handover' },
        )
        .toBe(true);
      const requestedAt = workload.metadata.creationTimestamp;
      expect(requestedAt).toBeTruthy();
      observations.push({
        workload: name,
        requestedAt,
        reconciledAt,
        latencyMs: Date.parse(reconciledAt) - Date.parse(requestedAt),
      });
    };
    await probe();
    /** Runs reconciliation probes while the measured migration or recovery action executes. */
    const monitor = async () => {
      while (!finished) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        if (!finished) await probe();
      }
    };
    const monitoring = monitor().catch((error: unknown) => {
      monitoringError = error;
    });
    try {
      await action();
    } finally {
      finished = true;
      await monitoring;
      await probe();
      await base.info().attach('operator-migration-reconciliation.json', {
        body: JSON.stringify(
          {
            operator: `${operator.namespace}/${operator.subscriptionName}`,
            operandNamespace: namespace,
            // CR-to-Deployment latency includes polling and API scheduling; it is not exact downtime.
            maximumObservedLatencyMs: Math.max(...observations.map(({ latencyMs }) => latencyMs)),
            observations,
          },
          null,
          2,
        ),
        contentType: 'application/json',
      });
    }
    if (monitoringError) throw monitoringError;
    expect(observations.length).toBeGreaterThanOrEqual(2);
  }

  /** Injects a failed final target update after the ClusterExtension is already installed. */
  async denyInstalledMigration(operator: MigrationOperator): Promise<() => Promise<void>> {
    const name = `migration-cleanup-${this.suffix}`;
    const probeName = `${name}-probe`;
    this.cleanup.trackClusterCustomResource(probeName, TARGET_GROUP, 'v1', 'clusterextensions');
    await this.client.createClusterCustomResource(TARGET_GROUP, 'v1', 'clusterextensions', {
      apiVersion: `${TARGET_GROUP}/v1`,
      kind: 'ClusterExtension',
      metadata: { name: probeName },
      spec: {
        namespace: operator.namespace,
        source: {
          sourceType: 'Catalog',
          catalog: {
            packageName: operator.packageName,
            version: '99.0.0',
            selector: {
              matchLabels: { 'olm.operatorframework.io/metadata.name': this.catalogName },
            },
          },
        },
      },
    });
    try {
      return await this.createAdmissionFailure(
        name,
        TARGET_GROUP,
        'clusterextensions',
        'UPDATE',
        `!(object.metadata.name in ['${operator.subscriptionName}', '${probeName}']) || !has(object.metadata.annotations) || !('console.openshift.io/operator-migration-checkpoint' in object.metadata.annotations)`,
        'Console migration fixture: installed target failure',
        () =>
          this.client.customObjectsApi.patchClusterCustomObject({
            group: TARGET_GROUP,
            version: 'v1',
            plural: 'clusterextensions',
            name: probeName,
            dryRun: 'All',
            body: [
              {
                op: 'add',
                path: '/metadata/annotations',
                value: { 'console.openshift.io/operator-migration-checkpoint': 'fixture-probe' },
              },
            ],
          }),
      );
    } finally {
      await this.client.deleteClusterCustomResource(
        TARGET_GROUP,
        'v1',
        'clusterextensions',
        probeName,
      );
      await this.expectAbsent(TARGET_GROUP, 'v1', 'clusterextensions', probeName);
    }
  }

  /** Denies only this failed target's deletion so the UI can exercise failed recovery and retry. */
  async denyRollback(operator: MigrationOperator): Promise<() => Promise<void>> {
    return this.createAdmissionFailure(
      `rollback-failure-${this.suffix}`,
      TARGET_GROUP,
      'clusterextensions',
      'DELETE',
      `oldObject.metadata.name != '${operator.subscriptionName}'`,
      'Console migration fixture: rollback deletion denied',
      () =>
        this.client.customObjectsApi.deleteClusterCustomObject({
          group: TARGET_GROUP,
          version: 'v1',
          plural: 'clusterextensions',
          name: operator.subscriptionName,
          dryRun: 'All',
        }),
    );
  }

  /** Installs a fixture-scoped denial, verifies propagation, and returns a release callback. */
  private async createAdmissionFailure(
    name: string,
    group: string,
    resource: string,
    operation: 'UPDATE' | 'DELETE',
    expression: string,
    message: string,
    probe: () => Promise<unknown>,
  ): Promise<() => Promise<void>> {
    for (const plural of ['validatingadmissionpolicies', 'validatingadmissionpolicybindings'])
      this.cleanup.trackClusterCustomResource(name, 'admissionregistration.k8s.io', 'v1', plural);
    await this.client.createClusterCustomResource(
      'admissionregistration.k8s.io',
      'v1',
      'validatingadmissionpolicies',
      {
        apiVersion: 'admissionregistration.k8s.io/v1',
        kind: 'ValidatingAdmissionPolicy',
        metadata: { name },
        spec: {
          failurePolicy: 'Fail',
          matchConstraints: {
            resourceRules: [
              {
                apiGroups: [group],
                apiVersions: ['v1'],
                operations: [operation],
                resources: [resource],
              },
            ],
          },
          validations: [{ expression, message }],
        },
      },
    );
    await this.client.createClusterCustomResource(
      'admissionregistration.k8s.io',
      'v1',
      'validatingadmissionpolicybindings',
      {
        apiVersion: 'admissionregistration.k8s.io/v1',
        kind: 'ValidatingAdmissionPolicyBinding',
        metadata: { name },
        spec: { policyName: name, validationActions: ['Deny'] },
      },
    );
    await expect
      .poll(
        async () => {
          try {
            await probe();
            return false;
          } catch (error) {
            return String(error).includes(message);
          }
        },
        { timeout: 60_000, message: 'The fixture admission failure must be active' },
      )
      .toBe(true);
    return async () => {
      await this.client.deleteClusterCustomResource(
        'admissionregistration.k8s.io',
        'v1',
        'validatingadmissionpolicybindings',
        name,
      );
      await this.client.deleteClusterCustomResource(
        'admissionregistration.k8s.io',
        'v1',
        'validatingadmissionpolicies',
        name,
      );
      await expect(async () => {
        try {
          await probe();
        } catch (error) {
          if (!isNotFound(error)) throw error;
        }
      }).toPass({ timeout: 60_000 });
    };
  }

  /** Holds acknowledged recovery at asynchronous target deletion, without replacing API responses. */
  async holdRollback(operator: MigrationOperator): Promise<() => Promise<void>> {
    const finalizer = 'console.openshift.io/migration-fixture-hold';
    /** Removes only the fixture finalizer with optimistic updates and tolerates an already deleted target. */
    const release = async () => {
      await expect(async () => {
        try {
          const current = await this.getExtension(operator);
          await this.client.patchClusterCustomResource(
            TARGET_GROUP,
            'v1',
            'clusterextensions',
            operator.subscriptionName,
            {
              metadata: {
                resourceVersion: current.metadata.resourceVersion,
                finalizers:
                  current.metadata.finalizers?.filter((value) => value !== finalizer) || [],
              },
            },
          );
        } catch (error) {
          if (!isNotFound(error)) throw error;
        }
      }).toPass({ timeout: 60_000 });
      this.rollbackHolds.delete(release);
    };
    this.rollbackHolds.add(release);
    await expect(async () => {
      const extension = await this.getExtension(operator);
      await this.client.patchClusterCustomResource(
        TARGET_GROUP,
        'v1',
        'clusterextensions',
        operator.subscriptionName,
        {
          metadata: {
            resourceVersion: extension.metadata.resourceVersion,
            finalizers: [
              ...(extension.metadata.finalizers || []).filter((value) => value !== finalizer),
              finalizer,
            ],
          },
        },
      );
    }).toPass({ timeout: 60_000 });
    return release;
  }

  /** Confirms target deletion is pending and Classic management has not restarted. */
  async expectHeldRollback(operator: MigrationOperator): Promise<void> {
    await expect
      .poll(async () => Boolean((await this.getExtension(operator)).metadata.deletionTimestamp), {
        timeout: 120_000,
        message: 'Recovery must wait for target deletion before restoring Classic management',
      })
      .toBe(true);
    await this.expectAbsent(
      OLM_GROUP,
      'v1alpha1',
      'subscriptions',
      operator.subscriptionName,
      operator.namespace,
    );
  }

  /** Creates and tracks a second manager to exercise the real dual-management blocker. */
  async createConflict(operator: MigrationOperator): Promise<void> {
    await this.client.createClusterCustomResource(TARGET_GROUP, 'v1', 'clusterextensions', {
      apiVersion: `${TARGET_GROUP}/v1`,
      kind: 'ClusterExtension',
      metadata: {
        name: operator.subscriptionName,
        annotations: {
          'olm.operatorframework.io/migrated-from-subscription': `${operator.namespace}/${operator.subscriptionName}`,
        },
      },
      // An unavailable version prevents the fixture CE from installing a second controller.
      spec: {
        namespace: operator.namespace,
        source: {
          sourceType: 'Catalog',
          catalog: {
            packageName: operator.packageName,
            version: '99.0.0',
            channels: ['stable'],
            selector: {
              matchLabels: { 'olm.operatorframework.io/metadata.name': this.catalogName },
            },
          },
        },
      },
    });
  }

  /** Denies a fixture CSV deletion or target creation and returns policy cleanup after propagation checks. */
  async denyMigration(
    operator: MigrationOperator,
    outcome: 'recover' | 'halt',
  ): Promise<() => Promise<void>> {
    const name = `migration-failure-${this.suffix}-${outcome}`;
    const resource = outcome === 'recover' ? 'clusterserviceversions' : 'clusterextensions';
    const group = outcome === 'recover' ? OLM_GROUP : TARGET_GROUP;
    const objectName = outcome === 'recover' ? operator.csvName : operator.subscriptionName;
    this.cleanup.trackClusterCustomResource(
      name,
      'admissionregistration.k8s.io',
      'v1',
      'validatingadmissionpolicybindings',
    );
    this.cleanup.trackClusterCustomResource(
      name,
      'admissionregistration.k8s.io',
      'v1',
      'validatingadmissionpolicies',
    );
    await this.client.createClusterCustomResource(
      'admissionregistration.k8s.io',
      'v1',
      'validatingadmissionpolicies',
      {
        apiVersion: 'admissionregistration.k8s.io/v1',
        kind: 'ValidatingAdmissionPolicy',
        metadata: { name },
        spec: {
          failurePolicy: 'Fail',
          matchConstraints: {
            resourceRules: [
              {
                apiGroups: [group],
                apiVersions: [outcome === 'recover' ? 'v1alpha1' : 'v1'],
                operations: [outcome === 'recover' ? 'DELETE' : 'CREATE'],
                resources: [resource],
              },
            ],
          },
          validations: [
            {
              expression:
                outcome === 'recover'
                  ? `oldObject.metadata.name != '${objectName}' || request.namespace != '${operator.namespace}'`
                  : `object.metadata.name != '${objectName}'`,
              message: `Console migration fixture: ${outcome} failure`,
            },
          ],
        },
      },
    );
    await this.client.createClusterCustomResource(
      'admissionregistration.k8s.io',
      'v1',
      'validatingadmissionpolicybindings',
      {
        apiVersion: 'admissionregistration.k8s.io/v1',
        kind: 'ValidatingAdmissionPolicyBinding',
        metadata: { name },
        spec: { policyName: name, validationActions: ['Deny'] },
      },
    );
    // Admission configuration propagates asynchronously. Probe with a server-side dry run
    // so the intended failure is active before the admin starts migration.
    await expect
      .poll(
        async () => {
          try {
            if (outcome === 'recover') {
              await this.client.customObjectsApi.deleteNamespacedCustomObject({
                group: OLM_GROUP,
                version: 'v1alpha1',
                plural: resource,
                namespace: operator.namespace,
                name: objectName,
                dryRun: 'All',
              });
            } else {
              await this.client.customObjectsApi.createClusterCustomObject({
                group: TARGET_GROUP,
                version: 'v1',
                plural: resource,
                dryRun: 'All',
                body: {
                  apiVersion: `${TARGET_GROUP}/v1`,
                  kind: 'ClusterExtension',
                  metadata: { name: objectName },
                  spec: {
                    namespace: operator.namespace,
                    source: {
                      sourceType: 'Catalog',
                      catalog: { packageName: operator.packageName },
                    },
                  },
                },
              });
            }
            return false;
          } catch (error) {
            return String(error).includes(`Console migration fixture: ${outcome} failure`);
          }
        },
        { timeout: 60_000, message: 'Fixture failure policy must be active' },
      )
      .toBe(true);
    return async () => {
      await this.client.deleteClusterCustomResource(
        'admissionregistration.k8s.io',
        'v1',
        'validatingadmissionpolicybindings',
        name,
      );
      await this.client.deleteClusterCustomResource(
        'admissionregistration.k8s.io',
        'v1',
        'validatingadmissionpolicies',
        name,
      );
      if (outcome === 'recover') {
        await expect(async () => {
          await this.client.customObjectsApi.deleteNamespacedCustomObject({
            group: OLM_GROUP,
            version: 'v1alpha1',
            plural: resource,
            namespace: operator.namespace,
            name: objectName,
            dryRun: 'All',
          });
        }).toPass({ timeout: 60_000 });
      }
    };
  }

  /** Validates a generated job ID and tracks its persistence namespace for cleanup. */
  trackMigrationJob(id: string): void {
    if (!/^[a-f0-9]{32}$/.test(id)) throw new Error('Console returned an invalid migration job ID');
    // Namespace ownership also removes the journal, index, delegated account, and RBAC.
    this.jobs.add(id);
    this.cleanup.trackNamespace(`console-olm-migration-${id}`);
  }

  /** Denies fixture target status updates until the returned release callback removes the policy. */
  async holdMigration(operator: MigrationOperator): Promise<() => Promise<void>> {
    const name = `migration-hold-${this.suffix}`;
    const probeName = `${name}-probe`;
    for (const plural of ['validatingadmissionpolicies', 'validatingadmissionpolicybindings']) {
      this.cleanup.trackClusterCustomResource(name, 'admissionregistration.k8s.io', 'v1', plural);
    }
    this.cleanup.trackClusterCustomResource(probeName, TARGET_GROUP, 'v1', 'clusterextensions');
    await this.client.createClusterCustomResource(
      'admissionregistration.k8s.io',
      'v1',
      'validatingadmissionpolicies',
      {
        apiVersion: 'admissionregistration.k8s.io/v1',
        kind: 'ValidatingAdmissionPolicy',
        metadata: { name },
        spec: {
          failurePolicy: 'Fail',
          matchConstraints: {
            resourceRules: [
              {
                apiGroups: [TARGET_GROUP],
                apiVersions: ['v1'],
                operations: ['UPDATE'],
                resources: ['clusterextensions/status'],
              },
            ],
          },
          validations: [
            {
              expression: `!(object.metadata.name in ['${operator.subscriptionName}', '${probeName}'])`,
              message: 'Console migration fixture: hold status',
            },
          ],
        },
      },
    );
    await this.client.createClusterCustomResource(
      'admissionregistration.k8s.io',
      'v1',
      'validatingadmissionpolicybindings',
      {
        apiVersion: 'admissionregistration.k8s.io/v1',
        kind: 'ValidatingAdmissionPolicyBinding',
        metadata: { name },
        spec: { policyName: name, validationActions: ['Deny'] },
      },
    );
    await this.client.createClusterCustomResource(TARGET_GROUP, 'v1', 'clusterextensions', {
      apiVersion: `${TARGET_GROUP}/v1`,
      kind: 'ClusterExtension',
      metadata: { name: probeName },
      spec: {
        namespace: operator.namespace,
        source: {
          sourceType: 'Catalog',
          catalog: {
            packageName: operator.packageName,
            version: '99.0.0',
            selector: {
              matchLabels: { 'olm.operatorframework.io/metadata.name': this.catalogName },
            },
          },
        },
      },
    });
    await expect
      .poll(
        async () => {
          try {
            await this.client.customObjectsApi.patchClusterCustomObjectStatus({
              group: TARGET_GROUP,
              version: 'v1',
              plural: 'clusterextensions',
              name: probeName,
              dryRun: 'All',
              body: [{ op: 'add', path: '/status', value: { conditions: [] } }],
            });
            return false;
          } catch (error) {
            return String(error).includes('Console migration fixture: hold status');
          }
        },
        {
          timeout: 60_000,
          message: 'The fixture status hold must be active before starting migration',
        },
      )
      .toBe(true);
    await this.client.deleteClusterCustomResource(
      TARGET_GROUP,
      'v1',
      'clusterextensions',
      probeName,
    );
    return async () => {
      await this.client.deleteClusterCustomResource(
        'admissionregistration.k8s.io',
        'v1',
        'validatingadmissionpolicybindings',
        name,
      );
      await this.client.deleteClusterCustomResource(
        'admissionregistration.k8s.io',
        'v1',
        'validatingadmissionpolicies',
        name,
      );
      await this.client.patchClusterCustomResource(
        TARGET_GROUP,
        'v1',
        'clusterextensions',
        operator.subscriptionName,
        {
          metadata: {
            annotations: { 'console.openshift.io/fixture-release': new Date().toISOString() },
          },
        },
      );
    };
  }

  /** Waits for a created target that has not yet reported installation success. */
  async expectHeldMigration(operator: MigrationOperator): Promise<void> {
    await expect
      .poll(
        async () => {
          try {
            const extension = (await this.client.getClusterCustomResource(
              TARGET_GROUP,
              'v1',
              'clusterextensions',
              operator.subscriptionName,
            )) as Resource;
            return extension.status?.conditions?.some(
              ({ type, status }) => type === 'Installed' && status === 'True',
            )
              ? 'finished'
              : 'held';
          } catch (error) {
            if (isNotFound(error)) return 'not-created';
            throw error;
          }
        },
        {
          timeout: 180_000,
          message: 'The real migration must reach the held target before interruption',
        },
      )
      .toBe('held');
  }

  /** Replaces cluster Console pods and waits for new ready instances with different UIDs. */
  async restartConsolePods(): Promise<void> {
    const pods = await this.client.coreV1Api.listNamespacedPod({
      namespace: 'openshift-console',
      labelSelector: 'app=console',
    });
    expect(pods.items.length).toBeGreaterThan(0);
    const oldUIDs = new Set(pods.items.map(({ metadata }) => metadata.uid));
    for (const pod of pods.items)
      await this.client.deletePod(pod.metadata.name, 'openshift-console');
    await expect
      .poll(
        async () => {
          const replacements = await this.client.coreV1Api.listNamespacedPod({
            namespace: 'openshift-console',
            labelSelector: 'app=console',
          });
          return (
            replacements.items.length >= pods.items.length &&
            replacements.items.every(
              ({ metadata, status }) =>
                !oldUIDs.has(metadata.uid) &&
                status?.conditions?.some(
                  ({ type, status: value }) => type === 'Ready' && value === 'True',
                ),
            )
          );
        },
        { timeout: 300_000, message: 'All Console backend pods must be replaced and ready' },
      )
      .toBe(true);
  }

  /** Removes tracked job namespaces and always releases retained rollback finalizers. */
  async stopMigrationJobs(): Promise<void> {
    try {
      for (const id of this.jobs) {
        await this.client.deleteNamespace(`console-olm-migration-${id}`);
        await this.client.waitForNamespaceDeleted(`console-olm-migration-${id}`, 60_000);
      }
    } finally {
      for (const release of this.rollbackHolds) await release();
    }
  }

  /** Saves API-visible job state before cleanup, without delegated credentials or recovery backups. */
  async attachMigrationJobs(): Promise<void> {
    const jobs = await Promise.all(
      [...this.jobs].map(async (id) => {
        try {
          const secret = await this.client.coreV1Api.readNamespacedSecret({
            name: 'migration',
            namespace: `console-olm-migration-${id}`,
          });
          const record = JSON.parse(
            gunzipSync(Buffer.from(secret.data['job.json.gz'], 'base64'), {
              maxOutputLength: 32 * 1024 * 1024,
            }).toString(),
          ) as { snapshot: unknown };
          return { id, snapshot: record.snapshot };
        } catch (error) {
          return {
            id,
            unavailable: isNotFound(error) ? 'Job was removed' : 'Could not read job state',
          };
        }
      }),
    );
    await base.info().attach('operator-migration-jobs.json', {
      body: JSON.stringify(jobs, null, 2),
      contentType: 'application/json',
    });
  }

  /** Tracks fixture-owned checkpoints, reference Secrets, cluster RBAC, and recovery Leases outside test namespaces. */
  async trackRecoverySecrets(): Promise<void> {
    // Retained recovery data lives outside the test namespace. Track only fixture-owned
    // Secrets so cleanup also handles a halted migration or a failed assertion.
    const leases = (await this.client.customObjectsApi.listClusterCustomObject({
      group: 'coordination.k8s.io',
      version: 'v1',
      plural: 'leases',
    })) as { items?: Resource[] };
    for (const { subscriptionName, csvName, namespace } of this.operators) {
      const ownerHash = createHash('sha256').update(subscriptionName).digest('hex').slice(0, 16);
      // A killed recovery runner may leave its reservation outside the job namespace.
      leases.items
        ?.filter(({ metadata }) => metadata.name === `console-rollback-${ownerHash}`)
        .forEach(({ metadata }) => {
          this.cleanup.trackCustomResource(
            metadata.name,
            metadata.namespace,
            'coordination.k8s.io',
            'v1',
            'leases',
            'Lease',
          );
        });
      // Orphaned migration resources can retain OLMv1 ownership labels after
      // their install namespace is removed. Track our operators' cluster RBAC
      // so a later fixture with the same CSV does not inherit those owners.
      for (const plural of ['clusterroles', 'clusterrolebindings']) {
        for (const labelSelector of [
          `olm.operatorframework.io/owner-name=${subscriptionName}`,
          `olm.owner=${csvName},olm.owner.namespace=${namespace}`,
        ]) {
          const resources = (await this.client.customObjectsApi.listClusterCustomObject({
            group: 'rbac.authorization.k8s.io',
            version: 'v1',
            plural,
            labelSelector,
          })) as { items?: Resource[] };
          resources.items?.forEach(({ metadata }) =>
            this.cleanup.trackClusterCustomResource(
              metadata.name,
              'rbac.authorization.k8s.io',
              'v1',
              plural,
            ),
          );
        }
      }
      for (const labelSelector of [
        `olm.operatorframework.io/owner-name=${subscriptionName}`,
        `console.openshift.io/operator-migration-owner=${ownerHash}`,
      ]) {
        const secrets = await this.client.coreV1Api.listSecretForAllNamespaces({ labelSelector });
        secrets.items.forEach(({ metadata }) =>
          this.cleanup.track({
            name: metadata.name,
            namespace: metadata.namespace,
            apiGroup: '',
            apiVersion: 'v1',
            plural: 'secrets',
            type: 'Secret',
          }),
        );
      }
    }
  }
}

export const test = base.extend<{
  migration: OperatorMigrationFixture;
  migrationPage: OperatorMigrationPage;
}>({
  migrationPage: async ({ page, migration }, use) => {
    const migrationPage = new OperatorMigrationPage(page, (id) => migration.trackMigrationJob(id));
    try {
      await use(migrationPage);
    } finally {
      await migrationPage.restoreColumnVisibility();
    }
  },
  migration: async ({ page, baseURL, k8sClient, cleanup }, use) => {
    const source =
      process.env.OLM_MIGRATION_SOURCE_CATALOG_IMAGE ||
      'ghcr.io/logonoff/ocp-olm-catalog-fixtures:source-main';
    const target =
      process.env.OLM_MIGRATION_TARGET_CATALOG_IMAGE ||
      'ghcr.io/logonoff/ocp-olm-catalog-fixtures:main';
    // Interruption tests disable automatic reauthentication. Their initial
    // storageState can still have expired, so establish the starting session explicitly.
    await loginFromEnv(page, 'admin', baseURL);
    let flags: Window['SERVER_FLAGS'];
    await expect
      .poll(
        async () => {
          flags = await page.evaluate(() => window.SERVER_FLAGS).catch(() => undefined);
          return flags;
        },
        { timeout: 60_000, message: 'Console must load its server flags after login' },
      )
      .toBeDefined();
    base.skip(!flags.techPreview, 'Operator migration requires a Tech Preview console');
    const fixture = new OperatorMigrationFixture(k8sClient, cleanup, flags.authDisabled);
    try {
      await fixture.createCatalogs(source, target);
      await use(fixture);
    } finally {
      try {
        if (base.info().status !== base.info().expectedStatus) await fixture.attachMigrationJobs();
      } finally {
        try {
          await fixture.stopMigrationJobs();
        } finally {
          await fixture.trackRecoverySecrets();
        }
      }
    }
  },
});
