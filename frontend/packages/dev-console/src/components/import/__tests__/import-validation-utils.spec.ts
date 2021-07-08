import { TFunction } from 'i18next';
import { cloneDeep } from 'lodash';
import { CREATE_APPLICATION_KEY, UNASSIGNED_KEY } from '@console/topology/src/const';
import { mockFormData } from '../__mocks__/import-validation-mock';
import { GitTypes } from '../import-types';
import {
  validationSchema,
  detectGitType,
  detectGitRepoName,
  createComponentName,
} from '../import-validation-utils';
import { serverlessCommonTests } from './serverless-common-tests';

const t = (key: TFunction) => key;

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

  describe('createComponentName', () => {
    const invalidConvertedtoValidNamePair: { [key: string]: string } = {
      '-2name': 'ocp-2-name',
      '0name': 'ocp-0-name',
      Name: 'name',
      '-name': 'name',
      'name-': 'name',
      'invalid&name': 'invalid-name',
      'invalid name': 'invalid-name',
      'invalid-Name': 'invalid-name',
      InvalidName: 'invalid-name',
    };
    const validNames: string[] = ['name', 'valid-name', 'name0', 'name-0'];

    Object.keys(invalidConvertedtoValidNamePair).forEach((invalidName) => {
      it(`should convert ${invalidName} to a valid k8s name`, () => {
        expect(createComponentName(invalidName)).toEqual(
          invalidConvertedtoValidNamePair[invalidName],
        );
      });
    });

    validNames.forEach((validName) => {
      it(`should leave ${validName} unchanged`, () => {
        expect(createComponentName(validName)).toEqual(validName);
      });
    });
  });

  describe('Validation Schema', () => {
    it('should validate the form data', async () => {
      const mockData = cloneDeep(mockFormData);
      await validationSchema(t)
        .isValid(mockData)
        .then((valid) => expect(valid).toEqual(true));
    });

    it('should throw an error if url is invalid', async () => {
      const mockData = cloneDeep(mockFormData);
      mockData.git.url = 'something.com';
      await validationSchema(t)
        .isValid(mockData)
        .then((valid) => expect(valid).toEqual(false));
      await validationSchema(t)
        .validate(mockData)
        .catch((err) => expect(err.message).toBe('devconsole~Invalid Git URL.'));
    });

    it('should throw an error if url is valid but git type is not valid', async () => {
      const mockData = cloneDeep(mockFormData);
      mockData.git.url = 'https://something.com/test/repo';
      mockData.git.type = '';
      await validationSchema(t)
        .isValid(mockData)
        .then((valid) => expect(valid).toEqual(true));
      mockData.git.showGitType = true;
      await validationSchema(t)
        .validate(mockData)
        .catch((err) => {
          expect(err.message).toBe(
            'devconsole~We failed to detect the Git type. Please choose a Git type.',
          );
        });
    });

    it('should throw an error if project name is invalid', async () => {
      const mockData = cloneDeep(mockFormData);
      mockData.project.name = 'project-!';
      await validationSchema(t)
        .isValid(mockData)
        .then((valid) => expect(valid).toEqual(false));
      await validationSchema(t)
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
      await validationSchema(t)
        .isValid(mockData)
        .then((valid) => expect(valid).toEqual(false));
      await validationSchema(t)
        .validate(mockData)
        .catch((err) => {
          expect(err.message).toBe('console-shared~Required');
          expect(err.type).toBe('required');
        });
    });

    it('should convert the detected name to lower case', async () => {
      const mockData = cloneDeep(mockFormData);
      mockData.git.url = 'https://github.com/openshift-evangelists/Wild-West-Frontend';
      await validationSchema(t)
        .isValid(mockData)
        .then((valid) => expect(valid).toEqual(true));
      const name = detectGitRepoName(mockData.git.url);
      expect(name).toEqual('wild-west-frontend');
    });

    it('should convert the detected name to valid kebabCase', async () => {
      expect(
        detectGitRepoName('https://github.com/openshift-evangelists/Wild-West-Frontend'),
      ).toEqual('wild-west-frontend');
      expect(
        detectGitRepoName('https://github.com/openshift-evangelists/wildWestFrontend'),
      ).toEqual('wild-west-frontend');
      expect(
        detectGitRepoName('https://github.com/openshift-evangelists/wild-west-frontend.git'),
      ).toEqual('wild-west-frontend-git');
      expect(
        detectGitRepoName('https://github.com/openshift-evangelists/Wild-West-Frontend123'),
      ).toEqual('wild-west-frontend-123');
    });

    it('should throw an error if name is invalid', async () => {
      const mockData = cloneDeep(mockFormData);
      mockData.name = 'app_name';
      await validationSchema(t)
        .isValid(mockData)
        .then((valid) => expect(valid).toEqual(false));
      await validationSchema(t)
        .validate(mockData)
        .catch((err) => {
          expect(err.message).toBe(
            'console-shared~Name must consist of lower-case letters, numbers and hyphens. It must start with a letter and end with a letter or number.',
          );
        });
    });

    it('should throw an error when no application name given for create application option', async () => {
      const mockData = cloneDeep(mockFormData);
      mockData.application.selectedKey = CREATE_APPLICATION_KEY;
      mockData.application.name = '';
      await validationSchema(t)
        .isValid(mockData)
        .then((valid) => expect(valid).toEqual(false));
      await validationSchema(t)
        .validate(mockData)
        .catch((err) => {
          expect(err.message).toBe('Required');
        });
    });

    it('should not throw an error when no application group is chosen', async () => {
      const mockData = cloneDeep(mockFormData);
      mockData.application.selectedKey = UNASSIGNED_KEY;
      mockData.application.name = '';
      await validationSchema(t)
        .isValid(mockData)
        .then((valid) => expect(valid).toEqual(true));
    });

    it('should not throw an error when allowing either create or remove application', async () => {
      const mockData = cloneDeep(mockFormData);
      mockData.application.selectedKey = '';
      mockData.application.name = '';
      await validationSchema(t)
        .isValid(mockData)
        .then((valid) => expect(valid).toEqual(true));
    });

    it('should throw an error if path is invalid', async () => {
      const mockData = cloneDeep(mockFormData);
      mockData.route.path = 'path';
      await validationSchema(t)
        .isValid(mockData)
        .then((valid) => expect(valid).toEqual(false));
      await validationSchema(t)
        .validate(mockData)
        .catch((err) => {
          expect(err.message).toBe('devconsole~Path must start with /.');
        });
    });

    it('should throw an error if hostname is invalid', async () => {
      const mockData = cloneDeep(mockFormData);
      mockData.route.hostname = 'host_name';
      await validationSchema(t)
        .isValid(mockData)
        .then((valid) => expect(valid).toEqual(false));
      await validationSchema(t)
        .validate(mockData)
        .catch((err) => {
          expect(err.message).toBe(
            'devconsole~Hostname must consist of lower-case letters, numbers, periods, and hyphens. It must start and end with a letter or number.',
          );
        });
    });

    it('should throw an error if request is greater than limit', async () => {
      const mockData = cloneDeep(mockFormData);
      mockData.limits.cpu.request = 3;
      mockData.limits.cpu.requestUnit = 'm';
      mockData.limits.cpu.limit = 2;
      mockData.limits.cpu.limitUnit = 'm';
      await validationSchema(t)
        .isValid(mockData)
        .then((valid) => expect(valid).toEqual(false));
      await validationSchema(t)
        .validate(mockData)
        .catch((err) => {
          expect(err.message).toBe(
            'devconsole~CPU limit must be greater than or equal to request.',
          );
        });
    });

    it('should throw an error if memory request is greater than limit', async () => {
      const mockData = cloneDeep(mockFormData);
      mockData.limits.memory.request = 3;
      mockData.limits.memory.requestUnit = 'Gi';
      mockData.limits.memory.limit = 3;
      mockData.limits.memory.limitUnit = 'Mi';
      await validationSchema(t)
        .isValid(mockData)
        .then((valid) => expect(valid).toEqual(false));
      await validationSchema(t)
        .validate(mockData)
        .catch((err) => {
          expect(err.message).toBe(
            'devconsole~Memory limit must be greater than or equal to request.',
          );
        });
    });

    it('request should entered individual without validation of limit field', async () => {
      const mockData = cloneDeep(mockFormData);
      mockData.limits.cpu.request = 3;
      mockData.limits.cpu.requestUnit = 'm';
      await validationSchema(t)
        .isValid(mockData)
        .then((valid) => expect(valid).toEqual(true));
      await validationSchema(t)
        .validate(mockData)
        .catch((err) => {
          expect(err.message).toBe('');
        });
    });

    it('should throw an error if containerPort is not an integer', async () => {
      const mockData = cloneDeep(mockFormData);
      mockData.build.strategy = 'Docker';
      mockData.route.unknownTargetPort = '808.5';
      await validationSchema(t)
        .isValid(mockData)
        .then((valid) => expect(valid).toEqual(false));
      await validationSchema(t)
        .validate(mockData)
        .catch((err) => {
          expect(err.message).toBe('devconsole~Port must be an integer.');
        });
    });

    it('should not disable create button when buildStrategy is docker and no builderImage is available', async () => {
      const mockData = cloneDeep(mockFormData);
      mockData.image.selected = '';
      mockData.build.strategy = 'Docker';
      await validationSchema(t)
        .isValid(mockData)
        .then((valid) => expect(valid).toEqual(true));
      mockData.build.strategy = 'Source';
      await validationSchema(t)
        .isValid(mockData)
        .then((valid) => expect(valid).toEqual(false));
    });

    serverlessCommonTests(mockFormData, validationSchema(t));
  });
});
