import { cloneDeep } from 'lodash';
import { GitImportFormData, DeployImageFormData, Resources } from '../import-types';

export const serverlessCommonTests = (
  mockFormData: GitImportFormData | DeployImageFormData,
  validationSchema,
) => {
  describe('Serverless Schema Validation', () => {
    let mockData: GitImportFormData | DeployImageFormData;
    beforeEach(() => {
      mockData = cloneDeep(mockFormData);
    });

    it('should throw and error if serverless scaling minpods is not an integer', async () => {
      mockData.resources = Resources.KnativeService;
      mockData.serverless.scaling.minpods = 3.2;
      await validationSchema.isValid(mockData).then((valid) => expect(valid).toEqual(false));
      await validationSchema.validate(mockData).catch((err) => {
        expect(err.message).toBe('Min Pods must be an integer.');
      });
    });

    it('should throw and error if serverless scaling minpods is less than 0', async () => {
      mockData.resources = Resources.KnativeService;
      mockData.serverless.scaling.minpods = -3;
      await validationSchema.isValid(mockData).then((valid) => expect(valid).toEqual(false));
      await validationSchema.validate(mockData).catch((err) => {
        expect(err.message).toBe('Min Pods must be greater than or equal to 0.');
      });
    });

    it('should throw and error if serverless scaling minpods is greater than MAX_SAFE_INTEGER', async () => {
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
      mockData.resources = Resources.KnativeService;
      mockData.serverless.scaling.maxpods = 3.2;
      await validationSchema.isValid(mockData).then((valid) => expect(valid).toEqual(false));
      await validationSchema.validate(mockData).catch((err) => {
        expect(err.message).toBe('Max Pods must be an integer.');
      });
    });

    it('should throw and error if serverless scaling maxpods is less than 1', async () => {
      mockData.resources = Resources.KnativeService;
      mockData.serverless.scaling.maxpods = 0;
      await validationSchema.isValid(mockData).then((valid) => expect(valid).toEqual(false));
      await validationSchema.validate(mockData).catch((err) => {
        expect(err.message).toBe('Max Pods must be greater than or equal to 1.');
      });
    });

    it('should throw and error if serverless scaling maxpods is greater than MAX_SAFE_INTEGER', async () => {
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
      mockData.resources = Resources.KnativeService;
      mockData.serverless.scaling.minpods = 15;
      mockData.serverless.scaling.maxpods = 5;
      await validationSchema.isValid(mockData).then((valid) => expect(valid).toEqual(false));
      await validationSchema.validate(mockData).catch((err) => {
        expect(err.message).toBe(`Max Pods must be greater than or equal to Min Pods.`);
      });
    });

    it('should throw and error if serverless scaling concurrencytarget is not an integer', async () => {
      mockData.resources = Resources.KnativeService;
      mockData.serverless.scaling.concurrencytarget = 3.2;
      await validationSchema.isValid(mockData).then((valid) => expect(valid).toEqual(false));
      await validationSchema.validate(mockData).catch((err) => {
        expect(err.message).toBe('Concurrency target must be an integer.');
      });
    });

    it('should throw and error if serverless scaling concurrencytarget is less than 0', async () => {
      mockData.resources = Resources.KnativeService;
      mockData.serverless.scaling.concurrencytarget = -3;
      await validationSchema.isValid(mockData).then((valid) => expect(valid).toEqual(false));
      await validationSchema.validate(mockData).catch((err) => {
        expect(err.message).toBe('Concurrency target must be greater than or equal to 0.');
      });
    });

    it('should throw and error if serverless scaling concurrencytarget is greater than MAX_SAFE_INTEGER', async () => {
      mockData.resources = Resources.KnativeService;
      mockData.serverless.scaling.concurrencytarget = Number.MAX_SAFE_INTEGER + 1;
      await validationSchema.isValid(mockData).then((valid) => expect(valid).toEqual(false));
      await validationSchema.validate(mockData).catch((err) => {
        expect(err.message).toBe(
          `Concurrency target must be lesser than or equal to ${Number.MAX_SAFE_INTEGER}.`,
        );
      });
    });

    it('should throw and error if serverless scaling concurrencylimit is not an integer', async () => {
      mockData.resources = Resources.KnativeService;
      mockData.serverless.scaling.concurrencylimit = 3.2;
      await validationSchema.isValid(mockData).then((valid) => expect(valid).toEqual(false));
      await validationSchema.validate(mockData).catch((err) => {
        expect(err.message).toBe('Concurrency limit must be an integer.');
      });
    });

    it('should throw and error if serverless scaling concurrencylimit is less than 0', async () => {
      mockData.resources = Resources.KnativeService;
      mockData.serverless.scaling.concurrencylimit = -3;
      await validationSchema.isValid(mockData).then((valid) => expect(valid).toEqual(false));
      await validationSchema.validate(mockData).catch((err) => {
        expect(err.message).toBe('Concurrency limit must be greater than or equal to 0.');
      });
    });

    it('should throw and error if serverless scaling concurrencylimit is greater than MAX_SAFE_INTEGER', async () => {
      mockData.resources = Resources.KnativeService;
      mockData.serverless.scaling.concurrencylimit = Number.MAX_SAFE_INTEGER + 1;
      await validationSchema.isValid(mockData).then((valid) => expect(valid).toEqual(false));
      await validationSchema.validate(mockData).catch((err) => {
        expect(err.message).toBe(
          `Concurrency limit must be lesser than or equal to ${Number.MAX_SAFE_INTEGER}.`,
        );
      });
    });
    it('should throw and error if serverless scaling autoscalewindow is less than 6s', async () => {
      mockData.resources = Resources.KnativeService;
      mockData.serverless.scaling.autoscale.autoscalewindow = 1;
      mockData.serverless.scaling.autoscale.autoscalewindowUnit = 's';
      await validationSchema.isValid(mockData).then((valid) => expect(valid).toEqual(false));
      await validationSchema.validate(mockData).catch((err) => {
        expect(err.message).toBe(`Autoscale window must be between 6s and 1h.`);
      });
    });
    it('should throw and error if serverless scaling autoscalewindow is greater than 1h', async () => {
      mockData.resources = Resources.KnativeService;
      mockData.serverless.scaling.autoscale.autoscalewindow = 2;
      mockData.serverless.scaling.autoscale.autoscalewindowUnit = 'h';
      await validationSchema.isValid(mockData).then((valid) => expect(valid).toEqual(false));
      await validationSchema.validate(mockData).catch((err) => {
        expect(err.message).toBe(`Autoscale window must be between 6s and 1h.`);
      });
    });
    it('should throw and error if serverless scaling concurrencyutilization is greater than 100', async () => {
      mockData.resources = Resources.KnativeService;
      mockData.serverless.scaling.concurrencyutilization = 101;
      await validationSchema.isValid(mockData).then((valid) => expect(valid).toEqual(false));
      await validationSchema.validate(mockData).catch((err) => {
        expect(err.message).toBe(`Concurrency utilization must be between 0 and 100.`);
      });
    });
    it('should throw and error if serverless scaling concurrencyutilization is less than 0', async () => {
      mockData.resources = Resources.KnativeService;
      mockData.serverless.scaling.concurrencyutilization = -1;
      await validationSchema.isValid(mockData).then((valid) => expect(valid).toEqual(false));
      await validationSchema.validate(mockData).catch((err) => {
        expect(err.message).toBe(`Concurrency utilization must be between 0 and 100.`);
      });
    });
  });
};
