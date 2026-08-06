/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { TFunction } from 'i18next';
import type {
  ClusterVersionKind,
  ClusterOperator,
  ClusterVersionCondition,
  UpdateHistory,
  Release,
  K8sResourceCondition,
} from '@console/internal/module/k8s';
import {
  determineWorkflowPhase,
  determineWorkflowButtons,
  hasOperatorIssues,
  generateUpdatePrompt,
  getUpdateButtonTranslationKey,
} from '../workflow-utils';
import { createCondition } from './test-helpers';

// Simple AvailableUpdate type for testing
interface AvailableUpdate {
  version: string;
  image: string;
  url: string;
}

describe('OLS Update Workflow - Comprehensive Requirements Tests', () => {
  // Mock translation function with proper TFunction typing
  const mockT = ((key: string, options?: Record<string, string | number>) => {
    if (options) {
      return key.replace(/\{\{(\w+)\}\}/g, (match, prop) => String(options[prop] || match));
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

  describe('Button Appearance Logic - Table Requirements', () => {
    describe('Pre-check Button', () => {
      it('should appear when Progressing=False and Failing=False', () => {
        const cv = createMockClusterVersion([
          createCondition('Progressing', 'False', 'NotProgressing', 'Not progressing'),
          createCondition('Failing', 'False', 'NotFailing', 'Not failing'),
          createCondition('Available', 'True', 'Available', 'Available'),
        ]);

        const buttons = determineWorkflowButtons(cv, []);
        expect(buttons.showPreCheck).toBe(true);
        expect(buttons.showStatus).toBe(false);
      });

      it('should NEVER appear when Failing=True (cluster level)', () => {
        const cv = createMockClusterVersion([
          createCondition('Progressing', 'False', 'NotProgressing', 'Not progressing'),
          createCondition('Failing', 'True', 'UpdateFailed', 'Update failed'),
        ]);

        const buttons = determineWorkflowButtons(cv, []);
        expect(buttons.showPreCheck).toBe(false);
        expect(buttons.showStatus).toBe(true);
      });

      it('should NOT appear when operators are degraded (operator level)', () => {
        const cv = createMockClusterVersion([
          createCondition('Progressing', 'False', 'NotProgressing', 'Not progressing'),
          createCondition('Failing', 'False', 'NotFailing', 'Not failing'),
        ]);

        const operatorsWithIssues = [
          createMockClusterOperator('test-operator', [
            createCondition('Degraded', 'True', 'OperatorDegraded', 'Operator degraded'),
          ]),
        ];

        const buttons = determineWorkflowButtons(cv, operatorsWithIssues);
        expect(buttons.showPreCheck).toBe(false);
        expect(buttons.showStatus).toBe(true);
      });

      it('should NOT appear when operators are unavailable (operator level)', () => {
        const cv = createMockClusterVersion([
          createCondition('Progressing', 'False', 'NotProgressing', 'Not progressing'),
          createCondition('Failing', 'False', 'NotFailing', 'Not failing'),
        ]);

        const operatorsWithIssues = [
          createMockClusterOperator('test-operator', [
            createCondition('Available', 'False', 'OperatorUnavailable', 'Operator unavailable'),
          ]),
        ];

        const buttons = determineWorkflowButtons(cv, operatorsWithIssues);
        expect(buttons.showPreCheck).toBe(false);
        expect(buttons.showStatus).toBe(true);
      });
    });

    describe('Update Status Button', () => {
      it('should appear when Progressing=True (cluster level)', () => {
        const cv = createMockClusterVersion([
          createCondition('Progressing', 'True', 'UpdateProgressing', 'Update in progress'),
          createCondition('Failing', 'False', 'NotFailing', 'Not failing'),
        ]);

        const buttons = determineWorkflowButtons(cv, []);
        expect(buttons.showStatus).toBe(true);
        expect(buttons.showPreCheck).toBe(false);
      });

      it('should NOT appear when Progressing=False', () => {
        const cv = createMockClusterVersion([
          createCondition('Progressing', 'False', 'NotProgressing', 'Not progressing'),
          createCondition('Failing', 'False', 'NotFailing', 'Not failing'),
        ]);

        const buttons = determineWorkflowButtons(cv, []);
        expect(buttons.showStatus).toBe(false);
      });
    });

    describe('Troubleshoot Button', () => {
      it('should appear when Failing=True (cluster level)', () => {
        const cv = createMockClusterVersion([
          createCondition('Failing', 'True', 'UpdateFailed', 'Update failed'),
        ]);

        const buttons = determineWorkflowButtons(cv, []);
        expect(buttons.showStatus).toBe(true);
        expect(buttons.showPreCheck).toBe(false);
      });

      it('should appear when Degraded=True (operator level)', () => {
        const cv = createMockClusterVersion([
          createCondition('Progressing', 'False', 'NotProgressing', 'Not progressing'),
          createCondition('Failing', 'False', 'NotFailing', 'Not failing'),
        ]);

        const degradedOperators = [
          createMockClusterOperator('degraded-operator', [
            createCondition('Degraded', 'True', 'OperatorDegraded', 'Operator degraded'),
          ]),
        ];

        const buttons = determineWorkflowButtons(cv, degradedOperators);
        expect(buttons.showStatus).toBe(true);
        expect(buttons.showPreCheck).toBe(false);
      });

      it('should appear when Available=False (operator level)', () => {
        const cv = createMockClusterVersion([
          createCondition('Progressing', 'False', 'NotProgressing', 'Not progressing'),
          createCondition('Failing', 'False', 'NotFailing', 'Not failing'),
        ]);

        const unavailableOperators = [
          createMockClusterOperator('unavailable-operator', [
            createCondition('Available', 'False', 'OperatorUnavailable', 'Operator unavailable'),
          ]),
        ];

        const buttons = determineWorkflowButtons(cv, unavailableOperators);
        expect(buttons.showStatus).toBe(true);
        expect(buttons.showPreCheck).toBe(false);
      });

      it('should appear for ReleaseAccepted=False', () => {
        const cv = createMockClusterVersion([
          createCondition('ReleaseAccepted', 'False', 'ReleaseRejected', 'Release not accepted'),
        ]);

        const buttons = determineWorkflowButtons(cv, []);
        expect(buttons.showStatus).toBe(true);
      });

      it('should appear for RetrievedUpdates=False', () => {
        const cv = createMockClusterVersion([
          createCondition(
            'RetrievedUpdates',
            'False',
            'UpdatesNotRetrieved',
            'Updates not retrieved',
          ),
        ]);

        const buttons = determineWorkflowButtons(cv, []);
        expect(buttons.showStatus).toBe(true);
      });

      it('should appear for Invalid=True', () => {
        const cv = createMockClusterVersion([
          createCondition('Invalid', 'True', 'InvalidCluster', 'Cluster invalid'),
        ]);

        const buttons = determineWorkflowButtons(cv, []);
        expect(buttons.showStatus).toBe(true);
      });
    });
  });

  describe('Button Text - Table Requirements', () => {
    it('should have correct pre-check button text', () => {
      const buttonText = getUpdateButtonTranslationKey('pre-check');
      expect(buttonText).toBe('public~Precheck your cluster with AI');
    });

    it('should have correct status button text', () => {
      const buttonText = getUpdateButtonTranslationKey('status');
      expect(buttonText).toBe('public~Update status');
    });
  });

  describe('Prompt Content - Table Requirements', () => {
    describe('Pre-check Prompts', () => {
      it('should mention update risks, ClusterVersion conditions, OCPSTRAT-2118, and precheck output when updates available', () => {
        const cv = createMockClusterVersion([]);
        cv.status!.availableUpdates = [{ version: '4.12.3' }];

        const prompt = generateUpdatePrompt('pre-check', cv, mockT);

        expect(prompt).toContain('Cluster Upgrade Readiness');
        expect(prompt).toContain('ClusterVersion');
        expect(prompt).toContain('Pre-Check Analysis');
        expect(prompt).toContain('pre-upgrade analysis');
        expect(prompt).toContain('condition_checking_guide');
        expect(prompt).toContain('ALWAYS check the status field');
      });

      it('should show cluster health verification when no updates available', () => {
        const cv = createMockClusterVersion([]);
        cv.status!.availableUpdates = [];

        const prompt = generateUpdatePrompt('pre-check', cv, mockT);

        expect(prompt).toContain('cluster health');
        expect(prompt).toContain('ClusterVersion');
        expect(prompt).toContain('condition_checking_guide');
        expect(prompt).toContain('ALWAYS check the status field');
      });
    });

    describe('Update Status Prompts', () => {
      it('should mention CVO progress, operator conditions, completion percentage, and estimated time', () => {
        const cv = createMockClusterVersion([{ type: 'Progressing', status: 'True' }]);

        const prompt = generateUpdatePrompt('status', cv, mockT);

        expect(prompt).toContain('progress');
        expect(prompt).toContain('ClusterOperator');
        expect(prompt).toContain('completion');
        expect(prompt).toContain('Estimated completion');
        expect(prompt).toContain('Current progress');
      });
    });

    describe('Troubleshoot Prompts', () => {
      it('should mention ClusterOperator analysis and failure detection', () => {
        const cv = createMockClusterVersion([{ type: 'Failing', status: 'True' }]);

        const prompt = generateUpdatePrompt('status', cv, mockT);

        expect(prompt).toContain('ClusterOperator Failure Analysis');
        expect(prompt).toContain('Failed ClusterOperators');
        expect(prompt).toContain('Degraded=True');
        expect(prompt).toContain('Available=False');
      });
    });
  });

  describe('Operator Issues Detection', () => {
    it('should detect degraded operators', () => {
      const operators = [
        createMockClusterOperator('healthy-operator', [
          createCondition('Degraded', 'False', 'OperatorHealthy', 'Operator healthy'),
          createCondition('Available', 'True', 'OperatorAvailable', 'Operator available'),
        ]),
        createMockClusterOperator('degraded-operator', [
          createCondition('Degraded', 'True', 'OperatorDegraded', 'Operator degraded'),
        ]),
      ];

      expect(hasOperatorIssues(operators)).toBe(true);
    });

    it('should detect unavailable operators', () => {
      const operators = [
        createMockClusterOperator('healthy-operator', [
          createCondition('Available', 'True', 'OperatorAvailable', 'Operator available'),
        ]),
        createMockClusterOperator('unavailable-operator', [
          createCondition('Available', 'False', 'OperatorUnavailable', 'Operator unavailable'),
        ]),
      ];

      expect(hasOperatorIssues(operators)).toBe(true);
    });

    it('should return false for healthy operators', () => {
      const operators = [
        createMockClusterOperator('healthy-operator-1', [
          createCondition('Degraded', 'False', 'OperatorHealthy', 'Operator healthy'),
          createCondition('Available', 'True', 'OperatorAvailable', 'Operator available'),
        ]),
        createMockClusterOperator('healthy-operator-2', [
          createCondition('Available', 'True', 'OperatorAvailable', 'Operator available'),
        ]),
      ];

      expect(hasOperatorIssues(operators)).toBe(false);
    });

    it('should handle empty operators array', () => {
      expect(hasOperatorIssues([])).toBe(false);
      expect(hasOperatorIssues(undefined)).toBe(false);
    });
  });

  describe('Workflow Phase Determination', () => {
    it('should prioritize cluster-level failures over operator issues', () => {
      const cv = createMockClusterVersion([{ type: 'Failing', status: 'True' }]);

      const degradedOperators = [
        createMockClusterOperator('degraded-operator', [{ type: 'Degraded', status: 'True' }]),
      ];

      const phase = determineWorkflowPhase(cv, degradedOperators);
      expect(phase).toBe('status');
    });

    it('should detect operator issues when cluster level is healthy', () => {
      const cv = createMockClusterVersion([
        createCondition('Progressing', 'False', 'NotProgressing', 'Not progressing'),
        createCondition('Failing', 'False', 'NotFailing', 'Not failing'),
      ]);

      const degradedOperators = [
        createMockClusterOperator('degraded-operator', [
          createCondition('Degraded', 'True', 'OperatorDegraded', 'Operator degraded'),
        ]),
      ];

      const phase = determineWorkflowPhase(cv, degradedOperators);
      expect(phase).toBe('status');
    });

    it('should return pre-check when everything is healthy', () => {
      const cv = createMockClusterVersion([
        createCondition('Progressing', 'False', 'NotProgressing', 'Not progressing'),
        createCondition('Failing', 'False', 'NotFailing', 'Not failing'),
        createCondition('Available', 'True', 'Available', 'Available'),
      ]);

      const healthyOperators = [
        createMockClusterOperator('healthy-operator', [
          createCondition('Degraded', 'False', 'OperatorHealthy', 'Operator healthy'),
          createCondition('Available', 'True', 'OperatorAvailable', 'Operator available'),
        ]),
      ];

      const phase = determineWorkflowPhase(cv, healthyOperators);
      expect(phase).toBe('pre-check');
    });
  });

  describe('Edge Cases and Scenarios', () => {
    it('should handle missing conditions gracefully', () => {
      const cv: ClusterVersionKind = {
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
        }, // No conditions array
      };

      const phase = determineWorkflowPhase(cv, []);
      expect(phase).toBe('pre-check'); // Default to pre-check when no conditions
    });

    it('should handle operator without conditions', () => {
      const operatorWithoutConditions: ClusterOperator = {
        apiVersion: 'config.openshift.io/v1',
        kind: 'ClusterOperator',
        metadata: {
          name: 'test',
          resourceVersion: '12345',
          uid: 'test-uid',
          generation: 1,
          creationTimestamp: '2024-01-01T00:00:00Z',
        },
        spec: {},
        status: {
          versions: [],
          relatedObjects: [],
        }, // No conditions array
      };

      expect(hasOperatorIssues([operatorWithoutConditions])).toBe(false);
    });

    it('should handle multiple failure conditions correctly', () => {
      const cv = createMockClusterVersion([
        createCondition('Failing', 'True', 'UpdateFailed', 'Update failed'),
        createCondition('ReleaseAccepted', 'False', 'ReleaseRejected', 'Release not accepted'),
        createCondition('Invalid', 'True', 'InvalidCluster', 'Cluster invalid'),
      ]);

      const phase = determineWorkflowPhase(cv, []);
      expect(phase).toBe('status');
    });
  });

  describe('Specific Table Scenarios', () => {
    describe('Pre-check Scenarios', () => {
      it('should show pre-check when no updates available and cluster healthy', () => {
        const cv = createMockClusterVersion([
          createCondition('Available', 'True', 'Available', 'Available'),
          createCondition('Failing', 'False', 'NotFailing', 'Not failing'),
        ]);
        cv.status!.availableUpdates = [];

        const buttons = determineWorkflowButtons(cv, []);
        expect(buttons.showPreCheck).toBe(true);
      });

      it('should show pre-check when updates available but no version selected yet', () => {
        const cv = createMockClusterVersion([
          createCondition('Available', 'True', 'Available', 'Available'),
          createCondition('Failing', 'False', 'NotFailing', 'Not failing'),
        ]);
        cv.status!.availableUpdates = [
          {
            version: '4.12.3',
            image: 'registry.redhat.io/openshift4/ose:4.12.3',
            url: 'https://example.com',
          } as AvailableUpdate,
        ];

        const buttons = determineWorkflowButtons(cv, []);
        expect(buttons.showPreCheck).toBe(true);
      });

      it('should show pre-check when updates available and specific version selected', () => {
        const cv = createMockClusterVersion([
          createCondition('Available', 'True', 'Available', 'Available'),
          createCondition('Failing', 'False', 'NotFailing', 'Not failing'),
        ]);
        cv.status!.availableUpdates = [
          {
            version: '4.12.3',
            image: 'registry.redhat.io/openshift4/ose:4.12.3',
            url: 'https://example.com',
          } as AvailableUpdate,
        ];
        cv.spec!.desiredUpdate = {
          version: '4.12.3',
          image: 'registry.redhat.io/openshift4/ose:4.12.3',
          url: 'https://example.com',
        } as Release;

        const buttons = determineWorkflowButtons(cv, []);
        expect(buttons.showPreCheck).toBe(true);
      });
    });
  });
});
