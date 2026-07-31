/**
 * Cluster State Detector Tests
 *
 * Comprehensive test coverage for all cluster states and scenarios
 * described in the OLS integration requirements.
 */

import type { ClusterVersionKind, ClusterOperator } from '@console/internal/module/k8s';
import {
  detectClusterState,
  isClusterHealthy,
  shouldShowPreCheck,
  shouldShowStatus,
  ClusterState,
} from '../cluster-state-detector';

describe('Cluster State Detector', () => {
  // Helper to create a minimal ClusterVersion
  const createCV = (overrides?: Partial<ClusterVersionKind>): ClusterVersionKind => ({
    apiVersion: 'config.openshift.io/v1',
    kind: 'ClusterVersion',
    metadata: { name: 'version' },
    spec: {
      clusterID: 'test-cluster',
      channel: 'stable-4.14',
    },
    status: {
      observedGeneration: 1,
      versionHash: 'test-hash',
      conditions: [],
      history: [
        {
          state: 'Completed',
          version: '4.14.1',
          image: 'quay.io/openshift-release-dev/ocp-release:4.14.1',
          verified: false,
          startedTime: '',
          completionTime: '',
        },
      ],
      desired: { version: '4.14.1', image: '' },
    },
    ...overrides,
  });

  // Helper to create a ClusterOperator
  const createOperator = (
    name: string,
    available: boolean = true,
    degraded: boolean = false,
  ): ClusterOperator => ({
    apiVersion: 'config.openshift.io/v1',
    kind: 'ClusterOperator',
    metadata: { name },
    spec: {},
    status: {
      conditions: [
        { type: 'Available', status: available ? 'True' : 'False', lastTransitionTime: '' },
        { type: 'Degraded', status: degraded ? 'True' : 'False', lastTransitionTime: '' },
      ],
    },
  });

  describe('Scenario 1: Ready to update with recommended updates', () => {
    it('should detect READY_WITH_UPDATES state', () => {
      const cv = createCV({
        status: {
          ...createCV().status,
          conditions: [
            { type: 'Failing', status: 'False', lastTransitionTime: '' },
            { type: 'Progressing', status: 'False', lastTransitionTime: '' },
          ],
          availableUpdates: [{ version: '4.14.2', image: '' }],
        },
      });

      const result = detectClusterState(cv);

      expect(result.state).toBe(ClusterState.READY_WITH_UPDATES);
      expect(result.recommendedWorkflow).toBe('pre-check');
      expect(result.conditions.hasRecommendedUpdates).toBe(true);
      expect(result.conditions.failing).toBe(false);
      expect(result.conditions.progressing).toBe(false);
    });

    it('should show pre-check workflow', () => {
      const cv = createCV({
        status: {
          ...createCV().status,
          conditions: [
            { type: 'Failing', status: 'False', lastTransitionTime: '' },
            { type: 'Progressing', status: 'False', lastTransitionTime: '' },
          ],
          availableUpdates: [{ version: '4.14.2', image: '' }],
        },
      });

      expect(shouldShowPreCheck(cv)).toBe(true);
      expect(shouldShowStatus(cv)).toBe(false);
    });
  });

  describe('Scenario 2: Ready with conditional updates', () => {
    it('should detect READY_WITH_CONDITIONAL_UPDATES state', () => {
      const cv = createCV({
        status: {
          ...createCV().status,
          conditions: [
            { type: 'Failing', status: 'False', lastTransitionTime: '' },
            { type: 'Progressing', status: 'False', lastTransitionTime: '' },
          ],
          conditionalUpdates: [
            {
              release: { version: '4.14.2', image: '' },
              conditions: [
                {
                  type: 'Recommended',
                  status: 'False',
                  reason: 'KnownIssue',
                  message: 'Known issue with networking',
                  lastTransitionTime: '',
                },
              ],
            },
          ],
        },
      });

      const result = detectClusterState(cv);

      expect(result.state).toBe(ClusterState.READY_WITH_CONDITIONAL_UPDATES);
      expect(result.recommendedWorkflow).toBe('pre-check');
      expect(result.conditions.hasConditionalUpdates).toBe(true);
    });
  });

  describe('Scenario 3: Update in progress', () => {
    it('should detect UPDATE_IN_PROGRESS state', () => {
      const cv = createCV({
        status: {
          ...createCV().status,
          conditions: [
            { type: 'Failing', status: 'False', lastTransitionTime: '' },
            { type: 'Progressing', status: 'True', lastTransitionTime: '' },
          ],
          desired: { version: '4.14.2', image: '' },
        },
      });

      const result = detectClusterState(cv);

      expect(result.state).toBe(ClusterState.UPDATE_IN_PROGRESS);
      expect(result.recommendedWorkflow).toBe('status');
      expect(result.conditions.progressing).toBe(true);
    });

    it('should show status workflow during update', () => {
      const cv = createCV({
        status: {
          ...createCV().status,
          conditions: [
            { type: 'Failing', status: 'False', lastTransitionTime: '' },
            { type: 'Progressing', status: 'True', lastTransitionTime: '' },
          ],
        },
      });

      expect(shouldShowStatus(cv)).toBe(true);
      expect(shouldShowPreCheck(cv)).toBe(false);
    });
  });

  describe('Scenario 4: Cluster failing', () => {
    it('should detect FAILING state when cluster is failing', () => {
      const cv = createCV({
        status: {
          ...createCV().status,
          conditions: [
            {
              type: 'Failing',
              status: 'True',
              message: 'Cluster upgrade failed',
              lastTransitionTime: '',
            },
          ],
        },
      });

      const result = detectClusterState(cv);

      expect(result.state).toBe(ClusterState.FAILING);
      expect(result.recommendedWorkflow).toBe('status');
      expect(result.conditions.failing).toBe(true);
    });

    it('should detect OPERATOR_ISSUES state when operators have issues', () => {
      const cv = createCV();
      const operators = [
        createOperator('kube-apiserver', true, false),
        createOperator('network', false, false), // unavailable
      ];

      const result = detectClusterState(cv, operators);

      expect(result.state).toBe(ClusterState.OPERATOR_ISSUES);
      expect(result.recommendedWorkflow).toBe('status');
      expect(result.conditions.hasOperatorIssues).toBe(true);
    });

    it('should show status workflow when failing', () => {
      const cv = createCV({
        status: {
          ...createCV().status,
          conditions: [{ type: 'Failing', status: 'True', lastTransitionTime: '' }],
        },
      });

      expect(shouldShowStatus(cv)).toBe(true);
      expect(shouldShowPreCheck(cv)).toBe(false);
      expect(isClusterHealthy(cv)).toBe(false);
    });
  });

  describe('Scenario 5: Up-to-date', () => {
    it('should detect UP_TO_DATE state', () => {
      const cv = createCV({
        status: {
          ...createCV().status,
          conditions: [
            { type: 'Failing', status: 'False', lastTransitionTime: '' },
            { type: 'Progressing', status: 'False', lastTransitionTime: '' },
          ],
          history: [
            {
              state: 'Completed',
              version: '4.14.1',
              image: 'quay.io/openshift-release-dev/ocp-release:4.14.1',
              verified: false,
              startedTime: '',
              completionTime: '',
            },
          ],
          desired: { version: '4.14.1', image: '' },
        },
      });

      const result = detectClusterState(cv);

      expect(result.state).toBe(ClusterState.UP_TO_DATE);
      expect(result.recommendedWorkflow).toBe('pre-check');
      expect(result.conditions.failing).toBe(false);
      expect(result.conditions.progressing).toBe(false);
      expect(result.conditions.hasRecommendedUpdates).toBe(false);
    });
  });

  describe('Additional States', () => {
    it('should detect NOT_UPGRADEABLE state', () => {
      const cv = createCV({
        status: {
          ...createCV().status,
          conditions: [
            { type: 'Failing', status: 'False', lastTransitionTime: '' },
            { type: 'Progressing', status: 'False', lastTransitionTime: '' },
            {
              type: 'Upgradeable',
              status: 'False',
              message: 'Cluster is not upgradeable',
              lastTransitionTime: '',
            },
          ],
        },
      });

      const result = detectClusterState(cv);

      expect(result.state).toBe(ClusterState.NOT_UPGRADEABLE);
      expect(result.conditions.upgradeable).toBe(false);
    });

    it('should detect UPDATE_SERVICE_FAILURE state', () => {
      const cv = createCV({
        status: {
          ...createCV().status,
          conditions: [
            { type: 'Failing', status: 'False', lastTransitionTime: '' },
            { type: 'Progressing', status: 'False', lastTransitionTime: '' },
            {
              type: 'RetrievedUpdates',
              status: 'False',
              message: 'Failed to retrieve updates',
              lastTransitionTime: '',
            },
          ],
        },
      });

      const result = detectClusterState(cv);

      expect(result.state).toBe(ClusterState.UPDATE_SERVICE_FAILURE);
      expect(result.conditions.hasUpdateServiceFailure).toBe(true);
    });

    it('should detect INVALID_CONFIGURATION state', () => {
      const cv = createCV({
        status: {
          ...createCV().status,
          conditions: [
            {
              type: 'Invalid',
              status: 'True',
              message: 'Invalid cluster configuration',
              lastTransitionTime: '',
            },
          ],
        },
      });

      const result = detectClusterState(cv);

      expect(result.state).toBe(ClusterState.INVALID_CONFIGURATION);
      expect(result.conditions.invalid).toBe(true);
    });

    it('should detect UNKNOWN_STATE when conditions have unknown status', () => {
      const cv = createCV({
        status: {
          ...createCV().status,
          conditions: [
            { type: 'Failing', status: 'Unknown', lastTransitionTime: '' },
            { type: 'Available', status: 'Unknown', lastTransitionTime: '' },
          ],
        },
      });

      const result = detectClusterState(cv);

      expect(result.state).toBe(ClusterState.UNKNOWN_STATE);
      expect(result.conditions.hasUnknownConditions).toBe(true);
    });
  });

  describe('Cluster Health', () => {
    it('should report healthy cluster', () => {
      const cv = createCV({
        status: {
          ...createCV().status,
          conditions: [
            { type: 'Failing', status: 'False', lastTransitionTime: '' },
            { type: 'Available', status: 'True', lastTransitionTime: '' },
          ],
        },
      });
      const operators = [createOperator('kube-apiserver', true, false)];

      expect(isClusterHealthy(cv, operators)).toBe(true);
    });

    it('should report unhealthy when failing', () => {
      const cv = createCV({
        status: {
          ...createCV().status,
          conditions: [{ type: 'Failing', status: 'True', lastTransitionTime: '' }],
        },
      });

      expect(isClusterHealthy(cv)).toBe(false);
    });

    it('should report unhealthy when operators have issues', () => {
      const cv = createCV();
      const operators = [createOperator('network', true, true)]; // degraded

      expect(isClusterHealthy(cv, operators)).toBe(false);
    });
  });
});
