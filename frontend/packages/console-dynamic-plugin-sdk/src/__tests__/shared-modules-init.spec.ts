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
});
