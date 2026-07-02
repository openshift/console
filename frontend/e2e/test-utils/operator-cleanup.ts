import type { TestOperandProps } from '../pages/operator-details-page';

export interface OperatorCleanupOptions {
  operatorPackageName: string;
  operandPlural?: string;
  testOperand?: TestOperandProps;
  namespace: string;
}

/**
 * Simple cleanup that deletes subscriptions and lets OLM handle the rest
 */
export async function cleanupAllOperatorsByPackageName(k8sClient: any, operatorPackageName: string): Promise<void> {
  console.log(`🧹 Cleaning up ${operatorPackageName} operators by removing subscriptions...`);

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

        // Find matching subscriptions
        const matchingSubscriptions = subscriptions.filter((sub: any) => {
          return sub.metadata.name === operatorPackageName || sub.spec?.name === operatorPackageName;
        });

        // Delete matching subscriptions
        for (const subscription of matchingSubscriptions) {
          console.log(`Deleting subscription ${subscription.metadata.name} in namespace ${nsName}`);
          await k8sClient.deleteCustomResource(
            'operators.coreos.com',
            'v1alpha1',
            nsName,
            'subscriptions',
            subscription.metadata.name,
          );
        }
      } catch (error) {
        // Ignore errors for individual namespaces
      }
    }

    // Give OLM time to clean up everything else
    console.log('Waiting 5 seconds for OLM to clean up dependent resources...');
    await new Promise(resolve => setTimeout(resolve, 5000));

  } catch (error) {
    console.log('Error during subscription cleanup:', error.message);
  }

  console.log('Simple cleanup complete');
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

    // 2. Delete subscription (the root cause) - let OLM handle the rest
    const subscriptions = await k8sClient.listCustomResources(
      'operators.coreos.com',
      'v1alpha1',
      namespace,
      'subscriptions',
    );

    const matchingSubscriptions = subscriptions.filter((sub: any) => {
      return sub.metadata.name === operatorPackageName || sub.spec?.name === operatorPackageName;
    });

    for (const subscription of matchingSubscriptions) {
      console.log(`Deleting subscription: ${subscription.metadata.name}`);
      await k8sClient.deleteCustomResource(
        'operators.coreos.com',
        'v1alpha1',
        namespace,
        'subscriptions',
        subscription.metadata.name,
      );
      console.log(`✅ Deleted subscription ${subscription.metadata.name}`);
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

  } catch (error) {
    console.log(`Error cleaning up ${operatorPackageName} in ${namespace}:`, error.message);
  }

  console.log(`✅ Cleanup complete for ${namespace}`);
}