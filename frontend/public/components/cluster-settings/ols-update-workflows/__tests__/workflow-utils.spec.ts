import { determineWorkflowPhase } from '../workflow-utils';
import type { ClusterVersionKind } from '@console/internal/module/k8s';

describe('determineWorkflowPhase', () => {
  const createMockClusterVersion = (conditions: any[] = []): ClusterVersionKind =>
    ({
      status: { conditions },
    } as ClusterVersionKind);

  describe('status phase detection (includes failure conditions)', () => {
    it('should return status when Failing condition is True', () => {
      const cv = createMockClusterVersion([{ type: 'Failing', status: 'True' }]);

      const phase = determineWorkflowPhase(cv);

      expect(phase).toBe('status');
    });

    it('should return status when ReleaseAccepted is False with message', () => {
      const cv = createMockClusterVersion([
        { type: 'ReleaseAccepted', status: 'False', message: 'Error occurred' },
      ]);

      const phase = determineWorkflowPhase(cv);

      expect(phase).toBe('status');
    });

    it('should return status when RetrievedUpdates is False with message', () => {
      const cv = createMockClusterVersion([
        { type: 'RetrievedUpdates', status: 'False', message: 'Error occurred' },
      ]);

      const phase = determineWorkflowPhase(cv);

      expect(phase).toBe('status');
    });

    it('should return status when Invalid is True', () => {
      const cv = createMockClusterVersion([{ type: 'Invalid', status: 'True' }]);

      const phase = determineWorkflowPhase(cv);

      expect(phase).toBe('status');
    });
  });

  describe('status phase detection', () => {
    it('should return status when Progressing is True and no failure conditions', () => {
      const cv = createMockClusterVersion([
        { type: 'Progressing', status: 'True' },
        { type: 'ReleaseAccepted', status: 'True' },
      ]);

      const phase = determineWorkflowPhase(cv);

      expect(phase).toBe('status');
    });
  });

  describe('pre-check phase detection', () => {
    it('should return pre-check when cluster is healthy (no failure conditions, not progressing)', () => {
      const cv = createMockClusterVersion([
        { type: 'Available', status: 'True' },
        { type: 'Progressing', status: 'False' },
        { type: 'ReleaseAccepted', status: 'True' },
        { type: 'Failing', status: 'False' },
      ]);

      const phase = determineWorkflowPhase(cv);

      expect(phase).toBe('pre-check');
    });
  });

  describe('condition priority (all return status phase)', () => {
    it('should return status for multiple problematic conditions (Failing + ReleaseAccepted)', () => {
      const cv = createMockClusterVersion([
        { type: 'Failing', status: 'True' },
        { type: 'ReleaseAccepted', status: 'False', message: 'Error' },
      ]);

      const phase = determineWorkflowPhase(cv);

      expect(phase).toBe('status');
    });

    it('should return status for mixed conditions (ReleaseAccepted + Progressing)', () => {
      const cv = createMockClusterVersion([
        { type: 'ReleaseAccepted', status: 'False', message: 'Error' },
        { type: 'Progressing', status: 'True' },
      ]);

      const phase = determineWorkflowPhase(cv);

      expect(phase).toBe('status');
    });
  });
});
