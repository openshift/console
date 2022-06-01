import { getPluginManifest } from '../../utils/test-utils';
import { getPluginID } from '../plugin-utils';

describe('getPluginID', () => {
  it('returns a string formatted as {name}@{version}', () => {
    expect(getPluginID(getPluginManifest('Test', '1.2.3'))).toBe('Test@1.2.3');
  });
});
