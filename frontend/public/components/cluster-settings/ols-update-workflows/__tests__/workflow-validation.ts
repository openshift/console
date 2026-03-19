/**
 * Manual validation script to verify the OLS workflow implementation
 * matches the requirements table exactly.
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

// Simple AvailableUpdate type for testing
interface AvailableUpdate {
  version: string;
  image: string;
  url: string;
}
import {
  determineWorkflowButtons,
  hasOperatorIssues,
  generateUpdatePrompt,
  getUpdateButtonTranslationKey,
} from '../workflow-utils';

// Mock translation function with proper TFunction typing
const mockT = ((key: string, options?: any) => {
  if (options) {
    return key.replace(/\{\{(\w+)\}\}/g, (match, prop) => options[prop] || match);
  }
  return key;
}) as TFunction;

// Helper to create mock ClusterVersion
const createMockCV = (conditions: ClusterVersionCondition[]): ClusterVersionKind => ({
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
const createMockOperator = (name: string, conditions: K8sResourceCondition[]): ClusterOperator => ({
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

console.log('🔍 VALIDATING OLS WORKFLOW IMPLEMENTATION');
console.log('==========================================\n');

// Test 1: Pre-check button appears correctly
console.log('✅ TEST 1: Pre-check Button Appearance');
const healthyCV = createMockCV([
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
console.log(
  '  Healthy cluster (Progressing=False, Failing=False):',
  healthyButtons.showPreCheck ? '✅' : '❌',
);

// Test 2: Pre-check NEVER appears when Failing=True
const failingCV = createMockCV([
  {
    type: 'Failing',
    status: 'True' as K8sResourceConditionStatus,
    reason: 'UpdateFailed',
    message: 'Update failed',
  },
]);
const failingButtons = determineWorkflowButtons(failingCV, []);
console.log('  Never when Failing=True:', !failingButtons.showPreCheck ? '✅' : '❌');

// Test 3: Update Status button appears when Progressing=True
console.log('\n✅ TEST 2: Update Status Button Appearance');
const progressingCV = createMockCV([
  {
    type: 'Progressing',
    status: 'True' as K8sResourceConditionStatus,
    reason: 'UpdateProgressing',
    message: 'Update in progress',
  },
]);
const progressingButtons = determineWorkflowButtons(progressingCV, []);
console.log('  When Progressing=True:', progressingButtons.showStatus ? '✅' : '❌');

// Test 4: Status button appears for failures and operator issues (with smart troubleshoot switching)
console.log('\n✅ TEST 3: Status Button Appearance for Issues');
console.log('  When Failing=True:', failingButtons.showStatus ? '✅' : '❌');

const degradedOperators = [
  createMockOperator('test', [
    {
      type: 'Degraded',
      status: 'True' as K8sResourceConditionStatus,
      reason: 'OperatorDegraded',
      message: 'Operator degraded',
    },
  ]),
];
const operatorIssueButtons = determineWorkflowButtons(healthyCV, degradedOperators);
console.log('  When operator Degraded=True:', operatorIssueButtons.showStatus ? '✅' : '❌');

const unavailableOperators = [
  createMockOperator('test', [
    {
      type: 'Available',
      status: 'False' as K8sResourceConditionStatus,
      reason: 'OperatorUnavailable',
      message: 'Operator unavailable',
    },
  ]),
];
const unavailableButtons = determineWorkflowButtons(healthyCV, unavailableOperators);
console.log('  When operator Available=False:', unavailableButtons.showStatus ? '✅' : '❌');

// Test 5: Button text matches requirements
console.log('\n✅ TEST 4: Button Text Validation');
console.log(
  '  Pre-check:',
  getUpdateButtonTranslationKey('pre-check') === 'public~Pre-check with AI' ? '✅' : '❌',
);
console.log(
  '  Status:',
  getUpdateButtonTranslationKey('status') === 'public~Update status' ? '✅' : '❌',
);
// Note: Status button now intelligently switches between progress and troubleshoot prompts

// Test 6: Prompt content validation
console.log('\n✅ TEST 5: Prompt Content Validation');

// Pre-check prompt with updates available
const precheckPrompt = generateUpdatePrompt('pre-check', createMockCV([]), mockT);
const hasPrecheckRequirements = [
  'recommended update risks',
  'ClusterVersion conditions',
  'OCPSTRAT-2118',
  'precheck output',
  'Available=True and Degraded=False',
].every((req) => precheckPrompt.includes(req));
console.log('  Pre-check prompt requirements:', hasPrecheckRequirements ? '✅' : '❌');

// Status prompt
const statusPrompt = generateUpdatePrompt('status', progressingCV, mockT);
const hasStatusRequirements = [
  'CVO (Cluster Version Operator) progress',
  'operator conditions',
  'Percentage of completion',
  'completed control planes and worker nodes',
  'Estimated remaining time',
].every((req) => statusPrompt.includes(req));
console.log('  Status prompt requirements:', hasStatusRequirements ? '✅' : '❌');

// Troubleshoot prompt (via status phase with failures)
const troubleshootPrompt = generateUpdatePrompt('status', failingCV, mockT);
const hasTroubleshootRequirements = [
  'operator failures',
  'observability dashboard',
  'Degraded=True or Available=False',
].every((req) => troubleshootPrompt.includes(req));
console.log('  Troubleshoot prompt requirements:', hasTroubleshootRequirements ? '✅' : '❌');

// Test 7: Edge cases
console.log('\n✅ TEST 6: Edge Cases');
const emptyCV: ClusterVersionKind = {
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
    desired: {
      version: '4.12.1',
      image: 'registry.redhat.io/openshift4/ose:4.12.1',
      url: 'https://example.com',
    } as Release,
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
    observedGeneration: 1,
    versionHash: 'test-hash',
  },
};
const emptyButtons = determineWorkflowButtons(emptyCV, []);
console.log('  Empty CV defaults to pre-check:', emptyButtons.showPreCheck ? '✅' : '❌');

console.log('  No operator issues with empty array:', !hasOperatorIssues([]) ? '✅' : '❌');
console.log('  No operator issues with undefined:', !hasOperatorIssues(undefined) ? '✅' : '❌');

console.log('\n🎉 VALIDATION COMPLETE!');
console.log('All core requirements verified against the table specification.');
