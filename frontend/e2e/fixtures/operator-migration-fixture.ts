import { createHash, randomUUID } from 'crypto';

import type KubernetesClient from '../clients/kubernetes-client';
import { isNotFound } from '../clients/kubernetes-client';
import { OperatorMigrationPage } from '../pages/operator-migration-page';
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
  metadata: { name: string; namespace?: string; uid?: string; resourceVersion?: string };
  spec?: { namespace?: string; source?: { catalog?: { packageName?: string } } };
  status?: {
    installedCSV?: string;
    installPlanRef?: { name: string };
    phase?: string;
    conditions?: { type: string; status: string }[];
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

  constructor(
    private readonly client: KubernetesClient,
    private readonly cleanup: CleanupFixture,
  ) {}

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

  async createOperand(operator: MigrationOperator, name: string): Promise<void> {
    const group = `${operator.packageName}.migration-fixtures.console.openshift.io`;
    await this.client.createCustomResource(group, 'v1alpha1', operator.namespace, 'workloads', {
      apiVersion: `${group}/v1alpha1`,
      kind: 'Workload',
      metadata: { name, namespace: operator.namespace },
      spec: {},
    });
    await expect
      .poll(
        async () => {
          try {
            const deployment = await this.client.appsV1Api.readNamespacedDeployment({
              name,
              namespace: operator.namespace,
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
    await this.createOperand(operator, 'after-migration');
  }

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
  }

  async withOperandContinuity(
    operators: MigrationOperator[],
    action: () => Promise<void>,
  ): Promise<void> {
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

  trackMigrationJob(id: string): void {
    if (!/^[a-f0-9]{32}$/.test(id)) throw new Error('Console returned an invalid migration job ID');
    // Namespace ownership also removes the journal, index, delegated account, and RBAC.
    this.jobs.add(id);
    this.cleanup.trackNamespace(`console-olm-migration-${id}`);
  }

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

  async stopMigrationJobs(): Promise<void> {
    for (const id of this.jobs) {
      await this.client.deleteNamespace(`console-olm-migration-${id}`);
      await this.client.waitForNamespaceDeleted(`console-olm-migration-${id}`, 60_000);
    }
  }

  async trackRecoverySecrets(): Promise<void> {
    // Retained recovery data lives outside the test namespace. Track only fixture-owned
    // Secrets so cleanup also handles a halted migration or a failed assertion.
    for (const { subscriptionName } of this.operators) {
      const ownerHash = createHash('sha256').update(subscriptionName).digest('hex').slice(0, 16);
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
  migration: async ({ page, k8sClient, cleanup }, use) => {
    const source =
      process.env.OLM_MIGRATION_SOURCE_CATALOG_IMAGE ||
      'ghcr.io/logonoff/ocp-olm-catalog-fixtures:source-main';
    const target =
      process.env.OLM_MIGRATION_TARGET_CATALOG_IMAGE ||
      'ghcr.io/logonoff/ocp-olm-catalog-fixtures:main';
    await page.goto('/');
    const techPreview = await page.evaluate(() => window.SERVER_FLAGS.techPreview);
    base.skip(!techPreview, 'Operator migration requires a Tech Preview console');
    const fixture = new OperatorMigrationFixture(k8sClient, cleanup);
    try {
      await fixture.createCatalogs(source, target);
      await use(fixture);
    } finally {
      try {
        await fixture.stopMigrationJobs();
      } finally {
        await fixture.trackRecoverySecrets();
      }
    }
  },
});
