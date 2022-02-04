import { sharedPluginModules } from '../shared-modules';
import { initSharedPluginModules } from '../shared-modules-init';
import { getEntryModuleMocks } from '../utils/test-utils';

describe('initSharedPluginModules', () => {
  const expectSameValues = (arr1: string[], arr2: string[]) => {
    expect(new Set(arr1)).toEqual(new Set(arr2));
  };

  it('is consistent with sharedPluginModules definition', () => {
    const [, entryModule] = getEntryModuleMocks({});

    initSharedPluginModules(entryModule as any);

    expect(entryModule.init).toHaveBeenCalledTimes(1);

    expectSameValues(Object.keys(entryModule.init.mock.calls[0][0]), sharedPluginModules);
  });

  it('supports plugins built with an older version of plugin SDK', () => {
    const [, entryModule] = getEntryModuleMocks({});
    entryModule.override = jest.fn();

    initSharedPluginModules(entryModule as any);

    expect(entryModule.override).toHaveBeenCalledTimes(1);
    expect(entryModule.init).not.toHaveBeenCalled();

    expectSameValues(Object.keys(entryModule.override.mock.calls[0][0]), sharedPluginModules);
  });
});
