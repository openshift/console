import { useExtensions } from '@console/plugin-sdk';
import { useUserSettingsCompatibility } from '@console/shared';
import { usePreferredPerspective } from '../../user-preferences';
import { useValuesForPerspectiveContext } from '../useValuesForPerspectiveContext';
import { mockPerspectiveExtensions } from './perspective.data';

jest.mock('@console/plugin-sdk/src/api/useExtensions', () => ({
  useExtensions: jest.fn(),
}));

jest.mock('@console/shared/src/hooks/useUserSettingsCompatibility', () => ({
  useUserSettingsCompatibility: jest.fn(),
}));

jest.mock('../../user-preferences/perspective/usePreferredPerspective', () => ({
  usePreferredPerspective: jest.fn(),
}));

const useExtensionsMock = useExtensions as jest.Mock;
const useUserSettingsCompatibilityMock = useUserSettingsCompatibility as jest.Mock;
const usePreferredPerspectiveMock = usePreferredPerspective as jest.Mock;

describe('useValuesForPerspectiveContext', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should return undefined for PerspectiveType if the perspective from user settings does not match any of the perspectives received from extensions', () => {
    useExtensionsMock.mockReturnValue(mockPerspectiveExtensions);
    useUserSettingsCompatibilityMock.mockReturnValue(['acm', () => {}, true]);
    usePreferredPerspectiveMock.mockReturnValue(['latest', true]);
    const [perspective, ,] = useValuesForPerspectiveContext();
    expect(perspective).toBeUndefined();
  });

  it('should return undefined for PerspectiveType and false for loaded if any one of the user settings for preferred or last viewed perspective has not yet loaded', () => {
    useExtensionsMock.mockReturnValue(mockPerspectiveExtensions);
    useUserSettingsCompatibilityMock.mockReturnValue(['dev', () => {}, false]);
    usePreferredPerspectiveMock.mockReturnValue(['admin', true]);
    let [perspective, , loaded] = useValuesForPerspectiveContext();
    expect(perspective).toBeUndefined();
    expect(loaded).toBeFalsy();

    jest.resetAllMocks();

    useExtensionsMock.mockReturnValue(mockPerspectiveExtensions);
    useUserSettingsCompatibilityMock.mockReturnValue(['dev', () => {}, true]);
    usePreferredPerspectiveMock.mockReturnValue(['admin', false]);
    [perspective, , loaded] = useValuesForPerspectiveContext();
    expect(perspective).toBeUndefined();
    expect(loaded).toBeFalsy();
  });

  it('should return preferred perspective from user settings for PerspectiveType if it exists and has a value other than "latest" as well as matches one of the perspectives received from extensions', () => {
    useExtensionsMock.mockReturnValue(mockPerspectiveExtensions);
    useUserSettingsCompatibilityMock.mockReturnValue(['dev', () => {}, true]);
    usePreferredPerspectiveMock.mockReturnValue(['admin', true]);
    const [perspective, ,] = useValuesForPerspectiveContext();
    expect(perspective).toEqual('admin');
  });
  it('should return last viewed perspective from user settings for PerspectiveType if it matches one of the perspectives received from extensions and preferred perspective does not exist', () => {
    useExtensionsMock.mockReturnValue(mockPerspectiveExtensions);
    useUserSettingsCompatibilityMock.mockReturnValue(['dev', () => {}, true]);
    usePreferredPerspectiveMock.mockReturnValue([undefined, true]);
    const [perspective, ,] = useValuesForPerspectiveContext();
    expect(perspective).toEqual('dev');
  });
  it('should return last viewed perspective from user settings for PerspectiveType if it matches one of the perspectives received from extensions and preferred perspective has value "latest"', () => {
    useExtensionsMock.mockReturnValue(mockPerspectiveExtensions);
    useUserSettingsCompatibilityMock.mockReturnValue(['dev', () => {}, true]);
    usePreferredPerspectiveMock.mockReturnValue(['latest', true]);
    const [perspective, ,] = useValuesForPerspectiveContext();
    expect(perspective).toEqual('dev');
  });
});
