import { t } from 'i18next';
import * as _ from 'lodash';
import { getDefaultEventingData } from '../../../utils/__tests__/knative-serving-data';
import { eventSourceValidationSchema } from '../eventSource-validation-utils';
import { EventSources } from '../import-types';

jest.mock('i18next');

describe('Event Source ValidationUtils', () => {
  describe('ApiServerSource : Event Source Validation', () => {
    it('should validate the form data', async () => {
      const defaultEventingData = getDefaultEventingData(EventSources.ApiServerSource);
      const mockData = _.cloneDeep(defaultEventingData);
      await eventSourceValidationSchema(t)
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
      await eventSourceValidationSchema(t)
        .resolve({ value: mockData })
        .isValid(mockData)
        .then((valid) => expect(valid).toEqual(false));
      await expect(eventSourceValidationSchema(t).validate(mockData)).rejects.toMatchObject({
        message: 'Required',
        type: 'required',
      });
    });
  });

  describe('KafkaSource : Event Source Validation', () => {
    it('should validate the form data', async () => {
      const defaultEventingData = getDefaultEventingData(EventSources.KafkaSource);
      const mockData = _.cloneDeep(defaultEventingData);
      await eventSourceValidationSchema(t)
        .resolve({ value: mockData })
        .isValid(mockData)
        .then((valid) => expect(valid).toEqual(true));
    });

    it('should throw an error for required fields if empty', async () => {
      const defaultEventingData = getDefaultEventingData(EventSources.KafkaSource);
      const mockData = _.cloneDeep(defaultEventingData);
      mockData.formData.data.KafkaSource.bootstrapServers = [];
      await eventSourceValidationSchema(t)
        .resolve({ value: mockData })
        .isValid(mockData)
        .then((valid) => expect(valid).toEqual(false));
      await expect(eventSourceValidationSchema(t).validate(mockData)).rejects.toMatchObject({
        message: 'Required',
        type: 'min',
      });
    });

    it('should not throw error if net section is empty', async () => {
      const defaultEventingData = getDefaultEventingData(EventSources.KafkaSource);
      const mockData = _.cloneDeep(defaultEventingData);
      delete mockData.formData.data.KafkaSource.net;
      await eventSourceValidationSchema(t)
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
      await eventSourceValidationSchema(t)
        .resolve({ value: ContainerSourceData })
        .isValid(ContainerSourceData)
        .then((valid) => expect(valid).toEqual(true));
    });

    it('should throw an error for required fields if empty', async () => {
      const ContainerSourceData = {
        ...getDefaultEventingData(EventSources.ContainerSource),
      };
      ContainerSourceData.formData.data.ContainerSource.template.spec.containers[0].image = '';
      await eventSourceValidationSchema(t)
        .resolve({ value: ContainerSourceData })
        .isValid(ContainerSourceData)
        .then((valid) => expect(valid).toEqual(false));
      await expect(
        eventSourceValidationSchema(t).validate(ContainerSourceData),
      ).rejects.toMatchObject({
        message: 'Required',
        type: 'required',
      });
    });
  });

  describe('PingSource : Event Source Validation', () => {
    it('should validate the form data', async () => {
      const defaultEventingData = getDefaultEventingData(EventSources.PingSource);
      const mockData = _.cloneDeep(defaultEventingData);
      await eventSourceValidationSchema(t)
        .resolve({ value: mockData })
        .isValid(mockData)
        .then((valid) => expect(valid).toEqual(true));
    });

    it('should throw an error for required fields if empty', async () => {
      const defaultEventingData = getDefaultEventingData(EventSources.PingSource);
      const mockData = _.cloneDeep(defaultEventingData);
      mockData.formData.data.PingSource.schedule = '';
      await eventSourceValidationSchema(t)
        .resolve({ value: mockData })
        .isValid(mockData)
        .then((valid) => expect(valid).toEqual(false));
      await expect(eventSourceValidationSchema(t).validate(mockData)).rejects.toMatchObject({
        message: 'Required',
        type: 'required',
      });
    });
  });
});
