import { sharedPluginModules } from '../console-shared-modules';
import { sharedDynamicModules } from '../dynamic-shared-modules';

describe('sharedDynamicModules', () => {
  it('does not contain any Console provided shared modules', () => {
    sharedPluginModules.forEach((m) => {
      expect(sharedDynamicModules).not.toContain(m);
    });
  });
});
