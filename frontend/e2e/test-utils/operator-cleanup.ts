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
      op.spec?.packageName === operatorPackageName
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
        sub.spec?.name === operatorPackageName
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
export async function cleanupAllOperatorsByPackageName(k8sClient: any, operatorPackageName: string): Promise<boolean> {
  console.log(`🧹 Checking for ${operatorPackageName} operators to clean up...`);

  // Quick check first - if nothing to clean, skip all the heavy work
  const needsCleanup = await quickOperatorCheck(k8sClient, operatorPackageName);
  if (!needsCleanup) {
    console.log(`✅ No cleanup needed for ${operatorPackageName}`);
    return true;
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
            sub.spec?.name === operatorPackageName
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
        op.spec?.packageName === operatorPackageName
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
    return false;
  }

  console.log('✅ cleanupAllOperatorsByPackageName FINISHED');
  return true;
}

/**
 * Force cleanup for when normal cleanup doesn't work - removes finalizers and force deletes
 */
export async function forceCleanupAllOperatorsByPackageName(k8sClient: any, operatorPackageName: string): Promise<boolean> {
  console.log(`🔥 Checking if force cleanup is needed for ${operatorPackageName}...`);

  // Quick check first - if nothing to clean, skip the force cleanup
  const needsCleanup = await quickOperatorCheck(k8sClient, operatorPackageName);
  if (!needsCleanup) {
    console.log(`✅ No force cleanup needed for ${operatorPackageName}`);
    return true;
  }

  console.log(`🔥 Starting force cleanup of ${operatorPackageName} operators...`);

  try {
    // Force clean cluster-scoped Operator resources
    const operators = await k8sClient.listClusterCustomResources('operators.coreos.com', 'v1', 'operators');
    const matchingOperators = operators.filter((op: any) =>
      op.metadata.name?.includes(operatorPackageName) ||
      op.spec?.packageName === operatorPackageName
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
          csv.metadata.name?.includes(operatorPackageName) ||
          csv.spec?.displayName?.includes(operatorPackageName)
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
          sub.metadata.name?.includes(operatorPackageName) ||
          sub.spec?.name?.includes(operatorPackageName)
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
    return false;
  }

  console.log('🔥 forceCleanupAllOperatorsByPackageName FINISHED');
  return true;
}

/**
 * Nuclear option - delete CRDs first, then the operator (this was the missing piece!)
 */
export async function deleteStuckOperator(k8sClient: any, operatorName: string, crdPattern: string): Promise<boolean> {
  console.log(`💣 Checking for stuck ${operatorName} operator...`);

  // Quick check first
  try {
    await k8sClient.getClusterCustomResource('operators.coreos.com', 'v1', 'operators', operatorName);
    console.log(`💣 Found stuck ${operatorName} operator - starting nuclear cleanup...`);
  } catch (error) {
    if (error.message?.includes('404')) {
      console.log(`✅ No stuck ${operatorName} operator found - nuclear cleanup not needed`);
      return true;
    } else {
      console.log(`❌ Error checking for stuck ${operatorName} operator: ${error.message} - aborting nuclear cleanup`);
      return false;
    }
  }

  try {
    // STEP 1: Check which CRDs actually exist and delete them
    console.log(`Checking for ${crdPattern} CRDs...`);
    try {
      const allCRDs = await k8sClient.listClusterCustomResources('apiextensions.k8s.io', 'v1', 'customresourcedefinitions');
      const operatorCRDs = allCRDs.filter((crd: any) => crd.metadata.name?.endsWith(crdPattern));

      if (operatorCRDs.length === 0) {
        console.log(`No ${crdPattern} CRDs found - skipping CRD deletion`);
      } else {
        console.log(`Found ${operatorCRDs.length} ${crdPattern} CRDs to delete`);
        for (const crd of operatorCRDs) {
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
    await k8sClient.deleteClusterCustomResource('operators.coreos.com', 'v1', 'operators', operatorName);
    console.log(`✅ Successfully deleted ${operatorName}`);

    // Wait and verify it's gone
    await new Promise(resolve => setTimeout(resolve, 3000));

    try {
      await k8sClient.getClusterCustomResource('operators.coreos.com', 'v1', 'operators', operatorName);
      console.log('⚠️ Operator still exists after deletion attempt');
    } catch (error) {
      if (error.message?.includes('404')) {
        console.log(`✅ Confirmed: ${operatorName} is gone`);
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
        operatorName,
        [{ op: 'replace', path: '/metadata/finalizers', value: [] }]
      );
      console.log('Stripped operator finalizers, retrying deletion...');

      await k8sClient.deleteClusterCustomResource('operators.coreos.com', 'v1', 'operators', operatorName);
      console.log(`✅ Successfully force deleted ${operatorName}`);
    } catch (forceError) {
      console.log(`Force deletion also failed: ${forceError.message}`);
    }
  }

  console.log(`💣 deleteStuckOperator FINISHED for ${operatorName}`);
  return true;
}

/**
 * Shared cleanup logic for operator tests - handles both beforeEach (aborted runs) and afterEach (UI uninstall verification)
 */
export async function operatorTestCleanup(
  k8sClient: any,
  options: {
    operatorPackageName: string;
    operandPlural: string;
    testOperand: any;
    targetNamespace: string;
    crdPatterns?: string[]; // CRD patterns to clean up (e.g., ['.infinispan.org'])
    waitForUiUninstall?: boolean; // Optional delay before cleanup for afterEach
    uiUninstallTimeoutMs?: number;
  }
): Promise<boolean> {
  const {
    operatorPackageName,
    operandPlural,
    testOperand,
    targetNamespace,
    crdPatterns = [],
    waitForUiUninstall = false,
    uiUninstallTimeoutMs = 10_000 // Reduced default since we're just giving UI time
  } = options;

  try {
    if (waitForUiUninstall) {
      // Give UI uninstall a brief moment to start, then proceed with cleanup anyway
      console.log(`⏳ Giving UI uninstall ${uiUninstallTimeoutMs / 1000}s to start, then cleaning up remaining resources...`);
      await new Promise(resolve => setTimeout(resolve, uiUninstallTimeoutMs));
    }

    // Clean up subscription and CSV resources (standard OLM cleanup)
    console.log(`⏳ Cleaning up operator resources in ${targetNamespace}...`);
    const cleanupSuccess = await cleanupOperatorResources(k8sClient, {
      operatorPackageName,
      operandPlural,
      testOperand,
      namespace: targetNamespace,
    });

    if (!cleanupSuccess) {
      console.log(`❌ Namespace cleanup failed for ${targetNamespace}`);
    }

    // Clean up InstallPlans (OpenShift doesn't remove these automatically)
    console.log(`⏳ Cleaning up InstallPlans for ${operatorPackageName}...`);
    try {
      const installPlans = await k8sClient.listCustomResources('operators.coreos.com', 'v1alpha1', targetNamespace, 'installplans');
      const operatorInstallPlans = installPlans.filter((ip: any) => {
        const csvNames = ip.spec?.clusterServiceVersionNames || [];
        return csvNames.some((csvName: string) => csvName.includes(operatorPackageName));
      });

      for (const installPlan of operatorInstallPlans) {
        try {
          console.log(`  Deleting InstallPlan: ${installPlan.metadata.name}`);
          await k8sClient.deleteCustomResource('operators.coreos.com', 'v1alpha1', targetNamespace, 'installplans', installPlan.metadata.name);
          console.log(`  ✅ Deleted InstallPlan: ${installPlan.metadata.name}`);
        } catch (error) {
          console.log(`  ⚠️ Could not delete InstallPlan ${installPlan.metadata.name}: ${error.message}`);
        }
      }
    } catch (error) {
      console.log(`Error cleaning up InstallPlans: ${error.message}`);
    }

    // Clean up cluster Operator resource (OpenShift doesn't remove these automatically)
    console.log(`⏳ Cleaning up cluster Operator resource for ${operatorPackageName}...`);
    try {
      const operators = await k8sClient.listClusterCustomResources('operators.coreos.com', 'v1', 'operators');
      const matchingOperators = operators.filter((op: any) =>
        op.metadata.name?.includes(operatorPackageName) ||
        op.spec?.packageName === operatorPackageName
      );

      for (const operator of matchingOperators) {
        try {
          console.log(`  Attempting to delete cluster Operator: ${operator.metadata.name}`);

          // First try to strip finalizers (operators often have finalizers that prevent deletion)
          try {
            console.log(`  Stripping finalizers from ${operator.metadata.name}...`);
            await k8sClient.patchClusterCustomResource(
              'operators.coreos.com',
              'v1',
              'operators',
              operator.metadata.name,
              [{ op: 'replace', path: '/metadata/finalizers', value: [] }]
            );
            console.log(`  ✅ Stripped finalizers from ${operator.metadata.name}`);
          } catch (patchError) {
            console.log(`  ⚠️ Could not strip finalizers: ${patchError.message}`);
          }

          // Now delete the operator
          await k8sClient.deleteClusterCustomResource('operators.coreos.com', 'v1', 'operators', operator.metadata.name);
          console.log(`  ✅ Deleted cluster Operator: ${operator.metadata.name}`);
        } catch (error) {
          console.log(`  ❌ Could not delete cluster Operator ${operator.metadata.name}: ${error.message}`);
        }
      }

      // Poll to verify all operators are actually deleted, but don't fail if they persist
      console.log('⏳ Verifying cluster Operator cleanup...');
      const pollInterval = 5000; // Check every 5 seconds
      const maxWaitTime = 20000; // Max 20 seconds (shortened since CRD cleanup may resolve lingering operators)
      const startTime = Date.now();

      while (Date.now() - startTime < maxWaitTime) {
        try {
          const remainingOperators = await k8sClient.listClusterCustomResources('operators.coreos.com', 'v1', 'operators');
          const stillMatching = remainingOperators.filter((op: any) =>
            op.metadata.name?.includes(operatorPackageName) ||
            op.spec?.packageName === operatorPackageName
          );

          if (stillMatching.length === 0) {
            console.log(`✅ All ${operatorPackageName} cluster Operators successfully removed`);
            break;
          } else {
            const elapsed = Math.round((Date.now() - startTime) / 1000);
            console.log(`⏳ Still ${stillMatching.length} operators remaining after ${elapsed}s: ${stillMatching.map((op: any) => op.metadata.name).join(', ')}`);
          }
        } catch (error) {
          console.log(`Error checking operator cleanup status: ${error.message}`);
        }

        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }

      // Final check and warn if operators still exist (but continue with cleanup)
      try {
        const finalOperators = await k8sClient.listClusterCustomResources('operators.coreos.com', 'v1', 'operators');
        const stillPresent = finalOperators.filter((op: any) =>
          op.metadata.name?.includes(operatorPackageName) ||
          op.spec?.packageName === operatorPackageName
        );

        if (stillPresent.length > 0) {
          console.log(`⚠️ Warning: ${stillPresent.length} ${operatorPackageName} operators remain after cleanup. CRD deletion may resolve this.`);
        }
      } catch (error) {
        console.log(`Could not perform final operator check: ${error.message}`);
      }
    } catch (error) {
      console.log(`Error cleaning up cluster Operators: ${error.message}`);
    }

    console.log(`✅ Standard cleanup complete for ${targetNamespace}`);

    // Clean up specified CRDs if provided (for complete operator cleanup)
    if (crdPatterns.length > 0) {
      console.log(`🧹 Cleaning up CRDs matching patterns: ${crdPatterns.join(', ')}`);
      try {
        const allCRDs = await k8sClient.listClusterCustomResources('apiextensions.k8s.io', 'v1', 'customresourcedefinitions');

        for (const pattern of crdPatterns) {
          const matchingCRDs = allCRDs.filter((crd: any) => crd.metadata.name?.endsWith(pattern));

          if (matchingCRDs.length > 0) {
            console.log(`Found ${matchingCRDs.length} CRDs matching pattern '${pattern}'`);
            for (const crd of matchingCRDs) {
              try {
                console.log(`  Deleting CRD: ${crd.metadata.name}`);
                await k8sClient.deleteClusterCustomResource('apiextensions.k8s.io', 'v1', 'customresourcedefinitions', crd.metadata.name);
                console.log(`  ✅ Deleted CRD: ${crd.metadata.name}`);
              } catch (error) {
                console.log(`  ⚠️ Could not delete CRD ${crd.metadata.name}: ${error.message}`);
              }
            }
          } else {
            console.log(`No CRDs found matching pattern '${pattern}'`);
          }
        }

        // Poll for CRD deletions to complete
        if (crdPatterns.some(pattern => allCRDs.some((crd: any) => crd.metadata.name?.endsWith(pattern)))) {
          console.log('⏳ Polling for CRD deletions to complete...');
          const pollInterval = 2000; // Check every 2 seconds
          const maxWaitTime = 30000; // Max 30 seconds for CRD cleanup
          const startTime = Date.now();

          while (Date.now() - startTime < maxWaitTime) {
            try {
              const currentCRDs = await k8sClient.listClusterCustomResources('apiextensions.k8s.io', 'v1', 'customresourcedefinitions');
              const remainingCRDs = crdPatterns.flatMap(pattern =>
                currentCRDs.filter((crd: any) => crd.metadata.name?.endsWith(pattern))
              );

              if (remainingCRDs.length === 0) {
                const elapsedTime = Math.round((Date.now() - startTime) / 1000);
                console.log(`✅ All CRDs deleted successfully after ${elapsedTime}s`);
                break;
              } else {
                const elapsedTime = Math.round((Date.now() - startTime) / 1000);
                console.log(`⏳ Still waiting for CRD cleanup (${elapsedTime}s): ${remainingCRDs.length} CRDs remaining`);
              }
            } catch (error) {
              console.log(`Error checking CRD cleanup status: ${error.message}`);
            }

            await new Promise(resolve => setTimeout(resolve, pollInterval));
          }
        }
      } catch (error) {
        console.log(`⚠️ Error during CRD cleanup: ${error.message}`);
      }
    }

    // Final verification: check if CRD deletion resolved any lingering operators
    if (crdPatterns.length > 0) {
      console.log('🔍 Final verification: checking if operators were resolved by CRD deletion...');
      try {
        const finalOperators = await k8sClient.listClusterCustomResources('operators.coreos.com', 'v1', 'operators');
        const remainingOperators = finalOperators.filter((op: any) =>
          op.metadata.name?.includes(operatorPackageName) ||
          op.spec?.packageName === operatorPackageName
        );

        if (remainingOperators.length === 0) {
          console.log(`✅ All ${operatorPackageName} operators completely removed after CRD cleanup`);
        } else {
          console.log(`⚠️ Warning: ${remainingOperators.length} ${operatorPackageName} operators still present: ${remainingOperators.map((op: any) => op.metadata.name).join(', ')}`);
          console.log('💡 This may be normal - some operators persist until next OLM sync cycle');
        }
      } catch (error) {
        console.log(`Could not perform final verification: ${error.message}`);
      }
    }

    return true;

  } catch (error) {
    console.log(`❌ Cleanup error: ${error.message}`);
    return false;
  }
}

/**
 * Clean up operator resources in a specific namespace
 */
export async function cleanupOperatorResources(k8sClient: any, options: OperatorCleanupOptions): Promise<boolean> {
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
        sub.spec?.name === operatorPackageName
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
    return true;
  } catch (error) {
    console.log(`Error cleaning up ${operatorPackageName} in ${namespace}:`, error.message);
    return false;
  }
}