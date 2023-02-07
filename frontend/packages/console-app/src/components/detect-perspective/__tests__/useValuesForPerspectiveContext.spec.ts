import * as React from 'react';
import {
  acmPerspectiveExtension,
  mockPerspectiveExtensions,
} from '@console/dynamic-plugin-sdk/src/perspective/__tests__/perspective.data';
import { usePerspectiveExtension, usePerspectives } from '@console/shared/src';
import { ACM_PERSPECTIVE_ID } from '../../../consts';
import { usePreferredPerspective } from '../../user-preferences';
import { useLastPerspective } from '../useLastPerspective';
import { useValuesForPerspectiveContext } from '../useValuesForPerspectiveContext';

jest.mock('@console/shared/src', () => ({
  usePerspectiveExtension: jest.fn(),
  usePerspectives: jest.fn(),
  useTelemetry: jest.fn(),
}));

jest.mock('../useLastPerspective', () => ({
  useLastPerspective: jest.fn(),
}));

jest.mock('../../user-preferences/perspective/usePreferredPerspective', () => ({
  usePreferredPerspective: jest.fn(),
}));

jest.mock('react', () => {
  const reactModule = require.requireActual('react');
  return {
    ...reactModule,
    useState: jest.fn(),
  };
});

const useStateMock = React.useState as jest.Mock;
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
    useStateMock.mockReturnValue(['', jest.fn()]);
    const [perspective, ,] = useValuesForPerspectiveContext();
    expect(perspective).toBeUndefined();
  });

  it('should return undefined for PerspectiveType and false for loaded if preferred or last viewed perspective has not yet loaded', () => {
    usePerspectivesMock.mockReturnValue(mockPerspectiveExtensions);
    useLastPerspectiveMock.mockReturnValue(['dev', jest.fn(), false]);
    usePreferredPerspectiveMock.mockReturnValue(['admin', jest.fn(), true]);
    usePerspectiveExtensionMock.mockReturnValue(acmPerspectiveExtension);
    useStateMock.mockReturnValue(['', jest.fn()]);
    let [perspective, , loaded] = useValuesForPerspectiveContext();
    expect(perspective).toBeUndefined();
    expect(loaded).toBeFalsy();

    jest.resetAllMocks();

    usePerspectivesMock.mockReturnValue(mockPerspectiveExtensions);
    useLastPerspectiveMock.mockReturnValue(['dev', jest.fn(), true]);
    usePreferredPerspectiveMock.mockReturnValue(['admin', jest.fn(), false]);
    usePerspectiveExtensionMock.mockReturnValue(acmPerspectiveExtension);
    useStateMock.mockReturnValue(['', jest.fn()]);
    [perspective, , loaded] = useValuesForPerspectiveContext();
    expect(perspective).toBeUndefined();
    expect(loaded).toBeFalsy();
  });

  it('should return preferred perspective if it exists and matches one of the perspectives received from extensions', () => {
    usePerspectivesMock.mockReturnValue(mockPerspectiveExtensions);
    useLastPerspectiveMock.mockReturnValue(['dev', jest.fn(), true]);
    usePreferredPerspectiveMock.mockReturnValue(['admin', jest.fn(), true]);
    usePerspectiveExtensionMock.mockReturnValue(acmPerspectiveExtension);
    useStateMock.mockReturnValue(['', jest.fn()]);
    const [perspective, ,] = useValuesForPerspectiveContext();
    expect(perspective).toEqual('admin');
  });

  it('should return last viewed perspective if it matches one of the perspectives received from extensions and preferred perspective does not exist', () => {
    usePerspectivesMock.mockReturnValue(mockPerspectiveExtensions);
    useLastPerspectiveMock.mockReturnValue(['dev', jest.fn(), true]);
    usePreferredPerspectiveMock.mockReturnValue([undefined, jest.fn(), true]);
    usePerspectiveExtensionMock.mockReturnValue(acmPerspectiveExtension);
    useStateMock.mockReturnValue(['', jest.fn()]);
    const [perspective, ,] = useValuesForPerspectiveContext();
    expect(perspective).toEqual('dev');
  });

  it(`should return active perspective if it exists`, () => {
    usePerspectivesMock.mockReturnValue(mockPerspectiveExtensions);
    useLastPerspectiveMock.mockReturnValue(['dev', jest.fn(), true]);
    usePreferredPerspectiveMock.mockReturnValue(['dev', jest.fn(), true]);
    usePerspectiveExtensionMock.mockReturnValue(acmPerspectiveExtension);
    useStateMock.mockReturnValue(['admin', jest.fn()]);
    const [perspective, ,] = useValuesForPerspectiveContext();
    expect(perspective).toEqual('admin');
  });

  it(`should return ${ACM_PERSPECTIVE_ID} perspective if it exists and last viewed or preferred perspectives do not exist`, () => {
    usePerspectivesMock.mockReturnValue(mockPerspectiveExtensions);
    useLastPerspectiveMock.mockReturnValue([undefined, jest.fn(), true]);
    usePreferredPerspectiveMock.mockReturnValue([undefined, jest.fn(), true]);
    usePerspectiveExtensionMock.mockReturnValue(acmPerspectiveExtension);
    useStateMock.mockReturnValue([ACM_PERSPECTIVE_ID, jest.fn()]);
    const [perspective, ,] = useValuesForPerspectiveContext();
    expect(perspective).toEqual(ACM_PERSPECTIVE_ID);
  });
});
