import { cloneDeep } from 'lodash';
import { deployValidationSchema } from '../deployImage-validation-utils';
import { mockDeployImageFormData } from '../__mocks__/deployImage-validation-mock';
import { CREATE_APPLICATION_KEY, UNASSIGNED_KEY } from '../../../const';
import { serverlessCommonTests } from './serverless-common-tests';

describe('Deploy Image ValidationUtils', () => {
  describe('Validation Schema', () => {
    it('should validate the form data', async () => {
      const mockData = cloneDeep(mockDeployImageFormData);
      await deployValidationSchema.isValid(mockData).then((valid) => expect(valid).toEqual(true));
    });

    it('should throw an error for required fields if empty', async () => {
      const mockData = cloneDeep(mockDeployImageFormData);
      mockData.name = '';
      await deployValidationSchema.isValid(mockData).then((valid) => expect(valid).toEqual(false));
      await deployValidationSchema.validate(mockData).catch((err) => {
        expect(err.message).toBe('Required');
        expect(err.type).toBe('required');
      });
    });

    it('should throw an error if name is invalid', async () => {
      const mockData = cloneDeep(mockDeployImageFormData);
      mockData.name = 'app_name';
      await deployValidationSchema.isValid(mockData).then((valid) => expect(valid).toEqual(false));
      await deployValidationSchema.validate(mockData).catch((err) => {
        expect(err.message).toBe(
          'Name must consist of lower-case letters, numbers and hyphens. It must start with a letter and end with a letter or number.',
        );
      });
    });

    it('should throw an error when no application name given for create application option', async () => {
      const mockData = cloneDeep(mockDeployImageFormData);
      mockData.application.selectedKey = CREATE_APPLICATION_KEY;
      mockData.application.name = '';
      await deployValidationSchema.isValid(mockData).then((valid) => expect(valid).toEqual(false));
      await deployValidationSchema.validate(mockData).catch((err) => {
        expect(err.message).toBe('Required');
      });
    });

    it('should not throw an error when no application group is chosen', async () => {
      const mockData = cloneDeep(mockDeployImageFormData);
      mockData.application.selectedKey = UNASSIGNED_KEY;
      mockData.application.name = '';
      await deployValidationSchema.isValid(mockData).then((valid) => expect(valid).toEqual(true));
    });

    it('should not throw an error when allowing either create or no application group set', async () => {
      const mockData = cloneDeep(mockDeployImageFormData);
      mockData.application.selectedKey = '';
      mockData.application.name = '';
      await deployValidationSchema.isValid(mockData).then((valid) => expect(valid).toEqual(true));
    });

    it('should throw an error if path is invalid', async () => {
      const mockData = cloneDeep(mockDeployImageFormData);
      mockData.route.path = 'path';
      await deployValidationSchema.isValid(mockData).then((valid) => expect(valid).toEqual(false));
      await deployValidationSchema.validate(mockData).catch((err) => {
        expect(err.message).toBe('Path must start with /.');
      });
    });

    it('should throw an error if hostname is invalid', async () => {
      const mockData = cloneDeep(mockDeployImageFormData);
      mockData.route.hostname = 'host_name';
      await deployValidationSchema.isValid(mockData).then((valid) => expect(valid).toEqual(false));
      await deployValidationSchema.validate(mockData).catch((err) => {
        expect(err.message).toBe(
          'Hostname must consist of lower-case letters, numbers, periods, and hyphens. It must start and end with a letter or number.',
        );
      });
    });

    it('should throw an error if request is greater than limit', async () => {
      const mockData = cloneDeep(mockDeployImageFormData);
      mockData.limits.cpu.request = 3;
      mockData.limits.cpu.requestUnit = 'm';
      mockData.limits.cpu.limit = 2;
      mockData.limits.cpu.limitUnit = 'm';
      await deployValidationSchema.isValid(mockData).then((valid) => expect(valid).toEqual(false));
      await deployValidationSchema.validate(mockData).catch((err) => {
        expect(err.message).toBe('CPU limit must be greater than or equal to request.');
      });
    });

    it('should throw an error if memory request is greater than limit', async () => {
      const mockData = cloneDeep(mockDeployImageFormData);
      mockData.limits.memory.request = 3;
      mockData.limits.memory.requestUnit = 'Gi';
      mockData.limits.memory.limit = 3;
      mockData.limits.memory.limitUnit = 'Mi';
      await deployValidationSchema.isValid(mockData).then((valid) => expect(valid).toEqual(false));
      await deployValidationSchema.validate(mockData).catch((err) => {
        expect(err.message).toBe('Memory limit must be greater than or equal to request.');
      });
    });

    it('request should entered individual without validation of limit field', async () => {
      const mockData = cloneDeep(mockDeployImageFormData);
      mockData.limits.cpu.request = 3;
      mockData.limits.cpu.requestUnit = 'm';
      await deployValidationSchema.isValid(mockData).then((valid) => expect(valid).toEqual(true));
      await deployValidationSchema.validate(mockData).catch((err) => {
        expect(err.message).toBe('');
      });
    });

    it('should throw an error if deployment replicas is not an integer', async () => {
      const mockData = cloneDeep(mockDeployImageFormData);
      mockData.deployment.replicas = 3.2;
      await deployValidationSchema.isValid(mockData).then((valid) => expect(valid).toEqual(false));
      await deployValidationSchema.validate(mockData).catch((err) => {
        expect(err.message).toBe('Replicas must be an Integer.');
      });
    });

    it('should throw an error if deployment replicas is less than 0', async () => {
      const mockData = cloneDeep(mockDeployImageFormData);
      mockData.deployment.replicas = -5;
      await deployValidationSchema.isValid(mockData).then((valid) => expect(valid).toEqual(false));
      await deployValidationSchema.validate(mockData).catch((err) => {
        expect(err.message).toBe('Replicas must be greater than or equal to 0.');
      });
    });

    it('should throw an error if deployment replicas is greater than MAX_SAFE_INTEGER', async () => {
      const mockData = cloneDeep(mockDeployImageFormData);
      mockData.deployment.replicas = Number.MAX_SAFE_INTEGER + 1;
      await deployValidationSchema.isValid(mockData).then((valid) => expect(valid).toEqual(false));
      await deployValidationSchema.validate(mockData).catch((err) => {
        expect(err.message).toBe(
          `Replicas must be lesser than or equal to ${Number.MAX_SAFE_INTEGER}.`,
        );
      });
    });

    serverlessCommonTests(mockDeployImageFormData, deployValidationSchema);
  });
});
