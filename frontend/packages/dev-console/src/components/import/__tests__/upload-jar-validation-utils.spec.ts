import { TFunction } from 'i18next';
import { cloneDeep } from 'lodash';
import { uploadJarMockFormData } from '../__mocks__/upload-jar-mock';
import { fileNameRegex, getAppName, validationSchema } from '../upload-jar-validation-utils';

const t = (key): TFunction => key;

describe('Validation Schema: upload jar validation utils', () => {
  it('should validate uploadJar form', async () => {
    const mockData = cloneDeep(uploadJarMockFormData);
    await validationSchema(t)
      .isValid(mockData)
      .then((valid) => expect(valid).toEqual(true));
  });

  it('should not validate fom and show fileUpload name is not suported', async () => {
    const mockData = cloneDeep(uploadJarMockFormData);
    mockData.fileUpload.name = 'test.png';
    await validationSchema(t)
      .isValid(mockData)
      .then((valid) => expect(valid).toEqual(false));
    await validationSchema(t)
      .validate(mockData)
      .catch((err) => {
        expect(err.message).toBe('devconsole~Must be a JAR file.');
      });
  });

  it('should accept JAR file', () => {
    expect(fileNameRegex.test('sprinttest.jar')).toBe(true);
    expect(fileNameRegex.test('sprint-test.jar')).toBe(true);
    expect(fileNameRegex.test('sprint-test.1.3.jar')).toBe(true);
    expect(fileNameRegex.test('123-sprint-test.jar')).toBe(true);
    expect(fileNameRegex.test('sprintTest.JAR')).toBe(true);
    expect(fileNameRegex.test('sprinttest.JAR')).toBe(true);
  });

  it('should not accept other file types', () => {
    expect(fileNameRegex.test('sprinttest.png')).toBe(false);
    expect(fileNameRegex.test('sprint-test.jpeg')).toBe(false);
    expect(fileNameRegex.test('sprint-test.1.3.war')).toBe(false);
    expect(fileNameRegex.test('sprint-test.1.3-one')).toBe(false);
  });

  it('getAppName should return valid name', () => {
    expect(getAppName('sprinttest.jar')).toEqual('sprinttest');
    expect(getAppName('sprint-test.jar')).toEqual('sprint-test');
    expect(getAppName('sprint-test.1.3.jar')).toEqual('sprint-test');
    expect(getAppName('123-sprint-test.jar')).toEqual('123-sprint-test');
    expect(getAppName('sprint Test.JAR')).toEqual('sprint-test');
    expect(getAppName('sprinttest.JAR')).toEqual('sprinttest');
    expect(getAppName('Sprint_Test.JAR')).toEqual('sprint-test');
  });

  it('getAppName should return undefined if not a valid JAR', () => {
    expect(getAppName('sprinttest.png')).toBeUndefined();
    expect(getAppName('sprint-test.jpeg')).toBeUndefined();
    expect(getAppName('sprint-test.1.3.war')).toBeUndefined();
    expect(getAppName('sprint test .mov')).toBeUndefined();
  });
});
