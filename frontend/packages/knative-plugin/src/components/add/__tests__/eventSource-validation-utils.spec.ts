import * as _ from 'lodash';
import { eventSourceValidationSchema } from '../eventSource-validation-utils';
import { getDefaultEventingData } from '../../../utils/__tests__/knative-serving-data';
import { EventSources } from '../import-types';

describe('Event Source ValidationUtils', () => {
  describe('CronJobSource : Event Source Validation', () => {
    it('should validate the form data', async () => {
      const defaultEventingData = getDefaultEventingData(EventSources.CronJobSource);
      const mockData = _.omit(_.cloneDeep(defaultEventingData), 'data.cronjobsource.data');
      await eventSourceValidationSchema
        .isValid(mockData)
        .then((valid) => expect(valid).toEqual(true));
    });

    it('should throw an error for required fields if empty', async () => {
      const defaultEventingData = getDefaultEventingData(EventSources.CronJobSource);
      const mockData = _.cloneDeep(defaultEventingData);
      mockData.sink.knativeService = '';
      await eventSourceValidationSchema
        .isValid(mockData)
        .then((valid) => expect(valid).toEqual(false));
      await eventSourceValidationSchema.validate(mockData).catch((err) => {
        expect(err.message).toBe('Required');
        expect(err.type).toBe('required');
      });
    });
  });

  describe('ApiServerSource : Event Source Validation', () => {
    it('should validate the form data', async () => {
      const defaultEventingData = getDefaultEventingData(EventSources.ApiServerSource);
      const mockData = _.cloneDeep(defaultEventingData);
      await eventSourceValidationSchema
        .isValid(mockData)
        .then((valid) => expect(valid).toEqual(true));
    });

    it('should throw an error for required fields if empty', async () => {
      const defaultEventingData = getDefaultEventingData(EventSources.ApiServerSource);
      const mockData = _.cloneDeep(defaultEventingData);
      mockData.sink.knativeService = '';
      mockData.data.apiserversource.resources[0] = { apiVersion: '', kind: '' };
      await eventSourceValidationSchema
        .isValid(mockData)
        .then((valid) => expect(valid).toEqual(false));
      await eventSourceValidationSchema.validate(mockData).catch((err) => {
        expect(err.message).toBe('Required');
        expect(err.type).toBe('required');
      });
    });
  });

  describe('KafkaSource : Event Source Validation', () => {
    it('should validate the form data', async () => {
      const defaultEventingData = getDefaultEventingData(EventSources.KafkaSource);
      const mockData = _.cloneDeep(defaultEventingData);
      await eventSourceValidationSchema
        .isValid(mockData)
        .then((valid) => expect(valid).toEqual(true));
    });

    it('should throw an error for required fields if empty', async () => {
      const defaultEventingData = getDefaultEventingData(EventSources.KafkaSource);
      const mockData = _.cloneDeep(defaultEventingData);
      mockData.data.kafkasource.bootstrapServers = '';
      await eventSourceValidationSchema
        .isValid(mockData)
        .then((valid) => expect(valid).toEqual(false));
      await eventSourceValidationSchema.validate(mockData).catch((err) => {
        expect(err.message).toBe('Required');
        expect(err.type).toBe('required');
      });
    });
  });
});
