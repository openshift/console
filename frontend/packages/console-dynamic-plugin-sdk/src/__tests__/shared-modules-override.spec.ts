import { sharedPluginModules } from '../shared-modules';
import { overrideSharedModules } from '../shared-modules-override';
import { getEntryModuleMocks } from '../utils/test-utils';

describe('overrideSharedModules', () => {
  it('is consistent with sharedPluginModules', () => {
    const [, entryModule] = getEntryModuleMocks({});

    overrideSharedModules(entryModule);

    expect(entryModule.override.mock.calls.length).toBe(1);

    expect(new Set(sharedPluginModules)).toEqual(
      new Set(Object.keys(entryModule.override.mock.calls[0][0])),
    );
  });
});
