import type { TestOperandProps } from '../pages/operator-details-page';

export interface OperatorCleanupOptions {
  operatorPackageName: string;
  operandPlural?: string;
  testOperand?: TestOperandProps;
  namespace: string;
}

/**
 * Quick check if any operator resources exist - if not, skip all the heavy scanning
 */
async function quickOperatorCheck(k8sClient: any, operatorPackageName: string): Promise<boolean> {
  try {
    // Quick check for cluster operator
    const operators = await k8sClient.listClusterCustomResources('operators.coreos.com', 'v1', 'operators');
    const hasOperator = operators.some((op: any) =>
      op.metadata.name?.includes(operatorPackageName) ||
      op.metadata.name?.includes('datagrid') ||
      op.metadata.name === 'datagrid.openshift-operators'
    );

    if (hasOperator) {
      console.log(`🔍 Found existing ${operatorPackageName} operator resources - will clean them up`);
      return true;
    }

    // Quick check just openshift-operators namespace for subscriptions
    try {
      const subscriptions = await k8sClient.listCustomResources('operators.coreos.com', 'v1alpha1', 'openshift-operators', 'subscriptions');
      const hasSubscription = subscriptions.some((sub: any) =>
        sub.metadata.name?.includes(operatorPackageName) ||
        sub.metadata.name?.includes('datagrid')
      );

      if (hasSubscription) {
        console.log(`🔍 Found existing ${operatorPackageName} subscriptions - will clean them up`);
        return true;
      }
    } catch (error) {
      // Ignore errors
    }

    console.log(`✅ No existing ${operatorPackageName} resources found - cleanup not needed`);
    return false;
  } catch (error) {
    console.log(`Error during quick check: ${error.message}`);
    return true; // If we can't check, assume cleanup is needed
  }
}

/**
 * Proper operator cleanup following OpenShift documentation:
 * 1. Find currentCSV from subscription
 * 2. Delete subscription
 * 3. Delete CSV using currentCSV value
 */
export async function cleanupAllOperatorsByPackageName(k8sClient: any, operatorPackageName: string): Promise<void> {
  console.log(`🧹 Checking for ${operatorPackageName} operators to clean up...`);

  // Quick check first - if nothing to clean, skip all the heavy work
  const needsCleanup = await quickOperatorCheck(k8sClient, operatorPackageName);
  if (!needsCleanup) {
    console.log(`✅ No cleanup needed for ${operatorPackageName}`);
    return;
  }

  console.log(`🧹 Starting cleanup of ${operatorPackageName} operators...`);

  try {
    // Get all namespaces
    const namespaces = await k8sClient.listNamespaces();

    for (const namespace of namespaces) {
      const nsName = namespace?.metadata?.name;
      if (!nsName) continue;

      try {
        // List subscriptions in this namespace
        const subscriptions = await k8sClient.listCustomResources(
          'operators.coreos.com',
          'v1alpha1',
          nsName,
          'subscriptions',
        );

        // Find matching subscriptions with broader search
        const matchingSubscriptions = subscriptions.filter((sub: any) => {
          return (
            sub.metadata.name === operatorPackageName ||
            sub.spec?.name === operatorPackageName ||
            sub.metadata.name?.includes('datagrid') ||
            sub.spec?.name?.includes('datagrid')
          );
        });

        for (const subscription of matchingSubscriptions) {
          console.log(`Found subscription ${subscription.metadata.name} in namespace ${nsName}`);

          // Step 1: Get the currentCSV from the subscription
          const currentCSV = subscription.status?.currentCSV;
          if (currentCSV) {
            console.log(`  currentCSV: ${currentCSV}`);
          }

          // Step 2: Delete the subscription
          console.log(`  Deleting subscription ${subscription.metadata.name}`);
          await k8sClient.deleteCustomResource(
            'operators.coreos.com',
            'v1alpha1',
            nsName,
            'subscriptions',
            subscription.metadata.name,
          );

          // Step 3: Delete the CSV using the currentCSV value
          if (currentCSV) {
            try {
              console.log(`  Deleting ClusterServiceVersion ${currentCSV}`);
              await k8sClient.deleteCustomResource(
                'operators.coreos.com',
                'v1alpha1',
                nsName,
                'clusterserviceversions',
                currentCSV,
              );
              console.log(`  ✅ Successfully deleted CSV ${currentCSV}`);
            } catch (csvError) {
              console.log(`  ⚠️ Could not delete CSV ${currentCSV}: ${csvError.message}`);
            }
          } else {
            console.log(`  ⚠️ No currentCSV found for subscription ${subscription.metadata.name}`);
          }
        }
      } catch (error) {
        console.log(`  Error cleaning up namespace ${nsName}: ${error.message}`);
      }
    }

    // Also clean up cluster-scoped Operator resources that can prevent reinstallation
    console.log('🧹 Cleaning up cluster-scoped Operator resources...');
    try {
      const operators = await k8sClient.listClusterCustomResources('operators.coreos.com', 'v1', 'operators');
      const matchingOperators = operators.filter((op: any) =>
        op.metadata.name?.includes(operatorPackageName) ||
        op.spec?.packageName === operatorPackageName ||
        op.metadata.name?.includes('datagrid') ||
        op.metadata.name === 'datagrid.openshift-operators'  // Exact match for the stuck one
      );

      for (const operator of matchingOperators) {
        console.log(`  Deleting cluster Operator: ${operator.metadata.name}`);
        try {
          await k8sClient.deleteClusterCustomResource('operators.coreos.com', 'v1', 'operators', operator.metadata.name);
          console.log(`  ✅ Successfully deleted cluster Operator ${operator.metadata.name}`);
        } catch (error) {
          console.log(`  ⚠️ Could not delete cluster Operator ${operator.metadata.name}: ${error.message}`);
        }
      }
    } catch (error) {
      console.log(`Error cleaning cluster operators: ${error.message}`);
    }

    // Give OLM a moment to clean up any remaining resources
    console.log('Waiting 5 seconds for OLM to clean up remaining resources...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Quick verification that cleanup worked
    const stillExists = await quickOperatorCheck(k8sClient, operatorPackageName);
    if (stillExists) {
      console.log('⚠️ Some operator resources may still exist after cleanup');
    } else {
      console.log('✅ Cleanup verification: no operator resources found');
    }

  } catch (error) {
    console.log('Error during proper operator cleanup:', error.message);
  }

  console.log('✅ cleanupAllOperatorsByPackageName FINISHED');
}

/**
 * Force cleanup for when normal cleanup doesn't work - removes finalizers and force deletes
 */
export async function forceCleanupAllOperatorsByPackageName(k8sClient: any, operatorPackageName: string): Promise<void> {
  console.log(`🔥 Checking if force cleanup is needed for ${operatorPackageName}...`);

  // Quick check first - if nothing to clean, skip the force cleanup
  const needsCleanup = await quickOperatorCheck(k8sClient, operatorPackageName);
  if (!needsCleanup) {
    console.log(`✅ No force cleanup needed for ${operatorPackageName}`);
    return;
  }

  console.log(`🔥 Starting force cleanup of ${operatorPackageName} operators...`);

  try {
    // Force clean cluster-scoped Operator resources
    const operators = await k8sClient.listClusterCustomResources('operators.coreos.com', 'v1', 'operators');
    const matchingOperators = operators.filter((op: any) =>
      op.metadata.name?.includes(operatorPackageName) ||
      op.spec?.packageName === operatorPackageName ||
      op.metadata.name?.includes('datagrid') ||
      op.metadata.name === 'datagrid.openshift-operators'  // Exact match for the stuck one
    );

    for (const operator of matchingOperators) {
      console.log(`🔥 Force deleting cluster Operator: ${operator.metadata.name}`);
      try {
        // Strip finalizers first
        await k8sClient.patchClusterCustomResource(
          'operators.coreos.com',
          'v1',
          'operators',
          operator.metadata.name,
          [{ op: 'replace', path: '/metadata/finalizers', value: [] }]
        );
        console.log(`  Stripped finalizers from ${operator.metadata.name}`);

        // Then delete
        await k8sClient.deleteClusterCustomResource('operators.coreos.com', 'v1', 'operators', operator.metadata.name);
        console.log(`  ✅ Force deleted cluster Operator ${operator.metadata.name}`);
      } catch (error) {
        console.log(`  ⚠️ Could not force delete cluster Operator ${operator.metadata.name}: ${error.message}`);
      }
    }

    // Force clean subscriptions and CSVs in all namespaces
    const namespaces = await k8sClient.listNamespaces();
    for (const namespace of namespaces) {
      const nsName = namespace?.metadata?.name;
      if (!nsName) continue;

      try {
        // Force clean CSVs first
        const csvs = await k8sClient.listCustomResources('operators.coreos.com', 'v1alpha1', nsName, 'clusterserviceversions');
        const matchingCSVs = csvs.filter((csv: any) =>
          csv.metadata.name?.includes('datagrid') ||
          csv.spec?.displayName?.includes('Data Grid')
        );

        for (const csv of matchingCSVs) {
          console.log(`🔥 Force deleting CSV: ${csv.metadata.name} in ${nsName}`);
          try {
            await k8sClient.deleteCustomResource('operators.coreos.com', 'v1alpha1', nsName, 'clusterserviceversions', csv.metadata.name);
            console.log(`  ✅ Force deleted CSV ${csv.metadata.name}`);
          } catch (error) {
            console.log(`  ⚠️ Could not force delete CSV ${csv.metadata.name}: ${error.message}`);
          }
        }

        // Force clean subscriptions
        const subscriptions = await k8sClient.listCustomResources('operators.coreos.com', 'v1alpha1', nsName, 'subscriptions');
        const matchingSubs = subscriptions.filter((sub: any) =>
          sub.metadata.name?.includes('datagrid') ||
          sub.spec?.name?.includes('datagrid')
        );

        for (const subscription of matchingSubs) {
          console.log(`🔥 Force deleting subscription: ${subscription.metadata.name} in ${nsName}`);
          try {
            await k8sClient.deleteCustomResource('operators.coreos.com', 'v1alpha1', nsName, 'subscriptions', subscription.metadata.name);
            console.log(`  ✅ Force deleted subscription ${subscription.metadata.name}`);
          } catch (error) {
            console.log(`  ⚠️ Could not force delete subscription ${subscription.metadata.name}: ${error.message}`);
          }
        }
      } catch (error) {
        // Ignore permission errors
      }
    }

    console.log('Waiting 10 seconds for force cleanup to propagate...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Final verification
    const stillExists = await quickOperatorCheck(k8sClient, operatorPackageName);
    if (stillExists) {
      console.log('⚠️ Some operator resources may still exist after force cleanup');
    } else {
      console.log('✅ Force cleanup verification: no operator resources found');
    }

  } catch (error) {
    console.log('Error during force cleanup:', error.message);
  }

  console.log('🔥 forceCleanupAllOperatorsByPackageName FINISHED');
}

/**
 * Nuclear option - delete CRDs first, then the operator (this was the missing piece!)
 */
export async function deleteStuckDatagridOperator(k8sClient: any): Promise<void> {
  console.log(`💣 Checking for stuck datagrid operator...`);

  // Quick check first
  try {
    await k8sClient.getClusterCustomResource('operators.coreos.com', 'v1', 'operators', 'datagrid.openshift-operators');
    console.log(`💣 Found stuck datagrid operator - starting nuclear cleanup...`);
  } catch (error) {
    if (error.message?.includes('404')) {
      console.log(`✅ No stuck datagrid operator found - nuclear cleanup not needed`);
      return;
    }
  }

  try {
    // STEP 1: Check which infinispan.org CRDs actually exist and delete them
    console.log('Checking for infinispan.org CRDs...');
    try {
      const allCRDs = await k8sClient.listClusterCustomResources('apiextensions.k8s.io', 'v1', 'customresourcedefinitions');
      const infinispanCRDs = allCRDs.filter((crd: any) => crd.metadata.name?.endsWith('.infinispan.org'));

      if (infinispanCRDs.length === 0) {
        console.log('No infinispan.org CRDs found - skipping CRD deletion');
      } else {
        console.log(`Found ${infinispanCRDs.length} infinispan.org CRDs to delete`);
        for (const crd of infinispanCRDs) {
          try {
            console.log(`Deleting CRD: ${crd.metadata.name}`);
            await k8sClient.deleteClusterCustomResource('apiextensions.k8s.io', 'v1', 'customresourcedefinitions', crd.metadata.name);
            console.log(`✅ Deleted CRD: ${crd.metadata.name}`);
          } catch (error) {
            console.log(`Could not delete CRD ${crd.metadata.name}: ${error.message}`);
          }
        }
      }
    } catch (error) {
      console.log(`Error checking for CRDs: ${error.message}`);
    }

    // Wait for CRD deletions to propagate
    console.log('Waiting for CRD deletions to propagate...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // STEP 2: Now delete the operator (should work now that CRDs are gone)
    console.log('Now deleting the operator...');
    await k8sClient.deleteClusterCustomResource('operators.coreos.com', 'v1', 'operators', 'datagrid.openshift-operators');
    console.log('✅ Successfully deleted datagrid.openshift-operators');

    // Wait and verify it's gone
    await new Promise(resolve => setTimeout(resolve, 3000));

    try {
      await k8sClient.getClusterCustomResource('operators.coreos.com', 'v1', 'operators', 'datagrid.openshift-operators');
      console.log('⚠️ Operator still exists after deletion attempt');
    } catch (error) {
      if (error.message?.includes('404')) {
        console.log('✅ Confirmed: datagrid.openshift-operators is gone');
      } else {
        console.log(`Verification error: ${error.message}`);
      }
    }
  } catch (error) {
    console.log(`Error during nuclear cleanup: ${error.message}`);

    // Try force deletion by stripping finalizers from operator
    try {
      console.log('💣 Trying to strip operator finalizers...');
      await k8sClient.patchClusterCustomResource(
        'operators.coreos.com',
        'v1',
        'operators',
        'datagrid.openshift-operators',
        [{ op: 'replace', path: '/metadata/finalizers', value: [] }]
      );
      console.log('Stripped operator finalizers, retrying deletion...');

      await k8sClient.deleteClusterCustomResource('operators.coreos.com', 'v1', 'operators', 'datagrid.openshift-operators');
      console.log('✅ Successfully force deleted datagrid.openshift-operators');
    } catch (forceError) {
      console.log(`Force deletion also failed: ${forceError.message}`);
    }
  }

  console.log('💣 deleteStuckDatagridOperator FINISHED');
}

/**
 * Clean up operator resources in a specific namespace
 */
export async function cleanupOperatorResources(k8sClient: any, options: OperatorCleanupOptions): Promise<void> {
  const { operatorPackageName, operandPlural, testOperand, namespace } = options;

  console.log(`Cleaning up ${operatorPackageName} resources in ${namespace}...`);

  try {
    // 1. Delete operand instances if provided
    if (testOperand && operandPlural) {
      try {
        await k8sClient.deleteCustomResource(
          testOperand.group,
          testOperand.version,
          namespace,
          operandPlural,
          testOperand.exampleName,
        );
        console.log(`✅ Deleted operand ${testOperand.exampleName}`);
      } catch (error) {
        // Ignore if not found
      }
    }

    // 2. Follow proper OpenShift operator cleanup procedure
    const subscriptions = await k8sClient.listCustomResources(
      'operators.coreos.com',
      'v1alpha1',
      namespace,
      'subscriptions',
    );

    const matchingSubscriptions = subscriptions.filter((sub: any) => {
      return (
        sub.metadata.name === operatorPackageName ||
        sub.spec?.name === operatorPackageName ||
        sub.metadata.name?.includes('datagrid') ||
        sub.spec?.name?.includes('datagrid')
      );
    });

    for (const subscription of matchingSubscriptions) {
      console.log(`Found subscription: ${subscription.metadata.name} in ${namespace}`);

      // Step 1: Get the currentCSV from the subscription
      const currentCSV = subscription.status?.currentCSV;
      if (currentCSV) {
        console.log(`  currentCSV: ${currentCSV}`);
      }

      // Step 2: Delete the subscription
      console.log(`  Deleting subscription: ${subscription.metadata.name}`);
      await k8sClient.deleteCustomResource(
        'operators.coreos.com',
        'v1alpha1',
        namespace,
        'subscriptions',
        subscription.metadata.name,
      );

      // Step 3: Delete the CSV using the currentCSV value
      if (currentCSV) {
        try {
          console.log(`  Deleting ClusterServiceVersion: ${currentCSV}`);
          await k8sClient.deleteCustomResource(
            'operators.coreos.com',
            'v1alpha1',
            namespace,
            'clusterserviceversions',
            currentCSV,
          );
          console.log(`  ✅ Successfully deleted CSV ${currentCSV} in ${namespace}`);
        } catch (csvError) {
          console.log(`  ⚠️ Could not delete CSV ${currentCSV}: ${csvError.message}`);
        }
      } else {
        console.log(`  ⚠️ No currentCSV found for subscription ${subscription.metadata.name}`);
      }
    }

    // 3. Clean up OperatorGroups in test namespaces to prevent conflicts
    if (namespace.startsWith('test-')) {
      const operatorGroups = await k8sClient.listCustomResources(
        'operators.coreos.com',
        'v1',
        namespace,
        'operatorgroups',
      );

      for (const og of operatorGroups) {
        console.log(`Deleting OperatorGroup: ${og.metadata.name}`);
        await k8sClient.deleteCustomResource(
          'operators.coreos.com',
          'v1',
          namespace,
          'operatorgroups',
          og.metadata.name,
        );
        console.log(`✅ Deleted OperatorGroup ${og.metadata.name}`);
      }
    }

    console.log(`✅ cleanupOperatorResources FINISHED for ${namespace}`);
  } catch (error) {
    console.log(`Error cleaning up ${operatorPackageName} in ${namespace}:`, error.message);
  }
}