import { getComputedServiceBindingStatus } from '../utils';
import { allConnectedServiceBindings, allFailedServiceBindings } from './mock-data';

describe('getComputedServiceBindingStatus', () => {
  it('should return Connected when all three conditions are true', async () => {
    allConnectedServiceBindings.forEach((serviceBinding) => {
      expect(getComputedServiceBindingStatus(serviceBinding)).toBe('Connected');
    });
  });

  it('should return Error when one of the three conditions are false or missing', async () => {
    allFailedServiceBindings.forEach((serviceBinding) => {
      expect(getComputedServiceBindingStatus(serviceBinding)).toBe('Error');
    });
  });
});
