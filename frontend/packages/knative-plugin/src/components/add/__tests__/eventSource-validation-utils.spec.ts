import * as _ from 'lodash';
import { getDefaultEventingData } from '../../../utils/__tests__/knative-serving-data';
import { eventSourceValidationSchema } from '../eventSource-validation-utils';
import { EventSources } from '../import-types';

describe('Event Source ValidationUtils', () => {
  describe('CronJobSource : Event Source Validation', () => {
    it('should validate the form data', async () => {
      const defaultEventingData = getDefaultEventingData(EventSources.CronJobSource);
      const mockData = _.omit(_.cloneDeep(defaultEventingData), 'data.CronJobSource.data');
      await eventSourceValidationSchema()
        .resolve({ value: mockData })
        .isValid(mockData)
        .then((valid) => expect(valid).toEqual(true));
    });

    it('should throw an error for required fields if empty', async () => {
      const defaultEventingData = getDefaultEventingData(EventSources.CronJobSource);
      const mockData = _.cloneDeep(defaultEventingData);
      mockData.formData.sink = {
        apiVersion: '',
        name: '',
        kind: '',
        key: '',
      };
      await eventSourceValidationSchema()
        .resolve({ value: mockData })
        .isValid(mockData)
        .then((valid) => expect(valid).toEqual(false));
      await eventSourceValidationSchema()
        .validate(mockData)
        .catch((err) => {
          expect(err.message).toBe('Required');
          expect(err.type).toBe('required');
        });
    });
  });

  describe('ApiServerSource : Event Source Validation', () => {
    it('should validate the form data', async () => {
      const defaultEventingData = getDefaultEventingData(EventSources.ApiServerSource);
      const mockData = _.cloneDeep(defaultEventingData);
      await eventSourceValidationSchema()
        .resolve({ value: mockData })
        .isValid(mockData)
        .then((valid) => expect(valid).toEqual(true));
    });

    it('should throw an error for required fields if empty', async () => {
      const defaultEventingData = getDefaultEventingData(EventSources.ApiServerSource);
      const mockData = _.cloneDeep(defaultEventingData);
      mockData.formData.sink = {
        apiVersion: '',
        name: '',
        kind: '',
        key: '',
      };
      mockData.formData.data.ApiServerSource.resources[0] = { apiVersion: '', kind: '' };
      await eventSourceValidationSchema()
        .resolve({ value: mockData })
        .isValid(mockData)
        .then((valid) => expect(valid).toEqual(false));
      await eventSourceValidationSchema()
        .validate(mockData)
        .catch((err) => {
          expect(err.message).toBe('Required');
          expect(err.type).toBe('required');
        });
    });
  });

  describe('KafkaSource : Event Source Validation', () => {
    it('should validate the form data', async () => {
      const defaultEventingData = getDefaultEventingData(EventSources.KafkaSource);
      const mockData = _.cloneDeep(defaultEventingData);
      await eventSourceValidationSchema()
        .resolve({ value: mockData })
        .isValid(mockData)
        .then((valid) => expect(valid).toEqual(true));
    });

    it('should throw an error for required fields if empty', async () => {
      const defaultEventingData = getDefaultEventingData(EventSources.KafkaSource);
      const mockData = _.cloneDeep(defaultEventingData);
      mockData.formData.data.KafkaSource.bootstrapServers = [];
      await eventSourceValidationSchema()
        .resolve({ value: mockData })
        .isValid(mockData)
        .then((valid) => expect(valid).toEqual(false));
      await eventSourceValidationSchema()
        .validate(mockData)
        .catch((err) => {
          expect(err.message).toBe('Required');
          expect(err.type).toBe('min');
        });
    });

    it('should not throw error if net section is empty', async () => {
      const defaultEventingData = getDefaultEventingData(EventSources.KafkaSource);
      const mockData = _.cloneDeep(defaultEventingData);
      delete mockData.formData.data.KafkaSource.net;
      await eventSourceValidationSchema()
        .resolve({ value: mockData })
        .isValid(mockData)
        .then((valid) => expect(valid).toEqual(true));
    });
  });

  describe('ContainerSource : Event Source Validation', () => {
    it('should not throw error when the form data has valid values', async () => {
      const ContainerSourceData = {
        ...getDefaultEventingData(EventSources.ContainerSource),
      };
      await eventSourceValidationSchema()
        .resolve({ value: ContainerSourceData })
        .isValid(ContainerSourceData)
        .then((valid) => expect(valid).toEqual(true));
    });

    it('should throw an error for required fields if empty', async () => {
      const ContainerSourceData = {
        ...getDefaultEventingData(EventSources.ContainerSource),
      };
      ContainerSourceData.formData.data.ContainerSource.template.spec.containers[0].image = '';
      await eventSourceValidationSchema()
        .resolve({ value: ContainerSourceData })
        .isValid(ContainerSourceData)
        .then((valid) => expect(valid).toEqual(false));
      await eventSourceValidationSchema()
        .validate(ContainerSourceData)
        .catch((err) => {
          expect(err.message).toBe('Required');
          expect(err.type).toBe('required');
        });
    });
  });

  describe('PingSource : Event Source Validation', () => {
    it('should validate the form data', async () => {
      const defaultEventingData = getDefaultEventingData(EventSources.PingSource);
      const mockData = _.cloneDeep(defaultEventingData);
      await eventSourceValidationSchema()
        .resolve({ value: mockData })
        .isValid(mockData)
        .then((valid) => expect(valid).toEqual(true));
    });

    it('should throw an error for required fields if empty', async () => {
      const defaultEventingData = getDefaultEventingData(EventSources.PingSource);
      const mockData = _.cloneDeep(defaultEventingData);
      mockData.formData.data.PingSource.schedule = '';
      await eventSourceValidationSchema()
        .resolve({ value: mockData })
        .isValid(mockData)
        .then((valid) => expect(valid).toEqual(false));
      await eventSourceValidationSchema()
        .validate(mockData)
        .catch((err) => {
          expect(err.message).toBe('Required');
          expect(err.type).toBe('required');
        });
    });
  });
});
