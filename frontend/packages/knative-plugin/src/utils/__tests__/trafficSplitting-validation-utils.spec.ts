import { trafficModalValidationSchema } from '../trafficSplitting-validation-utils';
import { mockTrafficData } from '../__mocks__/traffic-splitting-utils-mock';
import { TrafficSplittingType } from '../../components/traffic-splitting/TrafficSplitting';

describe('Traffic Splitting Validation Utils', () => {
  let mockTraffic: TrafficSplittingType;
  beforeEach(() => {
    mockTraffic = {
      trafficSplitting: mockTrafficData,
    };
  });

  it('should validate the form data', async () => {
    await trafficModalValidationSchema
      .isValid(mockTraffic)
      .then((valid) => expect(valid).toEqual(true));
  });

  it('should throw error for required field if empty', async () => {
    const mockErroneousTrafficData = mockTrafficData;
    mockErroneousTrafficData.push({
      percent: undefined,
      tag: undefined,
      revisionName: 'overlayimage-fdqsf',
    });
    mockTraffic = {
      trafficSplitting: mockErroneousTrafficData,
    };
    await trafficModalValidationSchema
      .isValid(mockTraffic)
      .then((valid) => expect(valid).toEqual(false));
    await trafficModalValidationSchema.validate(mockTraffic).catch((err) => {
      expect(err.message).toBe('Required');
      expect(err.type).toBe('required');
    });
  });

  it('should trhow error if tag name contains special character', async () => {
    const mockErroneousTrafficData = mockTrafficData;
    mockErroneousTrafficData[0].tag = 't.0';
    mockTraffic = {
      trafficSplitting: mockErroneousTrafficData,
    };
    await trafficModalValidationSchema
      .isValid(mockTraffic)
      .then((valid) => expect(valid).toEqual(false));
    await trafficModalValidationSchema.validate(mockTraffic).catch((err) => {
      expect(err.message).toBe(
        'tag name must consist of lower-case letters, numbers and hyphens. It must start with a letter and end with a letter or number.',
      );
    });
  });
});
