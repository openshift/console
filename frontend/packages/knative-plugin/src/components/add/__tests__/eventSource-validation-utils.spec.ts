import { cloneDeep } from 'lodash';
import { eventSourceValidationSchema } from '../eventSource-validation-utils';
import { defaultEventingData } from '../../../utils/__tests__/knative-serving-data';

describe('Event Source ValidationUtils', () => {
  it('should validate the form data', async () => {
    const mockData = cloneDeep(defaultEventingData);
    await eventSourceValidationSchema
      .isValid(mockData)
      .then((valid) => expect(valid).toEqual(true));
  });

  it('should throw an error for required fields if empty', async () => {
    const mockData = cloneDeep(defaultEventingData);
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
