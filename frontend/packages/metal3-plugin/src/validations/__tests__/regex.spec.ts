import { MAC_REGEX, RESOURCE_NAME_REGEX } from '../regex';

describe('resource name regex', () => {
  it('should match valid resource names', () => {
    const validNames = [
      'appname',
      'app-name',
      'app-name123',
      'app-name123-app',
      'app.name',
      'app.name.foo',
      'app.name123',
    ];
    validNames.forEach((name) => expect(name).toMatch(RESOURCE_NAME_REGEX));
  });

  it('should not match invalid resource names', () => {
    const invalidNames = [
      'AppName',
      '-app-name',
      'app$name!',
      'app name',
      '',
      '-',
      'app_name',
      'app..name',
    ];
    invalidNames.forEach((name) => expect(name).not.toMatch(RESOURCE_NAME_REGEX));
  });
});

describe('MAC address regex', () => {
  it('should match valid MAC address', () => {
    const validMAC = ['00:B0:D0:63:C2:26'];
    validMAC.forEach((mac) => expect(mac).toMatch(MAC_REGEX));
  });

  it('should not match invalid resource names', () => {
    const invalidNames = [
      '00-B0-D0-63-C2-26',
      '00-B0-D0-63-C2',
      '00:B0:D0:63:C2',
      '00-B0-D0-63-C2-26-ea',
      '00:B0:D0:63:C2:26:ea',
      '003-B0-D0-63-C2-26',
      '003:B0:D0:63:C2:26',
    ];
    invalidNames.forEach((name) => expect(name).not.toMatch(RESOURCE_NAME_REGEX));
  });
});
