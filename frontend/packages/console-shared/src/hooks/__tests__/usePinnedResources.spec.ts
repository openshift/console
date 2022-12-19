import useActivePerspective from '@console/dynamic-plugin-sdk/src/perspective/useActivePerspective';
import { DeploymentModel } from '@console/dynamic-plugin-sdk/src/utils/k8s/__mocks__/k8s-data';
import { ConfigMapModel } from '@console/internal/models';
import { useModelFinder } from '@console/internal/module/k8s/k8s-models';
import { usePerspectives } from '@console/shared/src';
import { testHook } from '../../../../../__tests__/utils/hooks-utils';
import { usePinnedResources } from '../usePinnedResources';
import { useUserSettingsCompatibility } from '../useUserSettingsCompatibility';

const useActivePerspectiveMock = useActivePerspective as jest.Mock;
const usePerspectivesMock = usePerspectives as jest.Mock;
const useUserSettingsCompatibilityMock = useUserSettingsCompatibility as jest.Mock;
const useModelFinderMock = useModelFinder as jest.Mock;
const setPinnedResourcesMock = jest.fn();

jest.mock('@console/shared/src/hooks/perspective-utils', () => ({ usePerspectives: jest.fn() }));
jest.mock('@console/dynamic-plugin-sdk/src/perspective/useActivePerspective', () => ({
  default: jest.fn(),
}));
jest.mock('../useUserSettingsCompatibility', () => ({ useUserSettingsCompatibility: jest.fn() }));
jest.mock('@console/internal/module/k8s/k8s-models', () => ({ useModelFinder: jest.fn() }));

describe('usePinnedResources', () => {
  beforeEach(() => {
    // Return default perspective
    useActivePerspectiveMock.mockClear();
    useActivePerspectiveMock.mockReturnValue(['admin']);

    // Return defaultPins for dev perspective extension
    usePerspectivesMock.mockClear();
    usePerspectivesMock.mockReturnValue([
      {
        type: 'Perspective',
        properties: {
          id: 'dev',
          name: 'Developer',
          defaultPins: [
            { group: '', version: 'v1', kind: 'ConfigMap' },
            { group: '', version: 'v1', kind: 'Secret' },
          ],
        },
      },
    ]);

    useModelFinderMock.mockReturnValue({
      findModel: (group: string, resource: string) => {
        if (group === 'apps' && resource === 'deployments') {
          return DeploymentModel;
        }
        if (group === '' && resource === 'configmaps') {
          return ConfigMapModel;
        }
        return null;
      },
    });
    useUserSettingsCompatibilityMock.mockClear();
    setPinnedResourcesMock.mockClear();
  });

  it('should return default pins from extension if perspectives are not configured', async () => {
    window.SERVER_FLAGS.perspectives = '';
    useActivePerspectiveMock.mockReturnValue(['dev']);
    useUserSettingsCompatibilityMock.mockImplementation((configKey, storageKey, defaultPins) => [
      defaultPins,
      setPinnedResourcesMock,
      true,
    ]);

    const { result } = testHook(() => usePinnedResources());

    // Expect default pins
    expect(result.current).toEqual([
      ['core~v1~ConfigMap', 'core~v1~Secret'],
      expect.any(Function),
      true,
    ]);

    // Setter was not used
    expect(setPinnedResourcesMock).toHaveBeenCalledTimes(0);
  });

  it('should return an empty array if user settings are not loaded yet', async () => {
    window.SERVER_FLAGS.perspectives =
      '[{ "id" : "dev", "visibility": {"state" : "Enabled" }, "pinnedResources" : [{"version" : "v1", "resource" : "deployments"}]}]';
    // Mock user settings
    useUserSettingsCompatibilityMock.mockReturnValue([null, setPinnedResourcesMock, false]);

    const { result } = testHook(() => usePinnedResources());

    // Expect empty data and loaded=false
    expect(result.current).toEqual([[], expect.any(Function), false]);

    // Setter was not used
    expect(setPinnedResourcesMock).toHaveBeenCalledTimes(0);
  });

  it('should not return any pins if no pins are configured and no extension could be found', async () => {
    window.SERVER_FLAGS.perspectives = '[{ "id" : "dev", "visibility": {"state" : "Enabled" }}]';
    // Mock empty old data
    useUserSettingsCompatibilityMock.mockReturnValue([{}, setPinnedResourcesMock, true]);
    usePerspectivesMock.mockClear();
    usePerspectivesMock.mockReturnValue([]);

    const { result } = testHook(() => usePinnedResources());

    // Expect empty array
    expect(result.current).toEqual([[], expect.any(Function), true]);

    // Setter was not used
    expect(setPinnedResourcesMock).toHaveBeenCalledTimes(0);
  });

  it('should not return any pins if no pins are configured and extension donot have default pins', async () => {
    window.SERVER_FLAGS.perspectives = '[{ "id" : "dev", "visibility": {"state" : "Enabled" }}]';
    // Mock empty old data
    useUserSettingsCompatibilityMock.mockReturnValue([{}, setPinnedResourcesMock, true]);
    usePerspectivesMock.mockClear();
    usePerspectivesMock.mockReturnValue([
      {
        type: 'Perspective',
        properties: {
          id: 'dev',
          name: 'Developer',
        },
      },
    ]);

    const { result } = testHook(() => usePinnedResources());

    // Expect empty array
    expect(result.current).toEqual([[], expect.any(Function), true]);

    // Setter was not used
    expect(setPinnedResourcesMock).toHaveBeenCalledTimes(0);
  });

  it('should not return any pins if pins configured is an empty array and the extension has default pins', async () => {
    window.SERVER_FLAGS.perspectives =
      '[{ "id" : "dev", "visibility": {"state" : "Enabled" }, "pinnedResources": []}]';
    // Mock empty old data
    useActivePerspectiveMock.mockReturnValue(['dev']);
    useUserSettingsCompatibilityMock.mockImplementation((configKey, storageKey, defaultPins) => [
      defaultPins,
      setPinnedResourcesMock,
      true,
    ]);

    const { result } = testHook(() => usePinnedResources());

    // Do not expect pins
    expect(result.current).toEqual([[], expect.any(Function), true]);

    // Setter was not used
    expect(setPinnedResourcesMock).toHaveBeenCalledTimes(0);
  });

  it('should return default pins if pins configured is null and the extension has default pins', async () => {
    window.SERVER_FLAGS.perspectives =
      '[{ "id" : "dev", "visibility": {"state" : "Enabled" }, "pinnedResources": null}]';
    // Mock empty old data
    useActivePerspectiveMock.mockReturnValue(['dev']);
    useUserSettingsCompatibilityMock.mockImplementation((configKey, storageKey, defaultPins) => [
      defaultPins,
      setPinnedResourcesMock,
      true,
    ]);

    const { result } = testHook(() => usePinnedResources());

    // Do not expect pins
    expect(result.current).toEqual([
      ['core~v1~ConfigMap', 'core~v1~Secret'],
      expect.any(Function),
      true,
    ]);

    // Setter was not used
    expect(setPinnedResourcesMock).toHaveBeenCalledTimes(0);
  });

  it('should return default pins from extension if there are no pinned resources configured by and the extension has default pins', async () => {
    window.SERVER_FLAGS.perspectives = '[{ "id" : "dev", "visibility": {"state" : "Enabled" }}]';
    // Mock empty old data
    useActivePerspectiveMock.mockReturnValue(['dev']);
    useUserSettingsCompatibilityMock.mockImplementation((configKey, storageKey, defaultPins) => [
      defaultPins,
      setPinnedResourcesMock,
      true,
    ]);

    const { result } = testHook(() => usePinnedResources());

    // Expect default pins
    expect(result.current).toEqual([
      ['core~v1~ConfigMap', 'core~v1~Secret'],
      expect.any(Function),
      true,
    ]);

    // Setter was not used
    expect(setPinnedResourcesMock).toHaveBeenCalledTimes(0);
  });

  it('should return customized pins if the pins are not customized by the user and the extension has default pins', async () => {
    window.SERVER_FLAGS.perspectives =
      '[{ "id" : "dev", "visibility": {"state" : "Enabled" }, "pinnedResources" : [{"version" : "v1", "resource" : "deployments", "group": "apps"}]}]';
    // Mock empty old data
    useActivePerspectiveMock.mockReturnValue(['dev']);
    useUserSettingsCompatibilityMock.mockImplementation((configKey, storageKey, defaultPins) => [
      defaultPins,
      setPinnedResourcesMock,
      true,
    ]);

    const { result } = testHook(() => usePinnedResources());

    // Expect pins customized by the admin
    expect(result.current).toEqual([['apps~v1~Deployment'], expect.any(Function), true]);

    // Setter was not used
    expect(setPinnedResourcesMock).toHaveBeenCalledTimes(0);
  });

  it('should return an array of pins saved in user settings for the current perspective', async () => {
    window.SERVER_FLAGS.perspectives =
      '[{ "id" : "dev", "visibility": {"state" : "Enabled" }, "pinnedResources" : [{"version" : "v1", "resource" : "deployments"}]}]';
    // Mock user settings data
    useActivePerspectiveMock.mockReturnValue(['dev']);
    useUserSettingsCompatibilityMock.mockReturnValue([
      { dev: ['ConfigMap', 'Secret', 'AnotherResource'] },
      setPinnedResourcesMock,
      true,
    ]);

    const { result } = testHook(() => usePinnedResources());

    // Expect pins from user settings
    expect(result.current).toEqual([
      ['ConfigMap', 'Secret', 'AnotherResource'],
      expect.any(Function),
      true,
    ]);

    // Setter was not used
    expect(setPinnedResourcesMock).toHaveBeenCalledTimes(0);
  });

  it('should return configured pins and filter out pins with resources that donot exist', async () => {
    window.SERVER_FLAGS.perspectives =
      '[{ "id" : "dev", "visibility": {"state" : "Enabled" }, "pinnedResources" : [{"version" : "v1", "resource" : "deploymentss", "group" : "apps" },{"version" : "v1", "resource" : "configmaps", "group" : "" } ]}]';
    // Mock user settings data
    useActivePerspectiveMock.mockReturnValue(['dev']);
    useUserSettingsCompatibilityMock.mockReturnValue([{}, setPinnedResourcesMock, true]);

    const { result } = testHook(() => usePinnedResources());

    // Expect pins customized by the admin
    expect(result.current).toEqual([['core~~', 'core~v1~ConfigMap'], expect.any(Function), true]);

    // Setter was not used
    expect(setPinnedResourcesMock).toHaveBeenCalledTimes(0);
  });
});
