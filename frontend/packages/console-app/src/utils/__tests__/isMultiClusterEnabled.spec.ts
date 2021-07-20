import isMultiClusterEnabled from '../isMultiClusterEnabled';

describe('isMultiClusterEnabled', () => {
  it('should return false when no flag data exists', () => {
    window.SERVER_FLAGS.clusters = undefined;
    const isEnabled = isMultiClusterEnabled();
    expect(isEnabled).toBe(false);
  });
  it('should return false when only one cluster exists', () => {
    window.SERVER_FLAGS.clusters = ['clustera'];
    const isEnabled = isMultiClusterEnabled();
    expect(isEnabled).toBe(false);
  });
  it('should return true when multi clusters exist', () => {
    window.SERVER_FLAGS.clusters = ['clustera', 'clusterb'];
    const isEnabled = isMultiClusterEnabled();
    expect(isEnabled).toBe(true);
  });
});
