import { nameRegex } from '../yup-validations';

describe('nameRegex', () => {
  it('should match valid resource names', () => {
    const validNames = ['appname', 'app-name', 'app-name123', 'app-name123-app'];
    validNames.forEach((name) => expect(name).toMatch(nameRegex));
  });

  it('should not match invalid resource names', () => {
    const invalidNames = [
      'AppName',
      '4appname',
      '-app-name',
      'app$name!',
      'app name',
      'app--name',
      '',
      '-',
    ];
    invalidNames.forEach((name) => expect(name).not.toMatch(nameRegex));
  });
});
