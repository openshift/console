import {coFetchJSON} from '../../co-fetch';

const ADMIN_RESOURCES = new Set(
  ['roles', 'rolebindings', 'clusterroles', 'clusterrolebindings', 'thirdpartyresources', 'nodes', 'secrets']
);

export const getResources = () => coFetchJSON('api/kubernetes/')
  .then(res => {
    const {paths} = res;
    const apiPaths = new Set();

    paths
      // only /api or /apis
      .filter(p => p.startsWith('/api'))
      // no need for both /api and /api/v1
      .forEach(p => {
        const parts = p.split('/');
        const parent = parts.slice(0, parts.length - 1).join('/');
        apiPaths.delete(parent);
        apiPaths.add(p);
      });

    const all = [...apiPaths]
      .map(p => coFetchJSON(`api/kubernetes${p}`).catch(err => err));

    return Promise.all(all)
      .then(data => {
        const resourceSet = new Set();
        const namespacedSet = new Set();
        data.forEach(d => d.resources && d.resources.forEach(({namespaced, name}) => {
          resourceSet.add(name);
          namespaced && namespacedSet.add(name);
        }));
        const allResources = [...resourceSet].sort();

        const safeResources = [];
        const adminResources = [];

        allResources.forEach(r => ADMIN_RESOURCES.has(r.split('/')[0]) ? adminResources.push(r) : safeResources.push(r));
        return {allResources, safeResources, adminResources, namespacedSet};
      });
  });
