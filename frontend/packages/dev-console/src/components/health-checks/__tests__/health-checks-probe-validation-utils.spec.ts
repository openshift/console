import { cloneDeep } from 'lodash';
import { healthChecksValidationSchema } from '../health-checks-probe-validation-utils';
import { healthChecksDefaultValues } from '../health-checks-probe-utils';

const mockHealthCheckFormData = {
  healthChecks: {
    readinessProbe: healthChecksDefaultValues,
  },
};

describe('healthChecksValidationSchema', () => {
  let mockData;
  beforeEach(() => {
    mockData = cloneDeep(mockHealthCheckFormData);
    mockData.healthChecks.readinessProbe.showForm = true;
  });

  it('should validate the form data', async () => {
    await healthChecksValidationSchema
      .isValid(mockData)
      .then((valid) => expect(valid).toEqual(true));
  });

  it('should throw error if periodSeconds has minimum value less than 1', async () => {
    mockData.healthChecks.readinessProbe.data.periodSeconds = 0;
    await healthChecksValidationSchema
      .validate(mockData)
      .catch((err) => expect(err.message).toEqual('Period must be greater than or equal to 1.'));
  });

  it('should throw error if initialDelaySeconds has negative value', async () => {
    mockData.healthChecks.readinessProbe.data.initialDelaySeconds = -1;
    await healthChecksValidationSchema.validate(mockData).catch((err) => {
      expect(err.message).toBe('Initial Delay must be greater than or equal to 0.');
    });
  });

  it('should throw error if failureThreshold has minimum value less than 1.', async () => {
    mockData.healthChecks.readinessProbe.data.failureThreshold = 0;
    await healthChecksValidationSchema
      .validate(mockData)
      .catch((err) =>
        expect(err.message).toEqual('Failure Threshold must be greater than or equal to 1.'),
      );
  });

  it('should throw error if timeoutSeconds has minimum value less than 1.', async () => {
    mockData.healthChecks.readinessProbe.data.failureThreshold = 0;
    await healthChecksValidationSchema
      .validate(mockData)
      .catch((err) => expect(err.message).toEqual('Timeout must be greater than or equal to 1.'));
  });

  it('should throw error if successThreshold has minimum value less than 1.', async () => {
    mockData.healthChecks.readinessProbe.data.failureThreshold = 0;
    await healthChecksValidationSchema
      .validate(mockData)
      .catch((err) =>
        expect(err.message).toEqual('Success Threshold must be greater than or equal to 1.'),
      );
  });

  it('should throw an error if path is invalid', async () => {
    mockData.healthChecks.readinessProbe.data.httpGet.path = 'path';
    await healthChecksValidationSchema.validate(mockData).catch((err) => {
      expect(err.message).toBe('Path must start with /.');
    });
  });
});
