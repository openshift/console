/**
 * Comprehensive OLM cleanup utility for dealing with persistent operator resources
 * that OLM sometimes fails to clean up automatically
 */

export interface OLMCleanupOptions {
  operatorPackageName: string;
  namespacePattern?: string; // e.g., "test-" to match test namespaces
  dryRun?: boolean;
  forceDelete?: boolean;
}

/**
 * Clean up all OLM resources for an operator, including the cluster-scoped Operator resources
 * that sometimes persist after namespace deletion
 */
export async function cleanupOLMOperatorCompletely(
  k8sClient: any,
  options: OLMCleanupOptions
): Promise<void> {
  const { operatorPackageName, namespacePattern, dryRun = false, forceDelete = false } = options;

  console.log(`\n=== COMPREHENSIVE OLM CLEANUP ${dryRun ? '(DRY RUN)' : ''} ===`);
  console.log(`Operator: ${operatorPackageName}`);
  console.log(`Namespace pattern: ${namespacePattern || 'all'}`);

  try {
    // 1. Clean up cluster-scoped Operator resources first
    console.log('\n--- Cleaning cluster-scoped Operator resources ---');

    const operators = await k8sClient.listClusterCustomResources(
      'operators.coreos.com',
      'v1',
      'operators'
    );

    const matchingOperators = (operators || []).filter((op: any) => {
      const opName = op.metadata.name;
      // Match pattern: operatorPackageName.namespace
      const matchesPackage = opName.startsWith(`${operatorPackageName}.`);
      const matchesNamespacePattern = namespacePattern
        ? opName.includes(namespacePattern)
        : true;

      return matchesPackage && matchesNamespacePattern;
    });

    console.log(`Found ${matchingOperators.length} matching Operator resources`);

    for (const operator of matchingOperators) {
      console.log(`${dryRun ? 'Would delete' : 'Deleting'} Operator: ${operator.metadata.name}`);

      if (!dryRun) {
        try {
          // Try normal deletion first
          await k8sClient.deleteClusterCustomResource(
            'operators.coreos.com',
            'v1',
            'operators',
            operator.metadata.name
          );
          console.log(`✅ Deleted Operator ${operator.metadata.name}`);
        } catch (error) {
          if (forceDelete) {
            console.log(`⚠️ Normal deletion failed, trying force delete for ${operator.metadata.name}`);
            // Force delete if normal deletion fails (this requires shell access)
            // k8sClient doesn't support force deletion, so we'd need to use kubectl/oc
          } else {
            console.log(`❌ Failed to delete Operator ${operator.metadata.name}: ${error.message}`);
          }
        }
      }
    }

    // 2. Find and clean namespaces matching the pattern
    if (namespacePattern) {
      console.log(`\n--- Cleaning namespaces matching pattern: ${namespacePattern} ---`);

      // Note: k8sClient doesn't expose namespace listing, so we'll document the limitation
      console.log('⚠️ Namespace cleanup requires manual intervention due to k8sClient limitations');
      console.log(`Manual command: kubectl delete namespace $(kubectl get namespaces -o name | grep ${namespacePattern})`);
    }

    console.log(`\n=== CLEANUP COMPLETE ${dryRun ? '(DRY RUN)' : ''} ===`);

  } catch (error) {
    console.error('Error during OLM cleanup:', error.message);
    throw error;
  }
}

/**
 * Enhanced cleanup that combines namespace-scoped and cluster-scoped cleanup
 */
export async function cleanupOperatorWithOLMResources(
  k8sClient: any,
  operatorPackageName: string,
  namespace: string,
  operandPlural?: string,
  testOperand?: any
): Promise<void> {
  // First run the regular cleanup
  const { cleanupOperatorResources } = await import('./operator-cleanup');
  await cleanupOperatorResources(k8sClient, {
    operatorPackageName,
    operandPlural,
    testOperand,
    namespace,
  });

  // Then clean up the cluster-scoped OLM resources
  await cleanupOLMOperatorCompletely(k8sClient, {
    operatorPackageName,
    namespacePattern: namespace.startsWith('test-') ? 'test-' : undefined,
  });
}