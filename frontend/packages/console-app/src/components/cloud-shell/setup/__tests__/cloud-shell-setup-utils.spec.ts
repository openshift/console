import { CLOUD_SHELL_PROTECTED_NAMESPACE } from '../../cloud-shell-utils';
import {
  CloudShellSetupFormData,
  cloudShellSetupValidationSchema,
  CREATE_NAMESPACE_KEY,
  getCloudShellTimeout,
} from '../cloud-shell-setup-utils';

describe('cloud-shell-setup-utils', async () => {
  it('should validate the form data', async () => {
    const mockData: CloudShellSetupFormData = {
      namespace: CLOUD_SHELL_PROTECTED_NAMESPACE,
      advancedOptions: {
        timeout: {
          limit: 0,
          unit: 'm',
        },
        image: '',
      },
    };
    await cloudShellSetupValidationSchema()
      .resolve({ value: mockData })
      .isValid(mockData)
      .then((valid) => expect(valid).toEqual(true));
  });

  it('should throw an error for required fields if empty', async () => {
    const mockData: CloudShellSetupFormData = {
      namespace: CREATE_NAMESPACE_KEY,
      newNamespace: '',
      advancedOptions: {
        timeout: {
          limit: 0,
          unit: 'm',
        },
        image: '',
      },
    };
    await cloudShellSetupValidationSchema()
      .resolve({ value: mockData })
      .isValid(mockData)
      .then((valid) => expect(valid).toEqual(false));
    await cloudShellSetupValidationSchema()
      .validate(mockData)
      .catch((err) => {
        expect(err.message).toBe(
          "Name must consist of lower case alphanumeric characters or '-' and must start and end with an alphanumeric character.",
        );
      });
  });

  it('getCloudShellTimeout should return proper time', () => {
    expect(getCloudShellTimeout(1, 'h')).toEqual('1h');
    expect(getCloudShellTimeout(30, 's')).toEqual('30s');
    expect(getCloudShellTimeout(3, 'm')).toEqual('3m');
    expect(getCloudShellTimeout(30, 'ms')).toEqual('30ms');
    expect(getCloudShellTimeout(0, 'h')).toEqual(null);
  });
});
