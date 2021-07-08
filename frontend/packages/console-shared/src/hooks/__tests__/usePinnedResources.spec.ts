import { useExtensions } from '@console/plugin-sdk';
import { testHook } from '../../../../../__tests__/utils/hooks-utils';
import { useActivePerspective } from '../useActivePerspective';
import { usePinnedResources } from '../usePinnedResources';
import { useUserSettingsCompatibility } from '../useUserSettingsCompatibility';

const useActivePerspectiveMock = useActivePerspective as jest.Mock;
const useExtensionsMock = useExtensions as jest.Mock;
const useUserSettingsCompatibilityMock = useUserSettingsCompatibility as jest.Mock;
const setPinnedResourcesMock = jest.fn();

jest.mock('@console/plugin-sdk', () => ({ useExtensions: jest.fn() }));
jest.mock('../useActivePerspective', () => ({ useActivePerspective: jest.fn() }));
jest.mock('../useUserSettingsCompatibility', () => ({ useUserSettingsCompatibility: jest.fn() }));

describe('usePinnedResources', () => {
  beforeEach(() => {
    // Return default perspective
    useActivePerspectiveMock.mockClear();
    useActivePerspectiveMock.mockReturnValue(['admin']);

    // Return defaultPins for dev perspective extension
    useExtensionsMock.mockClear();
    useExtensionsMock.mockReturnValue([
      {
        type: 'Perspective',
        properties: {
          id: 'dev',
          name: 'Developer',
          defaultPins: [{ kind: 'ConfigMap' }, { kind: 'Secret' }],
        },
      },
    ]);

    useUserSettingsCompatibilityMock.mockClear();
    setPinnedResourcesMock.mockClear();
  });

  it('returns an empty array if user settings are not loaded yet', async () => {
    // Mock user settings
    useUserSettingsCompatibilityMock.mockReturnValue([null, setPinnedResourcesMock, false]);

    const { result } = testHook(() => usePinnedResources());

    // Expect empty data and loaded=false
    expect(result.current).toEqual([[], expect.any(Function), false]);

    // Setter was not used
    expect(setPinnedResourcesMock).toHaveBeenCalledTimes(0);
  });

  it('returns no default pins if there are no other pins defined and no extension could be found', async () => {
    // Mock empty old data
    useUserSettingsCompatibilityMock.mockReturnValue([{}, setPinnedResourcesMock, true]);

    const { result } = testHook(() => usePinnedResources());

    // Expect empty array
    expect(result.current).toEqual([[], expect.any(Function), true]);

    // Setter was not used
    expect(setPinnedResourcesMock).toHaveBeenCalledTimes(0);
  });

  it('returns some default pins if there are no other pins defined and the extension has default pins', async () => {
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
      [{ kind: 'ConfigMap' }, { kind: 'Secret' }],
      expect.any(Function),
      true,
    ]);

    // Setter was not used
    expect(setPinnedResourcesMock).toHaveBeenCalledTimes(0);
  });

  it('returns an array of pins saved in user settings for the current perspective', async () => {
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
});
