import { isIdled, isKnativeServing, getPodStatus } from '../pod-utils';
import {
  deploymentConfig,
  notIdledDeploymentConfig,
  deployment,
  mockPod,
} from '../__mocks__/pod-utils-test-data';

describe('Pod Utils:', () => {
  it('isIdle should return true', () => {
    expect(isIdled(deploymentConfig)).toBe(true);
  });

  it('isIdle should return false', () => {
    expect(isIdled(notIdledDeploymentConfig)).toBe(false);
  });

  it('isKnative serving should return true', () => {
    expect(isKnativeServing(deployment, 'metadata.labels')).toBe(true);
  });

  it('getPodStatus should return `running` phase', () => {
    expect(getPodStatus(mockPod)).toBe('Running');
  });

  it('getPodStatus should return `terminating` phase', () => {
    const mData = { ...mockPod, metadata: { deletionTimestamp: 'mock' } };
    expect(getPodStatus(mData)).toBe('Terminating');
  });

  it('getPodStatus should return `pending` phase', () => {
    const mData = { ...mockPod, status: { phase: 'Pending' } };
    expect(getPodStatus(mData)).toBe('Pending');
  });
});
