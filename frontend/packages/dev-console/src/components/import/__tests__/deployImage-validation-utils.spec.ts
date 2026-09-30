import { t } from 'i18next';
import { cloneDeep } from 'lodash';
import { CREATE_APPLICATION_KEY, UNASSIGNED_KEY } from '@console/topology/src/const';
import { deployValidationSchema } from '../deployImage-validation-utils';
import { serverlessCommonTests } from '../test-utils/serverless-common-tests';
import { mockDeployImageFormData } from './data/deployImage-validation-mock';

jest.mock('i18next');
describe('Deploy Image ValidationUtils', () => {
  describe('Validation Schema', () => {
    it('should validate the form data', async () => {
      const mockData = cloneDeep(mockDeployImageFormData);
      expect(await deployValidationSchema(t).isValid(mockData)).toEqual(true);
    });
    it('should throw an error for required fields if empty', async () => {
      const mockData = cloneDeep(mockDeployImageFormData);
      mockData.name = '';
      expect(await deployValidationSchema(t).isValid(mockData)).toEqual(false);
      await expect(deployValidationSchema(t).validate(mockData)).rejects.toMatchObject({
        message: 'Required',
        type: 'required',
      });
    });
    it('should throw an error if name is invalid', async () => {
      const mockData = cloneDeep(mockDeployImageFormData);
      mockData.name = 'app_name';
      expect(await deployValidationSchema(t).isValid(mockData)).toEqual(false);
      await expect(deployValidationSchema(t).validate(mockData)).rejects.toThrow(
        'Name must consist of lower-case letters, numbers and hyphens. It must start with a letter and end with a letter or number.',
      );
    });
    it('should throw an error when no application name given for create application option', async () => {
      const mockData = cloneDeep(mockDeployImageFormData);
      mockData.application.selectedKey = CREATE_APPLICATION_KEY;
      mockData.application.name = '';
      expect(await deployValidationSchema(t).isValid(mockData)).toEqual(false);
      await expect(deployValidationSchema(t).validate(mockData)).rejects.toThrow('Required');
    });
    it('should not throw an error when no application group is chosen', async () => {
      const mockData = cloneDeep(mockDeployImageFormData);
      mockData.application.selectedKey = UNASSIGNED_KEY;
      mockData.application.name = '';
      expect(await deployValidationSchema(t).isValid(mockData)).toEqual(true);
    });
    it('should not throw an error when allowing either create or no application group set', async () => {
      const mockData = cloneDeep(mockDeployImageFormData);
      mockData.application.selectedKey = '';
      mockData.application.name = '';
      expect(await deployValidationSchema(t).isValid(mockData)).toEqual(true);
    });
    it('should throw an error if path is invalid', async () => {
      const mockData = cloneDeep(mockDeployImageFormData);
      mockData.route.path = 'path';
      expect(await deployValidationSchema(t).isValid(mockData)).toEqual(false);
      await expect(deployValidationSchema(t).validate(mockData)).rejects.toThrow(
        'Path must start with /.',
      );
    });
    it('should throw an error if hostname is invalid', async () => {
      const mockData = cloneDeep(mockDeployImageFormData);
      mockData.route.hostname = 'host_name';
      expect(await deployValidationSchema(t).isValid(mockData)).toEqual(false);
      await expect(deployValidationSchema(t).validate(mockData)).rejects.toThrow(
        'Hostname must consist of lower-case letters, numbers, periods, and hyphens. It must start and end with a letter or number.',
      );
    });
    it('should throw an error if request is greater than limit', async () => {
      const mockData = cloneDeep(mockDeployImageFormData);
      mockData.limits.cpu.request = 3;
      mockData.limits.cpu.requestUnit = 'm';
      mockData.limits.cpu.limit = 2;
      mockData.limits.cpu.limitUnit = 'm';
      expect(await deployValidationSchema(t).isValid(mockData)).toEqual(false);
      await expect(deployValidationSchema(t).validate(mockData)).rejects.toThrow(
        'CPU limit must be greater than or equal to request.',
      );
    });
    it('should throw an error if memory request is greater than limit', async () => {
      const mockData = cloneDeep(mockDeployImageFormData);
      mockData.limits.memory.request = 3;
      mockData.limits.memory.requestUnit = 'Gi';
      mockData.limits.memory.limit = 3;
      mockData.limits.memory.limitUnit = 'Mi';
      expect(await deployValidationSchema(t).isValid(mockData)).toEqual(false);
      await expect(deployValidationSchema(t).validate(mockData)).rejects.toThrow(
        'Memory limit must be greater than or equal to request.',
      );
    });
    it('request should entered individual without validation of limit field', async () => {
      const mockData = cloneDeep(mockDeployImageFormData);
      mockData.limits.cpu.request = 3;
      mockData.limits.cpu.requestUnit = 'm';
      expect(await deployValidationSchema(t).isValid(mockData)).toEqual(true);
      await expect(deployValidationSchema(t).validate(mockData)).resolves.toBeDefined();
    });
    it('should throw an error if deployment replicas is not an integer', async () => {
      const mockData = cloneDeep(mockDeployImageFormData);
      mockData.deployment.replicas = 3.2;
      expect(await deployValidationSchema(t).isValid(mockData)).toEqual(false);
      await expect(deployValidationSchema(t).validate(mockData)).rejects.toThrow(
        'Replicas must be an integer.',
      );
    });
    it('should throw an error if deployment replicas is less than 0', async () => {
      const mockData = cloneDeep(mockDeployImageFormData);
      mockData.deployment.replicas = -5;
      expect(await deployValidationSchema(t).isValid(mockData)).toEqual(false);
      await expect(deployValidationSchema(t).validate(mockData)).rejects.toThrow(
        'Replicas must be greater than or equal to 0.',
      );
    });
    it('should throw an error if deployment replicas is greater than MAX_SAFE_INTEGER', async () => {
      const mockData = cloneDeep(mockDeployImageFormData);
      mockData.deployment.replicas = Number.MAX_SAFE_INTEGER + 1;
      expect(await deployValidationSchema(t).isValid(mockData)).toEqual(false);
      await expect(deployValidationSchema(t).validate(mockData)).rejects.toThrow(
        `Replicas must be lesser than or equal to ${Number.MAX_SAFE_INTEGER}.`,
      );
    });
    serverlessCommonTests(mockDeployImageFormData, deployValidationSchema(t));
  });
});
