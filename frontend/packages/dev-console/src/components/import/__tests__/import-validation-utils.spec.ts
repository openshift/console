import { cloneDeep } from 'lodash';
import { validationSchema, detectGitType } from '../import-validation-utils';
import { mockFormData } from '../__mocks__/import-validation-mock';

describe('ValidationUtils', () => {
  describe('Detect Git Type', () => {
    it('should return undefined for invalid git url', () => {
      const gitType = detectGitType('test');
      expect(gitType).toEqual(undefined);
    });
    it('should return empty string for valid but unknown git url ', () => {
      const gitType = detectGitType('https://svnsource.test.com');
      expect(gitType).toEqual('');
    });
    it('should return proper git type for valid known git url', () => {
      const gitType = detectGitType('https://github.com/test/repo');
      expect(gitType).toEqual('github');
    });
  });

  describe('Validation Schema', () => {
    it('should validate the form data', async () => {
      const mockData = cloneDeep(mockFormData);
      await validationSchema.isValid(mockData).then((valid) => expect(valid).toEqual(true));
    });

    it('should throw an error if url is invalid', async () => {
      const mockData = cloneDeep(mockFormData);
      mockData.git.url = 'something.com';
      await validationSchema.isValid(mockData).then((valid) => expect(valid).toEqual(false));
      await validationSchema
        .validate(mockData)
        .catch((err) => expect(err.message).toBe('Invalid Git URL.'));
    });

    it('should throw an error if url is valid but git type is not valid', async () => {
      const mockData = cloneDeep(mockFormData);
      mockData.git.url = 'https://something.com/test/repo';
      mockData.git.type = '';
      await validationSchema.isValid(mockData).then((valid) => expect(valid).toEqual(true));
      mockData.git.showGitType = true;
      await validationSchema.validate(mockData).catch((err) => {
        expect(err.message).toBe('We failed to detect the git type. Please choose a git type.');
      });
    });

    it('should throw an error for required fields if empty', async () => {
      const mockData = cloneDeep(mockFormData);
      mockData.name = '';
      await validationSchema.isValid(mockData).then((valid) => expect(valid).toEqual(false));
      await validationSchema.validate(mockData).catch((err) => {
        expect(err.message).toBe('Required');
        expect(err.type).toBe('required');
      });
    });

    it('should throw an error if path is invalid', async () => {
      const mockData = cloneDeep(mockFormData);
      mockData.route.path = 'path';
      await validationSchema.isValid(mockData).then((valid) => expect(valid).toEqual(false));
      await validationSchema.validate(mockData).catch((err) => {
        expect(err.message).toBe('Path must start with /.');
      });
    });

    it('should throw an error if hostname is invalid', async () => {
      const mockData = cloneDeep(mockFormData);
      mockData.route.hostname = 'host_name';
      await validationSchema.isValid(mockData).then((valid) => expect(valid).toEqual(false));
      await validationSchema.validate(mockData).catch((err) => {
        expect(err.message).toBe(
          'Hostname must consist of lower-case letters, numbers, periods, and hyphens. It must start and end with a letter or number.',
        );
      });
    });

    it('should throw an error if request is greater than limit', async () => {
      const mockData = cloneDeep(mockFormData);
      mockData.limits.cpu.request = 3;
      mockData.limits.cpu.requestUnit = 'm';
      mockData.limits.cpu.limit = 2;
      mockData.limits.cpu.limitUnit = 'm';
      await validationSchema.isValid(mockData).then((valid) => expect(valid).toEqual(false));
      await validationSchema.validate(mockData).catch((err) => {
        expect(err.message).toBe('CPU limit must be greater than or equal to request.');
      });
    });

    it('should throw an error if memory request is greater than limit', async () => {
      const mockData = cloneDeep(mockFormData);
      mockData.limits.memory.request = 3;
      mockData.limits.memory.requestUnit = 'Gi';
      mockData.limits.memory.limit = 3;
      mockData.limits.memory.limitUnit = 'Mi';
      await validationSchema.isValid(mockData).then((valid) => expect(valid).toEqual(false));
      await validationSchema.validate(mockData).catch((err) => {
        expect(err.message).toBe('Memory limit must be greater than or equal to request.');
      });
    });

    it('request should entered individual without validation of limit field', async () => {
      const mockData = cloneDeep(mockFormData);
      mockData.limits.cpu.request = 3;
      mockData.limits.cpu.requestUnit = 'm';
      await validationSchema.isValid(mockData).then((valid) => expect(valid).toEqual(true));
      await validationSchema.validate(mockData).catch((err) => {
        expect(err.message).toBe('');
      });
    });

    it('should throw an error if dockerfilePath is invalid', async () => {
      const mockData = cloneDeep(mockFormData);
      mockData.build.strategy = 'Docker';
      mockData.docker.dockerfilePath = '/Dockerfile';
      await validationSchema.isValid(mockData).then((valid) => expect(valid).toEqual(false));
      await validationSchema.validate(mockData).catch((err) => {
        expect(err.message).toBe('DockerfilePath must be a relative path');
      });
    });

    it('should throw an error if containerPort is not an integer', async () => {
      const mockData = cloneDeep(mockFormData);
      mockData.build.strategy = 'Docker';
      mockData.docker.containerPort = 808.5;
      await validationSchema.isValid(mockData).then((valid) => expect(valid).toEqual(false));
      await validationSchema.validate(mockData).catch((err) => {
        expect(err.message).toBe('Container port should be an Integer');
      });
    });

    it('should not disable create button when buildStrategy is docker and no builderImage is available', async () => {
      const mockData = cloneDeep(mockFormData);
      mockData.image.selected = '';
      mockData.build.strategy = 'Docker';
      await validationSchema.isValid(mockData).then((valid) => expect(valid).toEqual(true));
      mockData.build.strategy = 'Source';
      await validationSchema.isValid(mockData).then((valid) => expect(valid).toEqual(false));
    });
  });
});
