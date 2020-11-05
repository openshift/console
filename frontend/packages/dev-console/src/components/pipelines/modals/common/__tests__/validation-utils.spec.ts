import { TFunction } from 'i18next';
import { cloneDeep } from 'lodash';
import { getDefinedObj } from '../../../pipeline-resource/pipelineResource-utils';
import { validateResourceType as validationSchema } from '../validation-utils';
import { mockPipelineResourceData } from '../__mocks__/pipeline-resource-mock';

const t = (key): TFunction => key;

describe('Validation Pipeline Resource', () => {
  describe('Validation utils', () => {
    it('should omit properties with empty , undefined values', () => {
      const sampleInput = { a: 1, b: 'test', c: '' };
      const definedObject = getDefinedObj(sampleInput);
      expect(definedObject).toEqual({ a: 1, b: 'test' });
    });
  });

  describe('Validation Schema git', () => {
    it('should validate the form data for git', async () => {
      const mockData = cloneDeep(mockPipelineResourceData.git);
      await validationSchema(t)
        .isValid(mockData)
        .then((valid) => expect(valid).toEqual(true));
    });

    it('should throw an error if url is not present', async () => {
      const mockData = cloneDeep(mockPipelineResourceData.git);
      mockData.params.url = '';
      await validationSchema(t)
        .isValid(mockData)
        .then((valid) => expect(valid).toEqual(false));
      await validationSchema(t)
        .validate(mockData)
        .catch((err) => {
          expect(err.message).toBe('devconsole~Required');
          expect(err.type).toBe('required');
        });
    });
  });

  describe('Validation Schema image', () => {
    it('should validate the form data for image', async () => {
      const mockData = cloneDeep(mockPipelineResourceData.image);
      await validationSchema(t)
        .isValid(mockData)
        .then((valid) => expect(valid).toEqual(true));
    });

    it('should throw an error if url is not present', async () => {
      const mockData = cloneDeep(mockPipelineResourceData.image);
      mockData.params.url = '';
      await validationSchema(t)
        .isValid(mockData)
        .then((valid) => expect(valid).toEqual(false));
      await validationSchema(t)
        .validate(mockData)
        .catch((err) => {
          expect(err.message).toBe('devconsole~Required');
          expect(err.type).toBe('required');
        });
    });
  });

  describe('Validation Schema storage', () => {
    it('should validate the form data for storage', async () => {
      const mockData = cloneDeep(mockPipelineResourceData.storage);
      await validationSchema(t)
        .isValid(mockData)
        .then((valid) => expect(valid).toEqual(true));
    });

    it('should throw an error if type is not present', async () => {
      const mockData = cloneDeep(mockPipelineResourceData.storage);
      mockData.params.type = '';
      await validationSchema(t)
        .isValid(mockData)
        .then((valid) => expect(valid).toEqual(false));
      await validationSchema(t)
        .validate(mockData)
        .catch((err) => {
          expect(err.message).toBe('devconsole~Required');
          expect(err.type).toBe('required');
        });
    });

    it('should throw an error if location is not present', async () => {
      const mockData = cloneDeep(mockPipelineResourceData.storage);
      mockData.params.location = '';
      await validationSchema(t)
        .isValid(mockData)
        .then((valid) => expect(valid).toEqual(false));
      await validationSchema(t)
        .validate(mockData)
        .catch((err) => {
          expect(err.message).toBe('devconsole~Required');
          expect(err.type).toBe('required');
        });
    });
  });

  describe('Validation Schema cluster', () => {
    it('should validate the form data for cluster', async () => {
      const mockData = cloneDeep(mockPipelineResourceData.cluster);
      await validationSchema(t)
        .isValid(mockData)
        .then((valid) => expect(valid).toEqual(true));
    });

    it('should throw an error if cluster name is not present', async () => {
      const mockData = cloneDeep(mockPipelineResourceData.cluster);
      mockData.params.name = '';
      await validationSchema(t)
        .isValid(mockData)
        .then((valid) => expect(valid).toEqual(false));
      await validationSchema(t)
        .validate(mockData)
        .catch((err) => {
          expect(err.message).toBe('devconsole~Required');
          expect(err.type).toBe('required');
        });
    });

    it('should throw an error if cluster url is not present', async () => {
      const mockData = cloneDeep(mockPipelineResourceData.cluster);
      mockData.params.url = '';
      await validationSchema(t)
        .isValid(mockData)
        .then((valid) => expect(valid).toEqual(false));
      await validationSchema(t)
        .validate(mockData)
        .catch((err) => {
          expect(err.message).toBe('devconsole~Required');
          expect(err.type).toBe('required');
        });
    });
  });
});
