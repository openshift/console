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
  });
});
