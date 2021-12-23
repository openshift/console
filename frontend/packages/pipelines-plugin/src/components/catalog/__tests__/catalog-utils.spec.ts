import { tekonHubPlatformTasks } from '../../../test-data/catalog-item-data';
import { filterBySupportedPlatforms } from '../catalog-utils';

describe('catalog-utils', () => {
  const sampleTekonhubTasks = Object.values(tekonHubPlatformTasks);

  describe('filterBySupportedPlatforms', () => {
    afterEach(function() {
      window.SERVER_FLAGS.GOOS = '';
      window.SERVER_FLAGS.GOARCH = '';
    });

    it('should return empty if the GOOS and GOARCH is not set in the SERVER_FLAGS', () => {
      expect(sampleTekonhubTasks.filter(filterBySupportedPlatforms)).toHaveLength(0);
    });

    it('should return on the tasks that are matching the cluster platform', () => {
      window.SERVER_FLAGS.GOOS = 'linux';
      window.SERVER_FLAGS.GOARCH = 'amd64';
      expect(sampleTekonhubTasks.filter(filterBySupportedPlatforms)).toHaveLength(2);
    });

    it('should return on the tasks that are matching the IBM Z architecture', () => {
      window.SERVER_FLAGS.GOOS = 'linux';
      window.SERVER_FLAGS.GOARCH = 's390x';
      expect(sampleTekonhubTasks.filter(filterBySupportedPlatforms)).toHaveLength(1);
    });
  });
});
