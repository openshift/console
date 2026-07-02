/**
 * Comprehensive cluster cleanup utility for removing orphaned test resources
 * Run this when you have leftover operator installations from interrupted tests
 */

export interface ClusterCleanupOptions {
  dryRun?: boolean;
  targetOperator?: string;
  olderThanMinutes?: number;
}

/**
 * Clean up orphaned test namespaces and operator installations
 */
export async function cleanupClusterTestResources(k8sClient: any, options: ClusterCleanupOptions = {}): Promise<void> {
  const { dryRun = false, targetOperator = 'datagrid', olderThanMinutes = 60 } = options;

  console.log(`\n=== CLUSTER CLEANUP ${dryRun ? '(DRY RUN)' : ''} ===`);
  console.log(`Target operator: ${targetOperator}`);
  console.log(`Older than: ${olderThanMinutes} minutes`);

  const cutoffTime = new Date(Date.now() - (olderThanMinutes * 60 * 1000));

  try {
    // 1. Find all test namespaces
    // Note: KubernetesClient doesn't expose listNamespace, so we'll use kubectl directly
    // This is a limitation of the current client implementation
    console.log('⚠️  KubernetesClient API limitation: using kubectl for namespace listing');

    // For now, clean up known test namespaces by pattern
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execPromise = promisify(exec);

    const { stdout } = await execPromise('kubectl get namespaces --output=json');
    const namespacesData = JSON.parse(stdout);
    const namespaces = namespacesData;
    const testNamespaces = namespaces.items?.filter((ns: any) =>
      ns.metadata.name.startsWith('test-') || ns.metadata.name.startsWith('test-operator-')
    ) || [];

    console.log(`\nFound ${testNamespaces.length} test namespaces:`);
    testNamespaces.forEach((ns: any) => {
      const createdAt = new Date(ns.metadata.creationTimestamp);
      const isOld = createdAt < cutoffTime;
      console.log(`  - ${ns.metadata.name} (created: ${createdAt.toISOString()}) ${isOld ? '⚠️ OLD' : '✅ recent'}`);
    });

    // 2. Clean up operator resources in old test namespaces
    const oldTestNamespaces = testNamespaces.filter((ns: any) => {
      const createdAt = new Date(ns.metadata.creationTimestamp);
      return createdAt < cutoffTime;
    });

    for (const namespace of oldTestNamespaces) {
      const namespaceName = namespace.metadata.name;
      console.log(`\n--- Cleaning namespace: ${namespaceName} ---`);

      // Clean CSVs
      try {
        const csvs = await k8sClient.listCustomResources(
          'operators.coreos.com',
          'v1alpha1',
          namespaceName,
          'clusterserviceversions'
        );

        const targetCSVs = (csvs || []).filter((csv: any) =>
          csv.metadata.name?.includes(targetOperator)
        );

        console.log(`Found ${targetCSVs.length} ${targetOperator} CSVs in ${namespaceName}`);

        for (const csv of targetCSVs) {
          console.log(`  ${dryRun ? 'Would delete' : 'Deleting'} CSV: ${csv.metadata.name}`);
          if (!dryRun) {
            await k8sClient.deleteCustomResource(
              'operators.coreos.com',
              'v1alpha1',
              namespaceName,
              'clusterserviceversions',
              csv.metadata.name
            );
          }
        }
      } catch (error) {
        console.log(`  Error checking CSVs in ${namespaceName}: ${error.message}`);
      }

      // Clean Subscriptions
      try {
        const subscriptions = await k8sClient.listCustomResources(
          'operators.coreos.com',
          'v1alpha1',
          namespaceName,
          'subscriptions'
        );

        const targetSubs = (subscriptions || []).filter((sub: any) =>
          sub.metadata.name?.includes(targetOperator) || sub.spec?.name?.includes(targetOperator)
        );

        console.log(`Found ${targetSubs.length} ${targetOperator} subscriptions in ${namespaceName}`);

        for (const sub of targetSubs) {
          console.log(`  ${dryRun ? 'Would delete' : 'Deleting'} subscription: ${sub.metadata.name}`);
          if (!dryRun) {
            await k8sClient.deleteCustomResource(
              'operators.coreos.com',
              'v1alpha1',
              namespaceName,
              'subscriptions',
              sub.metadata.name
            );
          }
        }
      } catch (error) {
        console.log(`  Error checking subscriptions in ${namespaceName}: ${error.message}`);
      }

      // Clean InstallPlans
      try {
        const installPlans = await k8sClient.listCustomResources(
          'operators.coreos.com',
          'v1alpha1',
          namespaceName,
          'installplans'
        );

        const targetIPs = (installPlans || []).filter((ip: any) => {
          const csvNames = ip.spec?.clusterServiceVersionNames || [];
          return csvNames.some((csvName: string) => csvName.includes(targetOperator));
        });

        console.log(`Found ${targetIPs.length} ${targetOperator} install plans in ${namespaceName}`);

        for (const ip of targetIPs) {
          console.log(`  ${dryRun ? 'Would delete' : 'Deleting'} InstallPlan: ${ip.metadata.name}`);
          if (!dryRun) {
            await k8sClient.deleteCustomResource(
              'operators.coreos.com',
              'v1alpha1',
              namespaceName,
              'installplans',
              ip.metadata.name
            );
          }
        }
      } catch (error) {
        console.log(`  Error checking InstallPlans in ${namespaceName}: ${error.message}`);
      }

      // Clean operand instances (infinispans, backups, etc.)
      const operandTypes = [
        { group: 'infinispan.org', version: 'v1', plural: 'infinispans' },
        { group: 'infinispan.org', version: 'v1', plural: 'backups' },
      ];

      for (const operandType of operandTypes) {
        try {
          const operands = await k8sClient.listCustomResources(
            operandType.group,
            operandType.version,
            namespaceName,
            operandType.plural
          );

          console.log(`Found ${(operands || []).length} ${operandType.plural} in ${namespaceName}`);

          for (const operand of operands || []) {
            console.log(`  ${dryRun ? 'Would delete' : 'Deleting'} ${operandType.plural}: ${operand.metadata.name}`);
            if (!dryRun) {
              await k8sClient.deleteCustomResource(
                operandType.group,
                operandType.version,
                namespaceName,
                operandType.plural,
                operand.metadata.name
              );
            }
          }
        } catch (error) {
          // Ignore - operand type may not exist
        }
      }

      // Delete the entire test namespace if old enough
      console.log(`  ${dryRun ? 'Would delete' : 'Deleting'} namespace: ${namespaceName}`);
      if (!dryRun) {
        try {
          await k8sClient.deleteNamespace(namespaceName);
          console.log(`  ✅ Deleted namespace ${namespaceName}`);
        } catch (error) {
          console.log(`  ❌ Error deleting namespace ${namespaceName}: ${error.message}`);
        }
      }
    }

    console.log(`\n=== CLEANUP COMPLETE ${dryRun ? '(DRY RUN)' : ''} ===`);
    if (dryRun) {
      console.log('Re-run with dryRun: false to actually delete resources');
    }

  } catch (error) {
    console.error('Error during cluster cleanup:', error);
    throw error;
  }
}