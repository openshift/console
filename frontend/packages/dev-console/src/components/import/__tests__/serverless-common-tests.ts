import { cloneDeep } from 'lodash';
import { GitImportFormData, DeployImageFormData, Resources } from '../import-types';

export const serverlessCommonTests = (
  mockFormData: GitImportFormData | DeployImageFormData,
  validationSchema,
) => {
  describe('Serverless Schema Validation', () => {
    it('should throw and error if serverless scaling minpods is not an integer', async () => {
      const mockData = cloneDeep(mockFormData);
      mockData.resources = Resources.KnativeService;
      mockData.serverless.scaling.minpods = 3.2;
      await validationSchema.isValid(mockData).then((valid) => expect(valid).toEqual(false));
      await validationSchema.validate(mockData).catch((err) => {
        expect(err.message).toBe('Min Pods must be an Integer.');
      });
    });

    it('should throw and error if serverless scaling minpods is less than 0', async () => {
      const mockData = cloneDeep(mockFormData);
      mockData.resources = Resources.KnativeService;
      mockData.serverless.scaling.minpods = -3;
      await validationSchema.isValid(mockData).then((valid) => expect(valid).toEqual(false));
      await validationSchema.validate(mockData).catch((err) => {
        expect(err.message).toBe('Min Pods must be greater than or equal to 0.');
      });
    });

    it('should throw and error if serverless scaling minpods is greater than MAX_SAFE_INTEGER', async () => {
      const mockData = cloneDeep(mockFormData);
      mockData.resources = Resources.KnativeService;
      mockData.serverless.scaling.minpods = Number.MAX_SAFE_INTEGER + 1;
      await validationSchema.isValid(mockData).then((valid) => expect(valid).toEqual(false));
      await validationSchema.validate(mockData).catch((err) => {
        expect(err.message).toBe(
          `Min Pods must be lesser than or equal to ${Number.MAX_SAFE_INTEGER}.`,
        );
      });
    });

    it('should throw and error if serverless scaling maxpods is not an integer', async () => {
      const mockData = cloneDeep(mockFormData);
      mockData.resources = Resources.KnativeService;
      mockData.serverless.scaling.maxpods = 3.2;
      await validationSchema.isValid(mockData).then((valid) => expect(valid).toEqual(false));
      await validationSchema.validate(mockData).catch((err) => {
        expect(err.message).toBe('Max Pods must be an Integer.');
      });
    });

    it('should throw and error if serverless scaling maxpods is less than 1', async () => {
      const mockData = cloneDeep(mockFormData);
      mockData.resources = Resources.KnativeService;
      mockData.serverless.scaling.maxpods = 0;
      await validationSchema.isValid(mockData).then((valid) => expect(valid).toEqual(false));
      await validationSchema.validate(mockData).catch((err) => {
        expect(err.message).toBe('Max Pods must be greater than or equal to 1.');
      });
    });

    it('should throw and error if serverless scaling maxpods is greater than MAX_SAFE_INTEGER', async () => {
      const mockData = cloneDeep(mockFormData);
      mockData.resources = Resources.KnativeService;
      mockData.serverless.scaling.maxpods = Number.MAX_SAFE_INTEGER + 1;
      await validationSchema.isValid(mockData).then((valid) => expect(valid).toEqual(false));
      await validationSchema.validate(mockData).catch((err) => {
        expect(err.message).toBe(
          `Max Pods must be lesser than or equal to ${Number.MAX_SAFE_INTEGER}.`,
        );
      });
    });

    it('should throw and error if serverless scaling minpod is greater than maxpod', async () => {
      const mockData = cloneDeep(mockFormData);
      mockData.resources = Resources.KnativeService;
      mockData.serverless.scaling.minpods = 15;
      mockData.serverless.scaling.maxpods = 5;
      await validationSchema.isValid(mockData).then((valid) => expect(valid).toEqual(false));
      await validationSchema.validate(mockData).catch((err) => {
        expect(err.message).toBe(`Max Pods must be greater than or equal to Min Pods.`);
      });
    });

    it('should throw and error if serverless scaling concurrencytarget is not an integer', async () => {
      const mockData = cloneDeep(mockFormData);
      mockData.resources = Resources.KnativeService;
      mockData.serverless.scaling.concurrencytarget = 3.2;
      await validationSchema.isValid(mockData).then((valid) => expect(valid).toEqual(false));
      await validationSchema.validate(mockData).catch((err) => {
        expect(err.message).toBe('Concurrency Target must be an Integer.');
      });
    });

    it('should throw and error if serverless scaling concurrencytarget is less than 0', async () => {
      const mockData = cloneDeep(mockFormData);
      mockData.resources = Resources.KnativeService;
      mockData.serverless.scaling.concurrencytarget = -3;
      await validationSchema.isValid(mockData).then((valid) => expect(valid).toEqual(false));
      await validationSchema.validate(mockData).catch((err) => {
        expect(err.message).toBe('Concurrency Target must be greater than or equal to 0.');
      });
    });

    it('should throw and error if serverless scaling concurrencytarget is greater than MAX_SAFE_INTEGER', async () => {
      const mockData = cloneDeep(mockFormData);
      mockData.resources = Resources.KnativeService;
      mockData.serverless.scaling.concurrencytarget = Number.MAX_SAFE_INTEGER + 1;
      await validationSchema.isValid(mockData).then((valid) => expect(valid).toEqual(false));
      await validationSchema.validate(mockData).catch((err) => {
        expect(err.message).toBe(
          `Concurrency Target must be lesser than or equal to ${Number.MAX_SAFE_INTEGER}.`,
        );
      });
    });

    it('should throw and error if serverless scaling concurrencylimit is not an integer', async () => {
      const mockData = cloneDeep(mockFormData);
      mockData.resources = Resources.KnativeService;
      mockData.serverless.scaling.concurrencylimit = 3.2;
      await validationSchema.isValid(mockData).then((valid) => expect(valid).toEqual(false));
      await validationSchema.validate(mockData).catch((err) => {
        expect(err.message).toBe('Concurrency Limit must be an Integer.');
      });
    });

    it('should throw and error if serverless scaling concurrencylimit is less than 0', async () => {
      const mockData = cloneDeep(mockFormData);
      mockData.resources = Resources.KnativeService;
      mockData.serverless.scaling.concurrencylimit = -3;
      await validationSchema.isValid(mockData).then((valid) => expect(valid).toEqual(false));
      await validationSchema.validate(mockData).catch((err) => {
        expect(err.message).toBe('Concurrency Limit must be greater than or equal to 0.');
      });
    });

    it('should throw and error if serverless scaling concurrencylimit is greater than MAX_SAFE_INTEGER', async () => {
      const mockData = cloneDeep(mockFormData);
      mockData.resources = Resources.KnativeService;
      mockData.serverless.scaling.concurrencylimit = Number.MAX_SAFE_INTEGER + 1;
      await validationSchema.isValid(mockData).then((valid) => expect(valid).toEqual(false));
      await validationSchema.validate(mockData).catch((err) => {
        expect(err.message).toBe(
          `Concurrency Limit must be lesser than or equal to ${Number.MAX_SAFE_INTEGER}.`,
        );
      });
    });
  });
};
