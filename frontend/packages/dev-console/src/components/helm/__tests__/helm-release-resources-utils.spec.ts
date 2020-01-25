import { flattenResources } from '../helm-release-resources-utils';
import { resources, flattenedResources } from './helm-release-resources-utils.data';

describe('Helm Release Resources utils', () => {
  it('should omit resources with no data and flatten them', () => {
    expect(flattenResources(resources)).toEqual(flattenedResources);
  });
});
