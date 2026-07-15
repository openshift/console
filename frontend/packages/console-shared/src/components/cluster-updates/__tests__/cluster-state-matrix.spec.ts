/**
 * OLS Cluster State Matrix Tests
 *
 * This file serves as the living documentation for all possible OpenShift cluster states
 * and their corresponding OLS workflow behavior. Each test case represents a specific
 * cluster state and validates which button appears and which prompt is used.
 *
 * Cluster State Determination:
 * - ClusterVersion conditions (Failing, Progressing, Available, Invalid, RetrievedUpdates, ReleaseAccepted)
 * - ClusterOperator health (Available, Degraded, Progressing)
 * - Update availability (availableUpdates, conditionalUpdates)
 *
 * Workflow Phases:
 * - 'status': Shows "Update status" button
 *   - Uses createProgressPrompt when Progressing=True and no failures
 *   - Uses createTroubleshootPrompt when failures detected
 * - 'pre-check': Shows "Pre-check with AI" button
 *   - Uses createPreCheckPrompt when updates available
 *   - Uses createPreCheckSpecificVersionPrompt when specific version selected
 *   - Uses createPreCheckNoUpdatesPrompt when no updates available
 */

import type { TFunction } from 'i18next';
import type {
  ClusterVersionKind,
  ClusterOperator,
  ClusterVersionCondition,
  ConditionalUpdate,
  UpdateHistory,
  Release,
  K8sResourceCondition,
} from '@console/internal/module/k8s';
import {
  determineWorkflowPhase,
  determineWorkflowButtons,
  generateUpdatePrompt,
} from '../workflow-utils';
import { createCondition } from './test-helpers';

// Helper to create ClusterVersion with flexible options
const createClusterVersion = (options: {
  failing?: boolean;
  progressing?: boolean;
  available?: boolean;
  invalid?: boolean;
  retrievedUpdates?: boolean | { status: boolean; message?: string };
  releaseAccepted?: boolean | { status: boolean; message?: string };
  availableUpdates?: number;
  conditionalUpdates?: number;
  desiredUpdate?: { version: string };
  historyState?: 'Completed' | 'Partial';
}): ClusterVersionKind => {
  const conditions: ClusterVersionCondition[] = [
    ...(options.failing !== undefined
      ? [
          createCondition(
            'Failing',
            options.failing ? 'True' : 'False',
            options.failing ? 'UpdateFailed' : 'NotFailing',
            options.failing ? 'Update failed' : 'Not failing',
          ),
        ]
      : []),
    ...(options.progressing !== undefined
      ? [
          createCondition(
            'Progressing',
            options.progressing ? 'True' : 'False',
            options.progressing ? 'UpdateProgressing' : 'NotProgressing',
            options.progressing ? 'Working towards 4.15.0' : 'Not progressing',
          ),
        ]
      : []),
    ...(options.available !== undefined
      ? [
          createCondition(
            'Available',
            options.available ? 'True' : 'False',
            options.available ? 'ClusterAvailable' : 'ClusterNotAvailable',
            options.available ? 'Cluster available' : 'Cluster not available',
          ),
        ]
      : []),
    ...(options.invalid !== undefined
      ? [
          createCondition(
            'Invalid',
            options.invalid ? 'True' : 'False',
            options.invalid ? 'InvalidConfiguration' : 'ValidConfiguration',
            options.invalid ? 'Invalid configuration' : 'Valid configuration',
          ),
        ]
      : []),
    ...(options.retrievedUpdates !== undefined
      ? [
          createCondition(
            'RetrievedUpdates',
            (
              typeof options.retrievedUpdates === 'boolean'
                ? options.retrievedUpdates
                : options.retrievedUpdates.status
            )
              ? 'True'
              : 'False',
            (
              typeof options.retrievedUpdates === 'boolean'
                ? options.retrievedUpdates
                : options.retrievedUpdates.status
            )
              ? 'UpdatesRetrieved'
              : 'UpdatesNotRetrieved',
            (typeof options.retrievedUpdates === 'boolean'
              ? undefined
              : options.retrievedUpdates.message) ||
              ((
                typeof options.retrievedUpdates === 'boolean'
                  ? options.retrievedUpdates
                  : options.retrievedUpdates.status
              )
                ? 'Updates retrieved'
                : 'Cannot retrieve updates'),
          ),
        ]
      : []),
    ...(options.releaseAccepted !== undefined
      ? [
          createCondition(
            'ReleaseAccepted',
            (
              typeof options.releaseAccepted === 'boolean'
                ? options.releaseAccepted
                : options.releaseAccepted.status
            )
              ? 'True'
              : 'False',
            (
              typeof options.releaseAccepted === 'boolean'
                ? options.releaseAccepted
                : options.releaseAccepted.status
            )
              ? 'ReleaseVerified'
              : 'ReleaseRejected',
            (typeof options.releaseAccepted === 'boolean'
              ? undefined
              : options.releaseAccepted.message) ||
              ((
                typeof options.releaseAccepted === 'boolean'
                  ? options.releaseAccepted
                  : options.releaseAccepted.status
              )
                ? 'Release accepted'
                : 'Release verification failed'),
          ),
        ]
      : []),
  ];

  const availableUpdates = options.availableUpdates
    ? Array.from({ length: options.availableUpdates }, (_, i) => ({
        version: `4.15.${i}`,
        image: `registry.redhat.io/openshift4/ose:4.15.${i}`,
        url: `https://access.redhat.com/errata/RHSA-2026-${i}`,
      }))
    : undefined;

  const conditionalUpdates: ConditionalUpdate[] | undefined = options.conditionalUpdates
    ? Array.from({ length: options.conditionalUpdates }, (_, i) => ({
        release: {
          version: `4.16.${i}`,
          image: `registry.redhat.io/openshift4/ose:4.16.${i}`,
        },
        conditions: [
          createCondition(
            'Recommended',
            'False',
            'KnownIssue',
            'Cluster may experience issues during upgrade. See https://access.redhat.com/solutions/7001234',
          ),
        ],
      }))
    : undefined;

  return {
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
      channel: 'stable-4.14',
      clusterID: 'test-cluster-id',
      desiredUpdate: options.desiredUpdate as Release,
    },
    status: {
      conditions,
      desired: {
        version: '4.14.10',
        image: 'registry.redhat.io/openshift4/ose:4.14.10',
        url: 'https://access.redhat.com/errata/RHSA-2026-1234',
      } as Release,
      history: [
        {
          version: '4.14.10',
          state: options.historyState || 'Completed',
          startedTime: '2024-01-01T00:00:00Z',
          completionTime: options.historyState === 'Completed' ? '2024-01-01T01:00:00Z' : undefined,
          image: 'registry.redhat.io/openshift4/ose:4.14.10',
          verified: false,
        } as UpdateHistory,
      ],
      availableUpdates,
      conditionalUpdates,
      observedGeneration: 1,
      versionHash: 'test-hash',
    },
  };
};

// Helper to create ClusterOperator
const createOperator = (
  name: string,
  options: {
    available?: boolean;
    degraded?: boolean;
    progressing?: boolean;
  },
): ClusterOperator => {
  const conditions: K8sResourceCondition[] = [
    ...(options.available !== undefined
      ? [
          createCondition(
            'Available',
            options.available ? 'True' : 'False',
            options.available ? 'OperatorAvailable' : 'OperatorUnavailable',
            options.available ? 'Operator available' : 'Operator unavailable',
          ),
        ]
      : []),
    ...(options.degraded !== undefined
      ? [
          createCondition(
            'Degraded',
            options.degraded ? 'True' : 'False',
            options.degraded ? 'OperatorDegraded' : 'OperatorHealthy',
            options.degraded ? 'Operator degraded' : 'Operator healthy',
          ),
        ]
      : []),
    ...(options.progressing !== undefined
      ? [
          createCondition(
            'Progressing',
            options.progressing ? 'True' : 'False',
            options.progressing ? 'OperatorProgressing' : 'OperatorStable',
            options.progressing ? 'Operator progressing' : 'Operator stable',
          ),
        ]
      : []),
  ];

  return {
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
    status: { conditions, versions: [], relatedObjects: [] },
  };
};

describe('OLS Cluster State Matrix - Complete Scenarios', () => {
  const mockT = ((key: string) => key) as TFunction;

  /**
   * STATE 1: Upgrade In Progress (Healthy)
   * Conditions: Failing=False, Progressing=True, Available=True
   * Operators: All healthy, some progressing
   * Expected: status phase → createProgressPrompt
   */
  describe('State 1: Upgrade In Progress (Healthy)', () => {
    it('should show status button and use progress prompt', () => {
      const cv = createClusterVersion({
        failing: false,
        progressing: true,
        available: true,
        historyState: 'Partial',
      });

      const operators = [
        createOperator('console', { available: true, degraded: false, progressing: true }),
        createOperator('authentication', { available: true, degraded: false, progressing: false }),
      ];

      const buttons = determineWorkflowButtons(cv, operators);
      expect(buttons.showStatus).toBe(true);
      expect(buttons.showPreCheck).toBe(false);

      const phase = determineWorkflowPhase(cv, operators);
      expect(phase).toBe('status');

      const prompt = generateUpdatePrompt(phase, cv, mockT, operators);
      expect(prompt).toContain('Progress Monitor');
      expect(prompt).toContain('operators');
    });
  });

  /**
   * STATE 2: Upgrade Failing (Progressing with Failures)
   * Conditions: Failing=True, Progressing=True
   * Operators: May have failures
   * Expected: status phase → createTroubleshootPrompt
   */
  describe('State 2: Upgrade Failing', () => {
    it('should show status button and use troubleshoot prompt when cluster failing', () => {
      const cv = createClusterVersion({
        failing: true,
        progressing: true,
        historyState: 'Partial',
      });

      const operators = [createOperator('authentication', { available: false, degraded: true })];

      const buttons = determineWorkflowButtons(cv, operators);
      expect(buttons.showStatus).toBe(true);
      expect(buttons.showPreCheck).toBe(false);

      const phase = determineWorkflowPhase(cv, operators);
      expect(phase).toBe('status');

      const prompt = generateUpdatePrompt(phase, cv, mockT, operators);
      expect(prompt).toContain('Troubleshoot Analysis');
      expect(prompt).toContain('Root Cause');
      expect(prompt).toContain('Failed ClusterOperators');
    });
  });

  /**
   * STATE 3: Upgrade Stalled (Operator Issues During Progress)
   * Conditions: Failing=False, Progressing=True
   * Operators: Some with Available=False or Degraded=True
   * Expected: status phase → createTroubleshootPrompt
   */
  describe('State 3: Upgrade Stalled (Operator Issues)', () => {
    it('should show status button and use troubleshoot prompt when operators have issues', () => {
      const cv = createClusterVersion({
        failing: false,
        progressing: true,
        historyState: 'Partial',
      });

      const operators = [
        createOperator('console', { available: true, degraded: false }),
        createOperator('authentication', { available: false, degraded: false }),
      ];

      const buttons = determineWorkflowButtons(cv, operators);
      expect(buttons.showStatus).toBe(true);
      expect(buttons.showPreCheck).toBe(false);

      const prompt = generateUpdatePrompt('status', cv, mockT, operators);
      expect(prompt).toContain('Troubleshoot');
    });
  });

  /**
   * STATE 4: Cluster Failing (Not Progressing)
   * Conditions: Failing=True, Progressing=False
   * Expected: status phase → createTroubleshootPrompt
   */
  describe('State 4: Cluster Failing (Idle)', () => {
    it('should show status button and use troubleshoot prompt', () => {
      const cv = createClusterVersion({
        failing: true,
        progressing: false,
      });

      const buttons = determineWorkflowButtons(cv);
      expect(buttons.showStatus).toBe(true);
      expect(buttons.showPreCheck).toBe(false);

      const prompt = generateUpdatePrompt('status', cv, mockT);
      expect(prompt).toContain('Troubleshoot');
      expect(prompt).toContain('Root Cause');
    });
  });

  /**
   * STATE 5: Operator Issues (Cluster Idle)
   * Conditions: Failing=False, Progressing=False, Available=True
   * Operators: Some with Available=False or Degraded=True
   * Expected: status phase → createTroubleshootPrompt
   */
  describe('State 5: Operator Issues (Cluster Idle)', () => {
    it('should show status button when operators degraded but cluster not failing', () => {
      const cv = createClusterVersion({
        failing: false,
        progressing: false,
        available: true,
      });

      const operators = [createOperator('authentication', { available: true, degraded: true })];

      const buttons = determineWorkflowButtons(cv, operators);
      expect(buttons.showStatus).toBe(true);
      expect(buttons.showPreCheck).toBe(false);

      const prompt = generateUpdatePrompt('status', cv, mockT, operators);
      expect(prompt).toContain('Troubleshoot');
    });

    it('should show status button when operators unavailable but cluster not failing', () => {
      const cv = createClusterVersion({
        failing: false,
        progressing: false,
        available: true,
      });

      const operators = [createOperator('console', { available: false, degraded: false })];

      const buttons = determineWorkflowButtons(cv, operators);
      expect(buttons.showStatus).toBe(true);
      expect(buttons.showPreCheck).toBe(false);
    });
  });

  /**
   * STATE 6: Update Service Issues
   * Conditions: RetrievedUpdates=False with message OR ReleaseAccepted=False with message
   * Expected: status phase → createTroubleshootPrompt
   */
  describe('State 6: Update Service Issues', () => {
    it('should show status button when RetrievedUpdates=False', () => {
      const cv = createClusterVersion({
        failing: false,
        progressing: false,
        retrievedUpdates: { status: false, message: 'Cannot connect to update service' },
      });

      const buttons = determineWorkflowButtons(cv);
      expect(buttons.showStatus).toBe(true);
      expect(buttons.showPreCheck).toBe(false);
    });

    it('should show status button when ReleaseAccepted=False', () => {
      const cv = createClusterVersion({
        failing: false,
        progressing: false,
        releaseAccepted: { status: false, message: 'Signature verification failed' },
      });

      const buttons = determineWorkflowButtons(cv);
      expect(buttons.showStatus).toBe(true);
      expect(buttons.showPreCheck).toBe(false);
    });
  });

  /**
   * STATE 7: Ready for Update (Available Updates)
   * Conditions: Failing=False, Progressing=False, Available=True
   * Operators: All healthy
   * Updates: availableUpdates has items
   * Expected: pre-check phase → createPreCheckPrompt
   */
  describe('State 7: Ready for Update', () => {
    it('should show pre-check button when updates available and cluster healthy', () => {
      const cv = createClusterVersion({
        failing: false,
        progressing: false,
        available: true,
        retrievedUpdates: true,
        availableUpdates: 5,
      });

      const operators = [
        createOperator('console', { available: true, degraded: false }),
        createOperator('authentication', { available: true, degraded: false }),
      ];

      const buttons = determineWorkflowButtons(cv, operators);
      expect(buttons.showPreCheck).toBe(true);
      expect(buttons.showStatus).toBe(false);

      const phase = determineWorkflowPhase(cv, operators);
      expect(phase).toBe('pre-check');

      const prompt = generateUpdatePrompt(phase, cv, mockT, operators);
      expect(prompt).toContain('Pre-Check Analysis');
      expect(prompt).toContain('Available Updates');
    });
  });

  /**
   * STATE 8: Conditional Updates with Concerns
   * Conditions: Failing=False, Progressing=False
   * Updates: availableUpdates empty/small, conditionalUpdates has items with conditions
   * Expected: pre-check phase → createPreCheckNoUpdatesPrompt (no availableUpdates)
   *
   * NOTE: Current implementation treats conditionalUpdates separately from availableUpdates.
   * When availableUpdates is empty, we show the "no updates" prompt regardless of
   * conditionalUpdates presence. Future enhancement could add dedicated handling for
   * conditionalUpdates to parse and explain the conditions/risks.
   *
   * ConditionalUpdate structure:
   * - release: \{ version, image \}
   * - conditions: [\{ type, status, reason, message \}]
   *
   * The conditions typically have type="Recommended" status="False" with risk details in the message.
   */
  describe('State 8: Conditional Updates with Risks', () => {
    it('should show pre-check button with conditional updates (current behavior)', () => {
      const cv = createClusterVersion({
        failing: false,
        progressing: false,
        available: true,
        availableUpdates: 0,
        conditionalUpdates: 2,
      });

      const operators = [createOperator('console', { available: true, degraded: false })];

      const buttons = determineWorkflowButtons(cv, operators);
      expect(buttons.showPreCheck).toBe(true);
      expect(buttons.showStatus).toBe(false);

      const prompt = generateUpdatePrompt('pre-check', cv, mockT, operators);
      // Current implementation: no availableUpdates → uses no-updates prompt
      expect(prompt).toContain('Health Assessment');
      expect(prompt).toContain('no available updates');
    });

    it('should handle conditional updates alongside available updates', () => {
      const cv = createClusterVersion({
        failing: false,
        progressing: false,
        available: true,
        availableUpdates: 1, // Has some available updates
        conditionalUpdates: 2, // Plus conditional updates with risks
      });

      const operators = [createOperator('console', { available: true, degraded: false })];

      const buttons = determineWorkflowButtons(cv, operators);
      expect(buttons.showPreCheck).toBe(true);

      const prompt = generateUpdatePrompt('pre-check', cv, mockT, operators);
      // When availableUpdates exist, uses general pre-check
      expect(prompt).toContain('Pre-Check Analysis');
      // TODO: Future enhancement to parse conditionalUpdates[].conditions array
      // and explain the risk conditions to the user
    });
  });

  /**
   * STATE 9: No Updates Available (Fully Updated)
   * Conditions: Failing=False, Progressing=False, RetrievedUpdates=True
   * Updates: availableUpdates empty, conditionalUpdates empty
   * Expected: pre-check phase → createPreCheckNoUpdatesPrompt
   */
  describe('State 9: No Updates Available', () => {
    it('should show pre-check button and use no-updates prompt', () => {
      const cv = createClusterVersion({
        failing: false,
        progressing: false,
        available: true,
        retrievedUpdates: true,
        availableUpdates: 0,
      });

      const operators = [createOperator('console', { available: true, degraded: false })];

      const buttons = determineWorkflowButtons(cv, operators);
      expect(buttons.showPreCheck).toBe(true);
      expect(buttons.showStatus).toBe(false);

      const prompt = generateUpdatePrompt('pre-check', cv, mockT, operators);
      expect(prompt).toContain('Health Assessment');
      expect(prompt).toContain('no available updates');
    });
  });

  /**
   * STATE 10: Specific Version Selected
   * Conditions: Failing=False, Progressing=False
   * Updates: availableUpdates has items, user selected specific version
   * Expected: pre-check phase → createPreCheckSpecificVersionPrompt
   */
  describe('State 10: Specific Version Selected', () => {
    it('should use specific version prompt when target version provided', () => {
      const cv = createClusterVersion({
        failing: false,
        progressing: false,
        available: true,
        availableUpdates: 3,
      });

      const targetVersion = '4.15.1';
      const prompt = generateUpdatePrompt(
        'pre-check',
        cv,
        mockT,
        undefined,
        undefined,
        undefined,
        targetVersion,
      );

      expect(prompt).toContain('Pre-Check Analysis');
      expect(prompt).toContain('4.15.1');
      expect(prompt).toContain('Target Version');
    });
  });

  /**
   * STATE 11: Invalid Condition
   * Conditions: Invalid=True
   * Expected: status phase → createTroubleshootPrompt
   */
  describe('State 11: Invalid Condition', () => {
    it('should show status button when Invalid=True', () => {
      const cv = createClusterVersion({
        invalid: true,
        progressing: false,
      });

      const buttons = determineWorkflowButtons(cv);
      expect(buttons.showStatus).toBe(true);
      expect(buttons.showPreCheck).toBe(false);

      const prompt = generateUpdatePrompt('status', cv, mockT);
      expect(prompt).toContain('Troubleshoot');
    });
  });

  /**
   * Edge Cases and Combined Conditions
   */
  describe('Edge Cases', () => {
    it('should prioritize failures over progressing (Failing=True, Progressing=True)', () => {
      const cv = createClusterVersion({
        failing: true,
        progressing: true,
      });

      const phase = determineWorkflowPhase(cv);
      expect(phase).toBe('status');

      const prompt = generateUpdatePrompt(phase, cv, mockT);
      expect(prompt).toContain('Troubleshoot'); // Not Progress
    });

    it('should handle multiple service issues (RetrievedUpdates=False, ReleaseAccepted=False)', () => {
      const cv = createClusterVersion({
        failing: false,
        progressing: false,
        retrievedUpdates: { status: false, message: 'Error 1' },
        releaseAccepted: { status: false, message: 'Error 2' },
      });

      const buttons = determineWorkflowButtons(cv);
      expect(buttons.showStatus).toBe(true);
      expect(buttons.showPreCheck).toBe(false);
    });

    it('should handle cluster-level failures with operator issues', () => {
      const cv = createClusterVersion({
        failing: true,
        progressing: false,
      });

      const operators = [createOperator('authentication', { available: false, degraded: true })];

      const phase = determineWorkflowPhase(cv, operators);
      expect(phase).toBe('status');
    });

    it('should show pre-check only when fully healthy', () => {
      const cv = createClusterVersion({
        failing: false,
        progressing: false,
        available: true,
        invalid: false,
        retrievedUpdates: true,
        releaseAccepted: true,
      });

      const operators = [
        createOperator('console', { available: true, degraded: false }),
        createOperator('authentication', { available: true, degraded: false }),
      ];

      const buttons = determineWorkflowButtons(cv, operators);
      expect(buttons.showPreCheck).toBe(true);
      expect(buttons.showStatus).toBe(false);
    });
  });

  /**
   * Condition Status Field Validation
   * These tests ensure we always check the status field, not just the condition type
   */
  describe('Condition Status Field Checking', () => {
    // Table-driven test data
    const conditionStatusTests = [
      {
        name: 'Failing condition with status=False should NOT trigger status button',
        cvOptions: { failing: false, progressing: false, available: true },
        operators: undefined,
        expectedButtons: { showPreCheck: true, showStatus: false },
      },
      {
        name: 'Degraded condition with status=False should NOT trigger status button',
        cvOptions: { failing: false, progressing: false },
        operators: [{ name: 'console', options: { available: true, degraded: false } }],
        expectedButtons: { showPreCheck: true, showStatus: false },
      },
      {
        name: 'Available condition with status=True should NOT trigger status button',
        cvOptions: { failing: false, progressing: false, available: true },
        operators: undefined,
        expectedButtons: { showPreCheck: true, showStatus: false },
      },
    ];

    conditionStatusTests.forEach(({ name, cvOptions, operators, expectedButtons }) => {
      it(name, () => {
        const cv = createClusterVersion(cvOptions);
        const ops = operators?.map((o) => createOperator(o.name, o.options));

        const buttons = determineWorkflowButtons(cv, ops);
        expect(buttons.showPreCheck).toBe(expectedButtons.showPreCheck);
        expect(buttons.showStatus).toBe(expectedButtons.showStatus);
      });
    });
  });

  /**
   * Prompt Content Validation for Cluster Scenarios
   *
   * Tests that generated prompts contain the correct analysis sections,
   * security controls, confidence qualifiers, and version interpolation
   * for representative cluster states.
   */
  describe('Prompt Content Validation for Cluster Scenarios', () => {
    describe('Scenario A: Healthy cluster ready to upgrade', () => {
      it('should generate pre-check prompt with readiness sections and hardening controls', () => {
        const cv = createClusterVersion({
          failing: false,
          progressing: false,
          available: true,
          retrievedUpdates: true,
          availableUpdates: 5,
        });

        const operators = [
          createOperator('console', { available: true, degraded: false }),
          createOperator('authentication', { available: true, degraded: false }),
          createOperator('ingress', { available: true, degraded: false }),
        ];

        const phase = determineWorkflowPhase(cv, operators);
        expect(phase).toBe('pre-check');

        const prompt = generateUpdatePrompt(phase, cv, mockT, operators);

        expect(prompt).toContain('Pre-Check Analysis');
        expect(prompt).toContain('Available Updates');
        expect(prompt).toContain('Upgrade Readiness');
        expect(prompt).toContain('scope_definition');

        expect(prompt).toContain('<security>');
        expect(prompt).toContain('<confidence_qualifiers>');
        expect(prompt).toContain('Data Completeness');

        expect(prompt).toContain('4.14.10');
      });
    });

    describe('Scenario B: Cluster with degraded operator', () => {
      it('should route to troubleshoot prompt with operator failure analysis sections', () => {
        const cv = createClusterVersion({
          failing: false,
          progressing: false,
          available: true,
          availableUpdates: 3,
        });

        const operators = [
          createOperator('console', { available: true, degraded: false }),
          createOperator('authentication', { available: true, degraded: true }),
        ];

        const phase = determineWorkflowPhase(cv, operators);
        expect(phase).toBe('status');

        const prompt = generateUpdatePrompt(phase, cv, mockT, operators);

        expect(prompt).toContain('Troubleshoot Analysis');
        expect(prompt).toContain('Degraded');
        expect(prompt).toContain('Failed ClusterOperators');
        expect(prompt).toContain('Root Cause');
        expect(prompt).toContain('Investigation Steps');
        expect(prompt).toContain('Recovery Actions');

        expect(prompt).toContain('<security>');
        expect(prompt).toContain('<confidence_qualifiers>');
        expect(prompt).toContain('Data Completeness');
      });
    });

    describe('Scenario C: Cluster with conditional update risk', () => {
      it('should generate pre-check prompt that surfaces conditional update risks', () => {
        const cv = createClusterVersion({
          failing: false,
          progressing: false,
          available: true,
          retrievedUpdates: true,
          availableUpdates: 3,
          conditionalUpdates: 2,
        });

        const operators = [
          createOperator('console', { available: true, degraded: false }),
          createOperator('authentication', { available: true, degraded: false }),
        ];

        const phase = determineWorkflowPhase(cv, operators);
        expect(phase).toBe('pre-check');

        const prompt = generateUpdatePrompt(phase, cv, mockT, operators);

        expect(prompt).toContain('Pre-Check Analysis');
        expect(prompt).toContain('Conditional Updates');
        expect(prompt).toContain('conditionalUpdates');
        expect(prompt).toContain('Risk Analysis');

        expect(prompt).toContain('<security>');
        expect(prompt).toContain('<confidence_qualifiers>');
        expect(prompt).toContain('Data Completeness');
      });
    });

    describe('Scenario D: Cluster mid-upgrade', () => {
      it('should generate progress prompt with interpolated operator counts and ETA sections', () => {
        const cv = createClusterVersion({
          failing: false,
          progressing: true,
          available: true,
          historyState: 'Partial',
        });

        const baseOperators = [
          createOperator('console', { available: true, degraded: false, progressing: false }),
          createOperator('authentication', {
            available: true,
            degraded: false,
            progressing: false,
          }),
          createOperator('ingress', { available: true, degraded: false, progressing: false }),
          createOperator('network', { available: true, degraded: false, progressing: true }),
          createOperator('dns', { available: true, degraded: false, progressing: false }),
        ];

        // 3 operators at target version, 1 updating (progressing), 1 pending
        const operators = baseOperators.map((op, i) => ({
          ...op,
          status: {
            ...op.status,
            versions: [{ name: 'operator', version: i < 3 ? '4.14.10' : '4.14.9' }],
          },
        })) as typeof baseOperators;

        const phase = determineWorkflowPhase(cv, operators);
        expect(phase).toBe('status');

        const prompt = generateUpdatePrompt(phase, cv, mockT, operators);

        expect(prompt).toContain('Progress Monitor');

        expect(prompt).toContain('3 of 5');
        expect(prompt).toContain('1 of 5');
        expect(prompt).toContain('0 of 5');

        expect(prompt).toContain('Estimated completion');
        expect(prompt).toContain('Current progress');
        expect(prompt).toContain('4.14.10');

        expect(prompt).toContain('<security>');
        expect(prompt).toContain('<confidence_qualifiers>');
        expect(prompt).toContain('Data Completeness');
      });
    });
  });
});
