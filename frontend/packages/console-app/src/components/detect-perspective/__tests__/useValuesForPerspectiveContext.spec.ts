import {
  acmPerspectiveExtension,
  mockPerspectiveExtensions,
} from '@console/dynamic-plugin-sdk/src/perspective/__tests__/perspective.data';
import { usePerspectiveExtension, usePerspectives } from '@console/shared/src';
import { renderHookWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { ACM_PERSPECTIVE_ID } from '../../../consts';
import { usePreferredPerspective } from '../../user-preferences/perspective/usePreferredPerspective';
import { useLastPerspective } from '../useLastPerspective';
import { useValuesForPerspectiveContext } from '../useValuesForPerspectiveContext';

jest.mock('@console/shared/src/hooks/perspective-utils', () => ({
  usePerspectiveExtension: jest.fn(),
  usePerspectives: jest.fn(),
}));

jest.mock('@console/shared/src/hooks/useTelemetry', () => ({
  useTelemetry: jest.fn(),
}));

jest.mock('../useLastPerspective', () => ({
  useLastPerspective: jest.fn(),
}));

jest.mock('../../user-preferences/perspective/usePreferredPerspective', () => ({
  usePreferredPerspective: jest.fn(),
}));

const usePerspectiveExtensionMock = usePerspectiveExtension as jest.Mock;
const usePerspectivesMock = usePerspectives as jest.Mock;
const useLastPerspectiveMock = useLastPerspective as jest.Mock;
const usePreferredPerspectiveMock = usePreferredPerspective as jest.Mock;

describe('useValuesForPerspectiveContext', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should return undefined for PerspectiveType if the perspective from user preference does not match any of the perspectives received from extensions', () => {
    usePerspectivesMock.mockReturnValue(mockPerspectiveExtensions);
    useLastPerspectiveMock.mockReturnValue(['foo', jest.fn(), true]);
    usePreferredPerspectiveMock.mockReturnValue([undefined, jest.fn(), true]);
    usePerspectiveExtensionMock.mockReturnValue(acmPerspectiveExtension);
    const { result } = renderHookWithProviders(() => useValuesForPerspectiveContext());
    const [perspective] = result.current;
    expect(perspective).toBe('');
  });

  it('should return undefined for PerspectiveType and false for loaded if preferred or last viewed perspective has not yet loaded', () => {
    usePerspectivesMock.mockReturnValue(mockPerspectiveExtensions);
    useLastPerspectiveMock.mockReturnValue(['dev', jest.fn(), false]);
    usePreferredPerspectiveMock.mockReturnValue(['admin', jest.fn(), true]);
    usePerspectiveExtensionMock.mockReturnValue(acmPerspectiveExtension);
    let { result } = renderHookWithProviders(() => useValuesForPerspectiveContext());
    let [perspective, , loaded] = result.current;
    expect(perspective).toBe('');
    expect(loaded).toBeFalsy();

    jest.resetAllMocks();

    usePerspectivesMock.mockReturnValue(mockPerspectiveExtensions);
    useLastPerspectiveMock.mockReturnValue(['dev', jest.fn(), true]);
    usePreferredPerspectiveMock.mockReturnValue(['admin', jest.fn(), false]);
    usePerspectiveExtensionMock.mockReturnValue(acmPerspectiveExtension);
    ({ result } = renderHookWithProviders(() => useValuesForPerspectiveContext()));
    [perspective, , loaded] = result.current;
    expect(perspective).toBe('');
    expect(loaded).toBeFalsy();
  });

  it('should return preferred perspective if it exists and matches one of the perspectives received from extensions', () => {
    usePerspectivesMock.mockReturnValue(mockPerspectiveExtensions);
    useLastPerspectiveMock.mockReturnValue(['dev', jest.fn(), true]);
    usePreferredPerspectiveMock.mockReturnValue(['admin', jest.fn(), true]);
    usePerspectiveExtensionMock.mockReturnValue(acmPerspectiveExtension);
    const { result } = renderHookWithProviders(() => useValuesForPerspectiveContext());
    const [perspective] = result.current;
    expect(perspective).toEqual('admin');
  });

  it('should return last viewed perspective if it matches one of the perspectives received from extensions and preferred perspective does not exist', () => {
    usePerspectivesMock.mockReturnValue(mockPerspectiveExtensions);
    useLastPerspectiveMock.mockReturnValue(['dev', jest.fn(), true]);
    usePreferredPerspectiveMock.mockReturnValue([undefined, jest.fn(), true]);
    usePerspectiveExtensionMock.mockReturnValue(acmPerspectiveExtension);
    const { result } = renderHookWithProviders(() => useValuesForPerspectiveContext());
    const [perspective] = result.current;
    expect(perspective).toEqual('dev');
  });

  it(`should return active perspective if it exists`, () => {
    usePerspectivesMock.mockReturnValue(mockPerspectiveExtensions);
    useLastPerspectiveMock.mockReturnValue(['dev', jest.fn(), true]);
    usePreferredPerspectiveMock.mockReturnValue(['dev', jest.fn(), true]);
    usePerspectiveExtensionMock.mockReturnValue(acmPerspectiveExtension);
    const { result } = renderHookWithProviders(() => useValuesForPerspectiveContext());
    const [perspective] = result.current;
    expect(perspective).toEqual('dev');
  });

  it(`should return ${ACM_PERSPECTIVE_ID} perspective if it exists and last viewed or preferred perspectives do not exist`, () => {
    usePerspectivesMock.mockReturnValue(mockPerspectiveExtensions);
    useLastPerspectiveMock.mockReturnValue([undefined, jest.fn(), true]);
    usePreferredPerspectiveMock.mockReturnValue([undefined, jest.fn(), true]);
    usePerspectiveExtensionMock.mockReturnValue(acmPerspectiveExtension);
    const { result } = renderHookWithProviders(() => useValuesForPerspectiveContext());
    const [perspective] = result.current;
    expect(perspective).toEqual(ACM_PERSPECTIVE_ID);
  });
});
