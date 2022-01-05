import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import { testHook } from '../../../../../../__tests__/utils/hooks-utils';
import { tekonHubPlatformTasks } from '../../../test-data/catalog-item-data';
import {
  IntegrationTypes,
  tektonHubIntegrationConfigs,
} from '../../../test-data/tekon-config-data';
import { filterBySupportedPlatforms, useTektonHubIntegration } from '../catalog-utils';

jest.mock('@console/internal/components/utils/k8s-get-hook', () => ({
  useK8sGet: jest.fn(),
}));

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

  describe('useTektonHubIntegration', () => {
    it('Integration should be enabled if the config does not contain hub object', () => {
      testHook(() => {
        (useK8sGet as jest.Mock).mockReturnValue([{ spec: {} }, true, null]);
        const tektonHubTasksEnabled = useTektonHubIntegration();
        expect(tektonHubTasksEnabled).toBe(true);
      });
    });

    it('Integration should be enabled if the config does not contain devconsole integration key', () => {
      testHook(() => {
        (useK8sGet as jest.Mock).mockReturnValue([
          tektonHubIntegrationConfigs[IntegrationTypes.MISSING_INTEGRATION_KEY],
          true,
        ]);
        const tektonHubTasksEnabled = useTektonHubIntegration();
        expect(tektonHubTasksEnabled).toBe(true);
      });
    });

    it('Integration should be enabled if the config for devconsole integration key is available and set to true', () => {
      testHook(() => {
        (useK8sGet as jest.Mock).mockReturnValue([
          tektonHubIntegrationConfigs[IntegrationTypes.ENABLED],
          true,
        ]);
        const tektonHubTasksEnabled = useTektonHubIntegration();
        expect(tektonHubTasksEnabled).toBe(true);
      });
    });

    it('Integration should be enabled by default if the fetch call errors out', () => {
      testHook(() => {
        (useK8sGet as jest.Mock).mockReturnValue([
          tektonHubIntegrationConfigs[IntegrationTypes.ENABLED],
          true,
          { error: 'cannot be fetched' },
        ]);
        const tektonHubTasksEnabled = useTektonHubIntegration();
        expect(tektonHubTasksEnabled).toBe(true);
      });
    });

    it('Integration should be disabled if the config for devconsole integration key is available and set to false', () => {
      testHook(() => {
        (useK8sGet as jest.Mock).mockReturnValue([
          tektonHubIntegrationConfigs[IntegrationTypes.DISABLED],
          true,
        ]);
        const tektonHubTasksEnabled = useTektonHubIntegration();
        expect(tektonHubTasksEnabled).toBe(false);
      });
    });
  });
});
