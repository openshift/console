import { cloudShellSetupValidation, CREATE_NAMESPACE_KEY } from '../cloud-shell-setup-utils';

describe('cloud-shell-setup-utils', () => {
  it('should validate the setup form data', () => {
    expect(cloudShellSetupValidation({})).toEqual({ namespace: 'Required' });
    expect(cloudShellSetupValidation({ namespace: 'test' })).toEqual({});
    expect(cloudShellSetupValidation({ namespace: CREATE_NAMESPACE_KEY })).toEqual({
      newNamespace: 'Required',
    });
    expect(
      cloudShellSetupValidation({ namespace: CREATE_NAMESPACE_KEY, newNamespace: 'test' }),
    ).toEqual({});
  });
});
