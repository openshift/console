import {
  getClusterResourceListPath,
  isOnClusterResourceListPage,
} from '../delete-namespace-modal-utils';

describe('isOnClusterResourceListPage', () => {
  it('returns true for the Projects list path', () => {
    expect(isOnClusterResourceListPage('/k8s/cluster/projects', 'projects')).toBe(true);
  });

  it('returns true when the list path has a trailing slash', () => {
    expect(isOnClusterResourceListPage('/k8s/cluster/projects/', 'projects')).toBe(true);
  });

  it('returns false for a project details path', () => {
    expect(isOnClusterResourceListPage('/k8s/cluster/projects/my-app', 'projects')).toBe(false);
  });

  it('returns false for a namespaced page of the deleted project', () => {
    expect(isOnClusterResourceListPage('/k8s/ns/my-app/pods', 'projects')).toBe(false);
  });
});

describe('getClusterResourceListPath', () => {
  it('builds the cluster-scoped list path from the model plural', () => {
    expect(getClusterResourceListPath('projects')).toBe('/k8s/cluster/projects');
    expect(getClusterResourceListPath('namespaces')).toBe('/k8s/cluster/namespaces');
  });
});
