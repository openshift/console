import { t } from 'i18next';
import { cloneDeep } from 'lodash';
import { healthChecksDefaultValues } from '../health-checks-probe-utils';
import { healthChecksValidationSchema, MAX_INT32 } from '../health-checks-probe-validation-utils';

jest.mock('i18next');

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
    mockData.healthChecks.readinessProbe.modified = false;
  });

  it('should validate the form data', async () => {
    expect(
      await healthChecksValidationSchema(t).isValid(mockData.healthChecks.readinessProbe),
    ).toEqual(true);
  });

  it('should throw error if periodSeconds has minimum value less than 1', async () => {
    mockData.healthChecks.readinessProbe.data.periodSeconds = 0;
    await expect(
      healthChecksValidationSchema(t).validate(mockData.healthChecks.readinessProbe),
    ).rejects.toThrow('Period must be greater than or equal to 1.');
  });

  it('should throw error if periodSeconds is greater than maximum safe integer', async () => {
    mockData.healthChecks.readinessProbe.data.periodSeconds = MAX_INT32 + 1;
    await expect(
      healthChecksValidationSchema(t).validate(mockData.healthChecks.readinessProbe),
    ).rejects.toThrow('Value is larger than maximum value allowed.');
  });

  it('should throw error if periodSeconds is not an integer', async () => {
    mockData.healthChecks.readinessProbe.data.periodSeconds = 4.2;
    await expect(
      healthChecksValidationSchema(t).validate(mockData.healthChecks.readinessProbe),
    ).rejects.toThrow('Value must be an integer.');
  });

  it('should throw error if initialDelaySeconds has negative value', async () => {
    mockData.healthChecks.readinessProbe.data.initialDelaySeconds = -1;
    await expect(
      healthChecksValidationSchema(t).validate(mockData.healthChecks.readinessProbe),
    ).rejects.toThrow('Initial delay must be greater than or equal to 0.');
  });

  it('should throw error if initialDelaySeconds is greater than maximum safe integer', async () => {
    mockData.healthChecks.readinessProbe.data.initialDelaySeconds = MAX_INT32 + 1;
    await expect(
      healthChecksValidationSchema(t).validate(mockData.healthChecks.readinessProbe),
    ).rejects.toThrow('Value is larger than maximum value allowed.');
  });

  it('should throw error if initialDelaySeconds is not an integer', async () => {
    mockData.healthChecks.readinessProbe.data.initialDelaySeconds = 4.2;
    await expect(
      healthChecksValidationSchema(t).validate(mockData.healthChecks.readinessProbe),
    ).rejects.toThrow('Value must be an integer.');
  });

  it('should throw error if failureThreshold has minimum value less than 1.', async () => {
    mockData.healthChecks.readinessProbe.data.failureThreshold = 0;
    await expect(
      healthChecksValidationSchema(t).validate(mockData.healthChecks.readinessProbe),
    ).rejects.toThrow('Failure threshold must be greater than or equal to 1.');
  });

  it('should throw error if failureThreshold is not an integer', async () => {
    mockData.healthChecks.readinessProbe.data.failureThreshold = 4.2;
    await expect(
      healthChecksValidationSchema(t).validate(mockData.healthChecks.readinessProbe),
    ).rejects.toThrow('Value must be an integer.');
  });

  it('should throw error if timeoutSeconds has minimum value less than 1.', async () => {
    mockData.healthChecks.readinessProbe.data.timeoutSeconds = 0;
    await expect(
      healthChecksValidationSchema(t).validate(mockData.healthChecks.readinessProbe),
    ).rejects.toThrow('Timeout must be greater than or equal to 1.');
  });

  it('should throw error if timeoutSeconds is greater than maximum safe integer', async () => {
    mockData.healthChecks.readinessProbe.data.timeoutSeconds = MAX_INT32 + 1;
    await expect(
      healthChecksValidationSchema(t).validate(mockData.healthChecks.readinessProbe),
    ).rejects.toThrow('Value is larger than maximum value allowed.');
  });

  it('should throw error if timeoutSeconds is not an integer', async () => {
    mockData.healthChecks.readinessProbe.data.timeoutSeconds = 4.2;
    await expect(
      healthChecksValidationSchema(t).validate(mockData.healthChecks.readinessProbe),
    ).rejects.toThrow('Value must be an integer.');
  });

  it('should throw error if successThreshold has minimum value less than 1.', async () => {
    mockData.healthChecks.readinessProbe.data.successThreshold = 0;
    await expect(
      healthChecksValidationSchema(t).validate(mockData.healthChecks.readinessProbe),
    ).rejects.toThrow('Success threshold must be greater than or equal to 1.');
  });

  it('should throw error if successThreshold is greater than maximum safe integer', async () => {
    mockData.healthChecks.readinessProbe.data.successThreshold = MAX_INT32 + 1;
    await expect(
      healthChecksValidationSchema(t).validate(mockData.healthChecks.readinessProbe),
    ).rejects.toThrow('Value is larger than maximum value allowed.');
  });

  it('should throw error if successThreshold is not an integer', async () => {
    mockData.healthChecks.readinessProbe.data.successThreshold = 4.2;
    await expect(
      healthChecksValidationSchema(t).validate(mockData.healthChecks.readinessProbe),
    ).rejects.toThrow('Value must be an integer.');
  });

  it('should throw an error if path is invalid', async () => {
    mockData.healthChecks.readinessProbe.data.httpGet.path = 'path';
    await expect(
      healthChecksValidationSchema(t).validate(mockData.healthChecks.readinessProbe),
    ).rejects.toThrow('Path must start with /.');
  });
});
