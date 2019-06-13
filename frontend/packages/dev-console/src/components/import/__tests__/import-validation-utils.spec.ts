import { validationSchema, detectGitType } from '../import-validation-utils';
import { GitImportFormData } from '../import-types';

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
    const mockFormData: GitImportFormData = {
      name: 'test-app',
      project: {
        name: 'mock-project',
      },
      application: {
        name: 'mock-app',
        selectedKey: 'mock-app',
      },
      git: {
        url: 'https://github.com/test/repo',
        type: 'github',
        ref: '',
        dir: '',
        showGitType: false,
      },
      image: {
        selected: 'nodejs',
        recommended: '',
        tag: 'latest',
        ports: [],
      },
      route: {
        create: false,
      },
      build: {
        env: [],
        triggers: {
          webhook: true,
          image: true,
          config: true,
        },
      },
      deployment: {
        env: [],
        triggers: {
          image: true,
          config: true,
        },
        replicas: 1,
      },
      labels: {},
    };

    it('should validate the form data', async () => {
      await validationSchema.isValid(mockFormData).then((valid) => expect(valid).toEqual(true));
    });

    it('should throw an error if url is invalid', async () => {
      mockFormData.git.url = 'something.com';
      await validationSchema.isValid(mockFormData).then((valid) => expect(valid).toEqual(false));
      await validationSchema
        .validate(mockFormData)
        .catch((err) => expect(err.message).toBe('Invalid Git URL'));
    });

    it('should throw an error if url is valid but git type is not valid', async () => {
      mockFormData.git.url = 'https://something.com/test/repo';
      mockFormData.git.type = '';
      await validationSchema.isValid(mockFormData).then((valid) => expect(valid).toEqual(true));
      mockFormData.git.showGitType = true;
      await validationSchema.validate(mockFormData).catch((err) => {
        expect(err.message).toBe('We failed to detect the git type. Please choose a git type.');
      });
    });

    it('should throw an error for required fields if empty', async () => {
      mockFormData.name = '';
      await validationSchema.isValid(mockFormData).then((valid) => expect(valid).toEqual(false));
      await validationSchema.validate(mockFormData).catch((err) => {
        expect(err.message).toBe('Required');
        expect(err.type).toBe('required');
      });
    });
  });
});
