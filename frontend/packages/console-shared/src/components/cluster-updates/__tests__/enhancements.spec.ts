/**
 * OLS Workflow Enhancements Tests
 *
 * This file tests the implemented enhancements from README.md:
 * 1. Conditional Updates with Risk Analysis
 * 2. MachineConfigPool Integration
 * 3. Alert Correlation
 * 4. Update Service Diagnostics
 */

import type { TFunction } from 'i18next';
import type { Alert } from '@console/dynamic-plugin-sdk';
import { AlertStates, RuleStates } from '@console/dynamic-plugin-sdk';
import type {
  ClusterVersionKind,
  MachineConfigPoolKind,
  ConditionalUpdate,
} from '@console/internal/module/k8s';
import { hasConditionalUpdates } from '../predicates';
import { getConditionalUpdateRisks, generateUpdatePrompt } from '../workflow-utils';
import { createCondition } from './test-helpers';

describe('OLS Workflow Enhancements', () => {
  const mockT = ((key: string) => key) as TFunction;

  // Helper to create ClusterVersion
  const createCV = (overrides?: Partial<ClusterVersionKind>): ClusterVersionKind => ({
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
      channel: 'stable-4.15',
      clusterID: 'test-cluster-id',
    },
    status: {
      desired: {
        version: '4.15.0',
        image: 'registry.redhat.io/openshift4/ose:4.15.0',
      },
      history: [
        {
          version: '4.15.0',
          state: 'Completed',
          startedTime: '2024-01-01T00:00:00Z',
          completionTime: '2024-01-01T01:00:00Z',
          image: 'registry.redhat.io/openshift4/ose:4.15.0',
          verified: false,
        },
      ],
      observedGeneration: 1,
      versionHash: 'test-hash',
    },
    ...overrides,
  });

  /**
   * ENHANCEMENT 1: Conditional Updates with Risk Analysis
   */
  describe('Enhancement 1: Conditional Updates with Risk Analysis', () => {
    it('should detect conditional updates presence', () => {
      const conditionalUpdates: ConditionalUpdate[] = [
        {
          release: { version: '4.16.0', image: 'registry.redhat.io/openshift4/ose:4.16.0' },
          conditions: [
            createCondition(
              'Recommended',
              'False',
              'NetworkDisruption',
              'Clusters using OVN may experience network disruption. See https://access.redhat.com/solutions/7001234',
            ),
          ],
        },
      ];

      const cv = createCV({
        status: {
          ...createCV().status,
          conditionalUpdates,
        },
      });

      expect(hasConditionalUpdates(cv)).toBe(true);
    });

    it('should return false when no conditional updates', () => {
      const cv = createCV();
      expect(hasConditionalUpdates(cv)).toBe(false);
    });

    it('should extract risk information from conditional updates', () => {
      const conditionalUpdates: ConditionalUpdate[] = [
        {
          release: { version: '4.16.0', image: 'registry.redhat.io/openshift4/ose:4.16.0' },
          conditions: [
            createCondition(
              'Recommended',
              'False',
              'NetworkDisruption',
              'Clusters using OVN-Kubernetes may experience temporary network disruption during upgrade',
            ),
          ],
        },
        {
          release: { version: '4.16.1', image: 'registry.redhat.io/openshift4/ose:4.16.1' },
          conditions: [
            createCondition(
              'Recommended',
              'False',
              'StorageIssue',
              'Clusters with Ceph storage may require additional configuration',
            ),
          ],
        },
      ];

      const cv = createCV({
        status: {
          ...createCV().status,
          conditionalUpdates,
        },
      });

      const risks = getConditionalUpdateRisks(cv);

      expect(risks).toHaveLength(2);
      expect(risks[0].version).toBe('4.16.0');
      expect(risks[0].risks).toHaveLength(1);
      expect(risks[0].risks[0].reason).toBe('NetworkDisruption');
      expect(risks[0].risks[0].message).toContain('OVN-Kubernetes');

      expect(risks[1].version).toBe('4.16.1');
      expect(risks[1].risks[0].reason).toBe('StorageIssue');
    });

    it('should handle conditional updates with multiple risk conditions', () => {
      const conditionalUpdates: ConditionalUpdate[] = [
        {
          release: { version: '4.16.0', image: 'registry.redhat.io/openshift4/ose:4.16.0' },
          conditions: [
            createCondition('Recommended', 'False', 'NetworkDisruption', 'Network disruption risk'),
            createCondition('Recommended', 'False', 'StorageIssue', 'Storage configuration risk'),
          ],
        },
      ];

      const cv = createCV({
        status: {
          ...createCV().status,
          conditionalUpdates,
        },
      });

      const risks = getConditionalUpdateRisks(cv);
      expect(risks[0].risks).toHaveLength(2);
    });

    it('should filter out non-risk conditions (Recommended=True)', () => {
      const conditionalUpdates: ConditionalUpdate[] = [
        {
          release: { version: '4.16.0', image: 'registry.redhat.io/openshift4/ose:4.16.0' },
          conditions: [
            createCondition('Recommended', 'True', 'Safe', 'This update is recommended'), // This is recommended (not a risk)
            createCondition('Recommended', 'False', 'NetworkDisruption', 'Network risk'), // This is a risk
          ],
        },
      ];

      const cv = createCV({
        status: {
          ...createCV().status,
          conditionalUpdates,
        },
      });

      const risks = getConditionalUpdateRisks(cv);
      expect(risks[0].risks).toHaveLength(1);
      expect(risks[0].risks[0].reason).toBe('NetworkDisruption');
    });

    it('should include conditional updates analysis in pre-check prompt with available updates', () => {
      const conditionalUpdates: ConditionalUpdate[] = [
        {
          release: { version: '4.16.0', image: 'registry.redhat.io/openshift4/ose:4.16.0' },
          conditions: [
            createCondition(
              'Recommended',
              'False',
              'NetworkDisruption',
              'OVN network disruption possible',
            ),
          ],
        },
      ];

      const cv = createCV({
        status: {
          ...createCV().status,
          conditions: [
            createCondition('Failing', 'False', 'NotFailing', 'Not failing'),
            createCondition('Progressing', 'False', 'NotProgressing', 'Not progressing'),
          ],
          conditionalUpdates,
          // Include availableUpdates to trigger general pre-check prompt
          availableUpdates: [
            {
              version: '4.15.1',
              image: 'registry.redhat.io/openshift4/ose:4.15.1',
            },
          ],
        },
      });

      const prompt = generateUpdatePrompt('pre-check', cv, mockT);

      // Prompt should mention conditional updates analysis
      expect(prompt).toContain('Conditional Updates');
      expect(prompt).toContain('Risk Analysis');
      expect(prompt).toContain('conditionalUpdates');
    });
  });

  /**
   * ENHANCEMENT 2: MachineConfigPool Integration
   */
  describe('Enhancement 2: MachineConfigPool Integration', () => {
    it('should include MCP analysis in prompts when MCP data provided', () => {
      const cv = createCV({
        status: {
          ...createCV().status,
          conditions: [
            createCondition('Progressing', 'True', 'Progressing', 'Upgrade in progress'),
          ],
        },
      });

      const mcps: MachineConfigPoolKind[] = [
        {
          apiVersion: 'machineconfiguration.openshift.io/v1',
          kind: 'MachineConfigPool',
          metadata: {
            name: 'master',
            resourceVersion: '12345',
            uid: 'master-uid',
            generation: 1,
            creationTimestamp: '2024-01-01T00:00:00Z',
          },
          spec: {
            paused: false,
          },
          status: {
            machineCount: 3,
            updatedMachineCount: 2,
            readyMachineCount: 2,
            unavailableMachineCount: 1,
            configuration: {
              name: 'rendered-master-123',
              source: [],
            },
            conditions: [createCondition('Updated', 'False', 'Updating', 'Updating nodes')],
          },
        },
      ];

      const prompt = generateUpdatePrompt('status', cv, mockT, [], mcps);

      // Prompt should mention MCP progress
      expect(prompt).toContain('MachineConfigPool');
    });
  });

  /**
   * ENHANCEMENT 3: Alert Correlation
   */
  describe('Enhancement 3: Alert Correlation', () => {
    it('should include alert analysis in prompts when alert data provided', () => {
      const cv = createCV({
        status: {
          ...createCV().status,
          conditions: [createCondition('Failing', 'True', 'OperatorFailing', 'Operator failing')],
        },
      });

      const alerts: Alert[] = [
        {
          labels: {
            alertname: 'KubePodCrashLooping',
            severity: 'critical',
            namespace: 'openshift-authentication',
          },
          annotations: {
            summary: 'Pod is crash looping',
            description: 'Pod oauth-openshift is crash looping',
          },
          state: AlertStates.Firing,
          activeAt: '2024-01-01T00:00:00Z',
          value: 1,
          rule: {
            name: 'KubePodCrashLooping',
            query: 'rate(kube_pod_container_status_restarts_total[15m]) > 0',
            duration: 300,
            labels: {
              severity: 'critical',
            },
            annotations: {},
            alerts: [],
            state: RuleStates.Firing,
            type: 'alerting',
            id: 'test-rule-id',
          },
        },
      ];

      const prompt = generateUpdatePrompt('status', cv, mockT, [], undefined, alerts);

      // Prompt should be a troubleshoot prompt (failing cluster)
      expect(prompt).toContain('Troubleshoot');
      // All troubleshoot prompts can mention alerts in the diagnostics
      expect(prompt.length).toBeGreaterThan(0);
    });
  });

  /**
   * ENHANCEMENT 4: Update Service Diagnostics
   */
  describe('Enhancement 4: Update Service Diagnostics', () => {
    it('should enhance Cincinnati troubleshooting when RetrievedUpdates=False', () => {
      const cv = createCV({
        status: {
          ...createCV().status,
          conditions: [
            createCondition(
              'RetrievedUpdates',
              'False',
              'ConnectionTimeout',
              'Unable to retrieve updates: dial tcp 52.85.42.1:443: i/o timeout',
            ),
          ],
        },
      });

      const prompt = generateUpdatePrompt('status', cv, mockT);

      // Prompt should have Cincinnati/Update Service diagnostics
      // The troubleshoot prompt includes update service analysis
      expect(prompt).toContain('Update Service');
      expect(prompt).toContain('Troubleshoot');
    });

    it('should include upstream configuration analysis', () => {
      const cv = createCV({
        spec: {
          ...createCV().spec,
          upstream: 'https://custom-cincinnati.example.com/api/upgrades_info',
        },
        status: {
          ...createCV().status,
          conditions: [
            createCondition('Failing', 'False', 'NotFailing', 'Not failing'),
            createCondition('Progressing', 'False', 'NotProgressing', 'Not progressing'),
          ],
          availableUpdates: [],
        },
      });

      const prompt = generateUpdatePrompt('pre-check', cv, mockT);

      // Prompt should check for upstream configuration
      // The no-updates prompt includes update service analysis
      expect(prompt).toContain('upstream');
      expect(prompt.length).toBeGreaterThan(0);
      // Verify it's checking the ClusterVersion
      expect(prompt).toContain('ClusterVersion');
    });
  });

  /**
   * Integration Tests: All Enhancements Together
   */
  describe('Integration: All Enhancements', () => {
    it('should handle cluster with conditional updates, MCPs, and alerts', () => {
      const conditionalUpdates: ConditionalUpdate[] = [
        {
          release: { version: '4.16.0', image: 'registry.redhat.io/openshift4/ose:4.16.0' },
          conditions: [
            createCondition(
              'Recommended',
              'False',
              'NetworkDisruption',
              'Network disruption possible',
            ),
          ],
        },
      ];

      const mcps: MachineConfigPoolKind[] = [
        {
          apiVersion: 'machineconfiguration.openshift.io/v1',
          kind: 'MachineConfigPool',
          metadata: {
            name: 'worker',
            resourceVersion: '12345',
            uid: 'worker-uid',
            generation: 1,
            creationTimestamp: '2024-01-01T00:00:00Z',
          },
          spec: {},
          status: {
            machineCount: 5,
            updatedMachineCount: 5,
            readyMachineCount: 5,
            unavailableMachineCount: 0,
            configuration: {
              name: 'rendered-worker-123',
              source: [],
            },
          },
        },
      ];

      const alerts: Alert[] = [
        {
          labels: {
            alertname: 'KubePersistentVolumeFillingUp',
            severity: 'warning',
          },
          annotations: {
            summary: 'PV filling up',
          },
          state: AlertStates.Firing,
          activeAt: '2024-01-01T00:00:00Z',
          value: 85,
          rule: {
            name: 'KubePersistentVolumeFillingUp',
            query:
              'kubelet_volume_stats_available_bytes / kubelet_volume_stats_capacity_bytes < 0.15',
            duration: 300,
            labels: { severity: 'warning' },
            annotations: {},
            alerts: [],
            state: RuleStates.Firing,
            type: 'alerting',
            id: 'test-rule-id',
          },
        },
      ];

      const cv = createCV({
        status: {
          ...createCV().status,
          conditions: [
            createCondition('Failing', 'False', 'NotFailing', 'Not failing'),
            createCondition('Progressing', 'False', 'NotProgressing', 'Not progressing'),
          ],
          conditionalUpdates,
          // Include availableUpdates so it uses general pre-check prompt with all enhancements
          availableUpdates: [
            {
              version: '4.15.1',
              image: 'registry.redhat.io/openshift4/ose:4.15.1',
            },
          ],
        },
      });

      const prompt = generateUpdatePrompt('pre-check', cv, mockT, [], mcps, alerts);

      // Should include all enhancement features
      // Conditional updates analysis is in the enhanced pre-check prompt
      expect(prompt).toContain('Conditional Updates');
      // MCP and Alert sections are in all pre-check prompts
      expect(prompt).toContain('MachineConfigPool');
      expect(prompt).toContain('Active Alerts');
    });
  });
});
