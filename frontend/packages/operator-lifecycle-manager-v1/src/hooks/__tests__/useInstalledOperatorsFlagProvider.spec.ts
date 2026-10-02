import { FLAG_TECH_PREVIEW } from '@console/app/src/consts';
import {
  FLAG_CLUSTER_EXTENSION_API,
  FLAG_INSTALLED_OPERATORS,
  FLAG_OPERATOR_LIFECYCLE_MANAGER,
} from '../../const';
import useInstalledOperatorsFlagProvider from '../useInstalledOperatorsFlagProvider';

const mockUseFlag = jest.fn();
jest.mock('@console/dynamic-plugin-sdk/src/utils/flags', () => ({
  useFlag: (flag: string) => mockUseFlag(flag),
}));

const setFlags = (flags: Record<string, boolean>) =>
  mockUseFlag.mockImplementation((flag: string) => flags[flag]);

describe('useInstalledOperatorsFlagProvider', () => {
  it.each`
    clusterExtensionAPI | operatorLifecycleManager | expected
    ${true}             | ${true}                  | ${true}
    ${true}             | ${false}                 | ${true}
    ${false}            | ${true}                  | ${true}
    ${false}            | ${false}                 | ${false}
  `(
    'should set the flag to $expected when OLMv1 is $clusterExtensionAPI and OLMv0 is $operatorLifecycleManager',
    ({ clusterExtensionAPI, operatorLifecycleManager, expected }) => {
      setFlags({
        [FLAG_TECH_PREVIEW]: true,
        [FLAG_CLUSTER_EXTENSION_API]: clusterExtensionAPI,
        [FLAG_OPERATOR_LIFECYCLE_MANAGER]: operatorLifecycleManager,
      });
      const setFeatureFlag = jest.fn();

      useInstalledOperatorsFlagProvider(setFeatureFlag);

      expect(setFeatureFlag).toHaveBeenCalledWith(FLAG_INSTALLED_OPERATORS, expected);
    },
  );

  // The tabbed page is Tech Preview only, no matter which OLMs are installed.
  it('should set the flag to false outside Tech Preview', () => {
    setFlags({
      [FLAG_CLUSTER_EXTENSION_API]: true,
      [FLAG_OPERATOR_LIFECYCLE_MANAGER]: true,
    });
    const setFeatureFlag = jest.fn();

    useInstalledOperatorsFlagProvider(setFeatureFlag);

    expect(setFeatureFlag).toHaveBeenCalledWith(FLAG_INSTALLED_OPERATORS, false);
  });

  // Flags are undefined until model discovery resolves; the page must stay hidden until then.
  it('should set the flag to false while the model flags are unresolved', () => {
    setFlags({});
    const setFeatureFlag = jest.fn();

    useInstalledOperatorsFlagProvider(setFeatureFlag);

    expect(setFeatureFlag).toHaveBeenCalledWith(FLAG_INSTALLED_OPERATORS, false);
  });
});
