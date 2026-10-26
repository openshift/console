import {
  getClusterResourceListPath,
  isOnClusterResourceListPage,
} from '../delete-namespace-modal-utils';

describe('isOnClusterResourceListPage', () => {
  const originalBasePath = window.SERVER_FLAGS.basePath;

  afterEach(() => {
    window.SERVER_FLAGS.basePath = originalBasePath;
  });

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

  it('ignores a non-root console base path', () => {
    window.SERVER_FLAGS.basePath = '/console';
    expect(isOnClusterResourceListPage('/console/k8s/cluster/projects', 'projects')).toBe(true);
    expect(isOnClusterResourceListPage('/console/k8s/cluster/projects/', 'namespaces')).toBe(false);
    expect(isOnClusterResourceListPage('/console/k8s/cluster/namespaces', 'namespaces')).toBe(true);
    expect(isOnClusterResourceListPage('/console/k8s/cluster/projects/my-app', 'projects')).toBe(
      false,
    );
  });

  it('does not treat a longer prefix as the base path', () => {
    window.SERVER_FLAGS.basePath = '/console';
    expect(isOnClusterResourceListPage('/console-extra/k8s/cluster/projects', 'projects')).toBe(
      false,
    );
  });
});

describe('getClusterResourceListPath', () => {
  it('builds the cluster-scoped list path from the model plural', () => {
    expect(getClusterResourceListPath('projects')).toBe('/k8s/cluster/projects');
    expect(getClusterResourceListPath('namespaces')).toBe('/k8s/cluster/namespaces');
  });
});
