import { getEntryModuleMocks } from '../../utils/test-utils';
import { sharedPluginModules } from '../shared-modules-meta';
import { initSharedPluginModules } from '../shared-modules-init';

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
