import { setUtilsConfig, getUtilsConfig } from '../configSetup';

describe('configSetup', () => {
  it('getUtilsConfig should throw an error if config is not set', () => {
    try {
      getUtilsConfig();
    } catch (e) {
      expect(e.message).toEqual('setUtilsConfig has not been called');
    }
  });

  it('getUtilsConfig should provide the config if config has been set', () => {
    const configOptions = { appFetch: jest.fn() };
    setUtilsConfig(configOptions);
    const configData = getUtilsConfig();
    expect(configData).toEqual(configOptions);
  });

  it('should throw an error if setUtilsConfig is called and config is already defined', () => {
    try {
      const configOptions = { appFetch: jest.fn() };
      setUtilsConfig(configOptions);
    } catch (e) {
      expect(e.message).toEqual('setUtilsConfig has already been called');
    }
  });
});
