import { readFile } from 'node:fs/promises';
import type { ExtractedKey } from 'i18next-cli';
import {
  ConsoleExtensionsI18nextCLIPlugin,
  type ConsoleExtensionsI18nextCLIPluginOptions,
} from '../ConsoleExtensionsI18nextCLIPlugin';

jest.mock('node:fs/promises', () => ({
  readFile: jest.fn(),
}));

const mockedReadFile = readFile as unknown as jest.Mock;

function getOnEnd(options?: ConsoleExtensionsI18nextCLIPluginOptions) {
  const { onEnd } = ConsoleExtensionsI18nextCLIPlugin(options);
  if (!onEnd) {
    throw new Error('onEnd is not defined');
  }
  return onEnd;
}

describe('ConsoleExtensionsI18nextCLIPlugin', () => {
  let keys: Map<string, ExtractedKey>;

  beforeEach(() => {
    keys = new Map();
    mockedReadFile.mockReset();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should fail gracefully with invalid JSON', async () => {
    mockedReadFile.mockResolvedValue('{"key": "%test~value%", invalid}');
    const onEnd = getOnEnd({ paths: ['test.json'] });
    await expect(onEnd(keys)).rejects.toThrow();
  });

  it('should parse strings matching pattern `^%.+%$`', async () => {
    mockedReadFile.mockResolvedValue(
      '{"nope": false, "foo": "%ns~bar%", "test": ["%ns~arr1%", "%ns~arr2%", "arr3"]}',
    );
    const onEnd = getOnEnd({ paths: ['test.json'] });
    await onEnd(keys);
    expect([...keys.values()]).toEqual([
      { key: 'bar', defaultValue: 'bar', ns: 'ns' },
      { key: 'arr1', defaultValue: 'arr1', ns: 'ns' },
      { key: 'arr2', defaultValue: 'arr2', ns: 'ns' },
    ]);
  });

  it('should parse json with comments', async () => {
    mockedReadFile.mockResolvedValue(
      `{"nope": false,
      // comment
      "foo": "%ns~bar%", "test": ["%ns~arr1%",
      // comment
      "%ns~arr2%", "arr3"]}`,
    );
    const onEnd = getOnEnd({ paths: ['test.json'] });
    await onEnd(keys);
    expect([...keys.values()]).toEqual([
      { key: 'bar', defaultValue: 'bar', ns: 'ns' },
      { key: 'arr1', defaultValue: 'arr1', ns: 'ns' },
      { key: 'arr2', defaultValue: 'arr2', ns: 'ns' },
    ]);
  });

  it('should warn on keys without namespace separator', async () => {
    mockedReadFile.mockResolvedValue('{"key": "%nonamespace%"}');
    const onEnd = getOnEnd({ paths: ['test.json'] });
    await onEnd(keys);
    expect(keys.size).toBe(0);
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Invalid key format'));
  });

  it('should treat everything after the first ~ as the key', async () => {
    mockedReadFile.mockResolvedValue('{"key": "%ns~key~suffix%"}');
    const onEnd = getOnEnd({ paths: ['test.json'] });
    await onEnd(keys);
    expect([...keys.values()]).toEqual([
      { key: 'key~suffix', defaultValue: 'key~suffix', ns: 'ns' },
    ]);
  });

  it('should warn and skip when file cannot be read', async () => {
    mockedReadFile.mockRejectedValue(new Error('ENOENT'));
    const onEnd = getOnEnd({ paths: ['missing.json'] });
    await onEnd(keys);
    expect(keys.size).toBe(0);
    expect(console.warn).toHaveBeenCalled();
  });
});
