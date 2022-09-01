import { sharedPluginModules } from '../shared-modules';
import { initSharedPluginModules } from '../shared-modules-init';
import { getEntryModuleMocks } from '../utils/test-utils';

describe('initSharedPluginModules', () => {
  it('is consistent with sharedPluginModules definition', () => {
    const [, entryModule] = getEntryModuleMocks({});

    initSharedPluginModules(entryModule);

    expect(entryModule.init).toHaveBeenCalledTimes(1);

    expect(new Set(Object.keys(entryModule.init.mock.calls[0][0]))).toEqual(
      new Set(sharedPluginModules),
    );
  });

  it('supports plugins built with an older version of plugin SDK', () => {
    const [, entryModule] = getEntryModuleMocks({});
    entryModule.override = jest.fn();

    initSharedPluginModules(entryModule);

    expect(entryModule.override).toHaveBeenCalledTimes(1);
    expect(entryModule.init).not.toHaveBeenCalled();

    expect(new Set(Object.keys(entryModule.override.mock.calls[0][0]))).toEqual(
      new Set(sharedPluginModules),
    );
  });
});
