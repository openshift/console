import type { TestOperandProps } from '../pages/operator-details-page';
import { cleanupOperatorResources, cleanupAllOperatorsByPackageName } from './operator-cleanup';

export interface OperatorTestConfig {
  operatorName: string;
  operatorCardTestID: string;
  packageName: string;
  operand?: TestOperandProps & { plural: string };
  globalNamespace?: string;
}

/**
 * Standard operator cleanup for test setup/teardown
 */
export async function performOperatorCleanup(k8sClient: any, config: OperatorTestConfig): Promise<void> {
  const { packageName, operand, globalNamespace = 'openshift-operators' } = config;

  console.log(`🧹 Starting standard cleanup for ${packageName} operator...`);

  try {
    // 1. Aggressive cluster-wide cleanup
    await cleanupAllOperatorsByPackageName(k8sClient, packageName);

    // 2. Clean up specific namespaces with operand context
    const targetNamespaces = [globalNamespace, 'openshift-marketplace'];
    for (const namespace of targetNamespaces) {
      await cleanupOperatorResources(k8sClient, {
        operatorPackageName: packageName,
        operandPlural: operand?.plural,
        testOperand: operand,
        namespace,
      });
    }

    // 3. Clean up test namespaces
    await cleanupTestNamespaces(k8sClient, config);

    console.log(`✅ Standard cleanup complete for ${packageName}`);
  } catch (error) {
    console.log(`Error during ${packageName} cleanup:`, error.message);
  }
}

/**
 * Aggressive cleanup that also removes lingering operators and test namespaces
 */
export async function performAggressiveOperatorCleanup(k8sClient: any, config: OperatorTestConfig): Promise<void> {
  const { packageName } = config;

  console.log(`🔥 Starting aggressive cleanup for ${packageName} operator...`);

  // Start with standard cleanup
  await performOperatorCleanup(k8sClient, config);

  try {
    // Additional aggressive steps
    await cleanupTestNamespaces(k8sClient, config, true); // deleteNamespaces = true

    // Wait for cleanup to propagate with polling
    console.log('⏳ Waiting for cleanup to propagate...');
    const remainingOperators = await waitForOperatorCleanup(k8sClient, packageName, 30_000);

    // Force-delete only the remaining stragglers
    if (remainingOperators.length > 0) {
      await verifyAndForceCleanup(k8sClient, packageName);
    }

    console.log(`✅ Aggressive cleanup complete for ${packageName}`);
  } catch (error) {
    console.log(`Error during aggressive ${packageName} cleanup:`, error.message);
  }
}

/**
 * Clean up test namespaces with operator resources
 */
async function cleanupTestNamespaces(k8sClient: any, config: OperatorTestConfig, deleteNamespaces: boolean = false): Promise<void> {
  const { packageName, operand } = config;

  try {
    const namespaces = await k8sClient.listNamespaces();
    const testNamespaces = namespaces.filter((ns: any) => {
      const name: string | undefined = ns?.metadata?.name;
      return Boolean(name && name.startsWith('test-'));
    });

    for (const testNs of testNamespaces) {
      const nsName = (testNs as any)?.metadata?.name;
      if (!nsName) continue;

      console.log(`Cleaning up test namespace: ${nsName}`);
      try {
        await cleanupOperatorResources(k8sClient, {
          operatorPackageName: packageName,
          operandPlural: operand?.plural,
          testOperand: operand,
          namespace: nsName,
        });

        // Optionally delete the entire namespace
        if (deleteNamespaces && nsName.startsWith('test-')) {
          await k8sClient.deleteNamespace(nsName);
          console.log(`✅ Deleted test namespace: ${nsName}`);
        }
      } catch (error) {
        console.log(`Error cleaning up namespace ${nsName}:`, error.message);
      }
    }
  } catch (error) {
    console.log('Error cleaning up test namespaces:', error.message);
  }
}

/**
 * Verify cleanup worked and force-delete any remaining operators
 */
/**
 * Poll for operator cleanup completion with timeout
 */
async function waitForOperatorCleanup(k8sClient: any, packageName: string, timeoutMs = 30_000): Promise<any[]> {
  const startTime = Date.now();
  let remainingOperators: any[] = [];

  while (Date.now() - startTime < timeoutMs) {
    try {
      const allOperators = await k8sClient.listClusterCustomResources('operators.coreos.com', 'v1', 'operators');
      remainingOperators = allOperators.filter((op: any) => op.metadata.name?.includes(packageName));

      if (remainingOperators.length === 0) {
        console.log(`✅ All ${packageName} operators cleaned up successfully`);
        return [];
      }

      console.log(`⏳ Still waiting for ${remainingOperators.length} ${packageName} operators to be cleaned up...`);
      await new Promise(resolve => setTimeout(resolve, 2_000)); // Poll every 2 seconds
    } catch (error) {
      console.log(`Error checking operator cleanup status:`, error.message);
      await new Promise(resolve => setTimeout(resolve, 2_000));
    }
  }

  return remainingOperators;
}

async function verifyAndForceCleanup(k8sClient: any, packageName: string): Promise<void> {
  try {
    const remainingOperators = await k8sClient.listClusterCustomResources('operators.coreos.com', 'v1', 'operators');
    const matchingOperators = remainingOperators.filter((op: any) =>
      op.metadata.name?.includes(packageName)
    );

    if (matchingOperators.length > 0) {
      console.log(`⚠️  Warning: Found ${matchingOperators.length} remaining ${packageName} operators that need force deletion:`,
        matchingOperators.map((op: any) => op.metadata.name)
      );

      // Try to force delete them
      for (const op of matchingOperators) {
        try {
          console.log(`🗑️  Force deleting operator: ${op.metadata.name}`);
          await k8sClient.deleteClusterCustomResource('operators.coreos.com', 'v1', 'operators', op.metadata.name);
        } catch (error) {
          console.log(`Failed to force delete ${op.metadata.name}:`, error.message);
        }
      }
    }
  } catch (error) {
    console.log('Could not verify cleanup state:', error.message);
  }
}

/**
 * Create standard test hooks for any operator test
 */
export function createOperatorTestHooks(config: OperatorTestConfig) {
  return {
    beforeEach: async ({ k8sClient, page }: any) => {
      console.log(`=== ${config.packageName.toUpperCase()} BEFORE EACH: Starting cleanup ===`);
      await performOperatorCleanup(k8sClient, config);
      await waitForOperatorCleanup(k8sClient, config.packageName, 15_000);
      console.log(`=== ${config.packageName.toUpperCase()} BEFORE EACH: Cleanup complete ===`);
    },

    afterEach: async ({ k8sClient }: any) => {
      console.log(`=== ${config.packageName.toUpperCase()} AFTER EACH: Starting safety cleanup ===`);
      // Give UI operations time to complete with polling
      await waitForOperatorCleanup(k8sClient, config.packageName, 15_000);
      await performOperatorCleanup(k8sClient, config);
      console.log(`=== ${config.packageName.toUpperCase()} AFTER EACH: Cleanup complete ===`);
    },

    beforeAll: async ({ k8sClient }: any) => {
      console.log(`=== ${config.packageName.toUpperCase()} BEFORE ALL: Starting standard cleanup ===`);
      // Use standard cleanup instead of aggressive to avoid affecting cluster-wide resources
      await performOperatorCleanup(k8sClient, config);
      console.log(`=== ${config.packageName.toUpperCase()} BEFORE ALL: Cleanup complete ===`);
    },

    afterAll: async ({ k8sClient }: any) => {
      console.log(`=== ${config.packageName.toUpperCase()} AFTER ALL: Starting final cleanup ===`);
      await performAggressiveOperatorCleanup(k8sClient, config);
      console.log(`=== ${config.packageName.toUpperCase()} AFTER ALL: Cleanup complete ===`);
    },
  };
}