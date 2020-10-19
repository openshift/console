import { cloneDeep } from 'lodash';
import { CREATE_APPLICATION_KEY, UNASSIGNED_KEY } from '../../../const';
import { validationSchema, detectGitType, detectGitRepoName } from '../import-validation-utils';
import { mockFormData } from '../__mocks__/import-validation-mock';
import { GitTypes } from '../import-types';
import { serverlessCommonTests } from './serverless-common-tests';

describe('ValidationUtils', () => {
  describe('Detect Git Type', () => {
    it('should return the invalid enum key for invalid git url', () => {
      const gitType = detectGitType('test');
      expect(gitType).toEqual(GitTypes.invalid);
    });
    it('should return the unsure enum key for valid but unknown git url ', () => {
      const gitType = detectGitType('https://svnsource.test.com');
      expect(gitType).toEqual(GitTypes.unsure);

      const gitType1 = detectGitType('https://github.comWRONG/test/repo');
      expect(gitType1).toEqual(GitTypes.unsure);

      const gitType2 = detectGitType('git@bitbucket.orgs:atlassian_tutorial/helloworld.git');
      expect(gitType2).toEqual(GitTypes.unsure);
    });
    it('should return proper git type for valid known git url', () => {
      const gitType = detectGitType('https://github.com/test/repo');
      expect(gitType).toEqual(GitTypes.github);

      const gitType1 = detectGitType('git@bitbucket.org:atlassian_tutorial/helloworld.git');
      expect(gitType1).toEqual(GitTypes.bitbucket);

      const gitType2 = detectGitType('git@github.com:openshift/console.git');
      expect(gitType2).toEqual(GitTypes.github);

      const gitType3 = detectGitType('git@bitbucket.org:atlassian_tutorial/helloworld.git');
      expect(gitType3).toEqual(GitTypes.bitbucket);
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

    it('should throw an error if project name is invalid', async () => {
      const mockData = cloneDeep(mockFormData);
      mockData.project.name = 'project-!';
      await validationSchema.isValid(mockData).then((valid) => expect(valid).toEqual(false));
      await validationSchema
        .validate(mockData)
        .catch((err) =>
          expect(err.message).toBe(
            "Name must consist of lower case alphanumeric characters or '-' and must start and end with an alphanumeric character.",
          ),
        );
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

    it('should convert the detected name to lower case', async () => {
      const mockData = cloneDeep(mockFormData);
      mockData.git.url = 'https://github.com/openshift-evangelists/Wild-West-Frontend';
      await validationSchema.isValid(mockData).then((valid) => expect(valid).toEqual(true));
      const name = detectGitRepoName(mockData.git.url);
      expect(name).toEqual('wild-west-frontend');
    });

    it('should throw an error if name is invalid', async () => {
      const mockData = cloneDeep(mockFormData);
      mockData.name = 'app_name';
      await validationSchema.isValid(mockData).then((valid) => expect(valid).toEqual(false));
      await validationSchema.validate(mockData).catch((err) => {
        expect(err.message).toBe(
          'Name must consist of lower-case letters, numbers and hyphens. It must start with a letter and end with a letter or number.',
        );
      });
    });

    it('should throw an error when no application name given for create application option', async () => {
      const mockData = cloneDeep(mockFormData);
      mockData.application.selectedKey = CREATE_APPLICATION_KEY;
      mockData.application.name = '';
      await validationSchema.isValid(mockData).then((valid) => expect(valid).toEqual(false));
      await validationSchema.validate(mockData).catch((err) => {
        expect(err.message).toBe('Required');
      });
    });

    it('should not throw an error when no application group is chosen', async () => {
      const mockData = cloneDeep(mockFormData);
      mockData.application.selectedKey = UNASSIGNED_KEY;
      mockData.application.name = '';
      await validationSchema.isValid(mockData).then((valid) => expect(valid).toEqual(true));
    });

    it('should not throw an error when allowing either create or remove application', async () => {
      const mockData = cloneDeep(mockFormData);
      mockData.application.selectedKey = '';
      mockData.application.name = '';
      await validationSchema.isValid(mockData).then((valid) => expect(valid).toEqual(true));
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

    serverlessCommonTests(mockFormData, validationSchema);
  });
});
