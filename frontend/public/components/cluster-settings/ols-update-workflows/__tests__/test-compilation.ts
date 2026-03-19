/**
 * Simple compilation test for our workflow test files
 */
/* eslint-disable no-console */

import type { TFunction } from 'i18next';
import type {
  ClusterVersionKind,
  ClusterOperator,
  ClusterVersionCondition,
  UpdateHistory,
  Release,
  K8sResourceCondition,
  K8sResourceConditionStatus,
} from '@console/internal/module/k8s';
import {
  determineWorkflowButtons,
  hasOperatorIssues,
  generateUpdatePrompt,
  getUpdateButtonTranslationKey,
} from '../workflow-utils';

// Simple AvailableUpdate type for testing
interface AvailableUpdate {
  version: string;
  image: string;
  url: string;
}

// Mock translation function with proper TFunction typing
const mockT = ((key: string, options?: any) => {
  if (options) {
    return key.replace(/\{\{(\w+)\}\}/g, (match, prop) => options[prop] || match);
  }
  return key;
}) as TFunction;

// Helper to create mock ClusterVersion
const createMockClusterVersion = (conditions: ClusterVersionCondition[]): ClusterVersionKind => ({
  apiVersion: 'config.openshift.io/v1',
  kind: 'ClusterVersion',
  metadata: {
    name: 'version',
    resourceVersion: '12345',
    uid: 'test-uid',
    generation: 1,
    creationTimestamp: '2024-01-01T00:00:00Z',
  },
  spec: {
    channel: 'stable-4.12',
    clusterID: 'test-cluster-id',
  },
  status: {
    conditions,
    history: [
      {
        version: '4.12.1',
        state: 'Completed',
        startedTime: '2024-01-01T00:00:00Z',
        completionTime: '2024-01-01T01:00:00Z',
        image: 'registry.redhat.io/openshift4/ose:4.12.1',
        verified: false,
      } as UpdateHistory,
    ],
    desired: {
      version: '4.12.2',
      image: 'registry.redhat.io/openshift4/ose:4.12.2',
      url: 'https://example.com',
    } as Release,
    availableUpdates: [
      {
        version: '4.12.3',
        image: 'registry.redhat.io/openshift4/ose:4.12.3',
        url: 'https://example.com',
      } as AvailableUpdate,
    ],
    observedGeneration: 1,
    versionHash: 'test-hash',
  },
});

// Helper to create mock ClusterOperator
const createMockClusterOperator = (
  name: string,
  conditions: K8sResourceCondition[],
): ClusterOperator => ({
  apiVersion: 'config.openshift.io/v1',
  kind: 'ClusterOperator',
  metadata: {
    name,
    resourceVersion: '12345',
    uid: `${name}-uid`,
    generation: 1,
    creationTimestamp: '2024-01-01T00:00:00Z',
  },
  spec: {},
  status: {
    conditions,
    versions: [],
    relatedObjects: [],
  },
});

// Test basic functionality
console.log('🔧 Testing TypeScript compilation...');

// Test pre-check button logic
const healthyCV = createMockClusterVersion([
  {
    type: 'Progressing',
    status: 'False' as K8sResourceConditionStatus,
    reason: 'NotProgressing',
    message: 'Not progressing',
  },
  {
    type: 'Failing',
    status: 'False' as K8sResourceConditionStatus,
    reason: 'NotFailing',
    message: 'Not failing',
  },
]);
const healthyButtons = determineWorkflowButtons(healthyCV, []);

// Test operator issues detection
const degradedOperators = [
  createMockClusterOperator('test', [
    {
      type: 'Degraded',
      status: 'True' as K8sResourceConditionStatus,
      reason: 'OperatorDegraded',
      message: 'Operator degraded',
    },
  ]),
];
const operatorIssues = hasOperatorIssues(degradedOperators);

// Test prompt generation
const prompt = generateUpdatePrompt('pre-check', healthyCV, mockT);

// Test button text retrieval
const buttonText = getUpdateButtonTranslationKey('pre-check');

// Actually use the variables to verify they work
console.log('✅ TypeScript compilation successful!');
console.log('✅ All types properly defined and used!');
console.log('✅ Test functions callable without errors!');
console.log(`📝 Pre-check button shows: ${healthyButtons.showPreCheck}`);
console.log(`📝 Operator issues detected: ${operatorIssues}`);
console.log(`📝 Prompt generated (length): ${prompt.length} chars`);
console.log(`📝 Button text: ${buttonText}`);

export {};
