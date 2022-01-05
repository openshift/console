import { getEventSourceSupport } from '../utils';
import { kameletsData } from './eventSourceKamelets-data';

describe('getEventSourceSupport', () => {
  it('should return Community support type if the label is not present', () => {
    const supportText = getEventSourceSupport(kameletsData[3]);
    expect(supportText).toBe('Community');
  });

  it('should return Supported support type', () => {
    const supportText = getEventSourceSupport(kameletsData[1]);
    expect(supportText).toBe('Supported');
  });

  it('should return Tech Preview support type', () => {
    const supportText = getEventSourceSupport(kameletsData[0]);
    expect(supportText).toBe('Tech Preview');
  });

  it('should return Community support type', () => {
    const supportText = getEventSourceSupport(kameletsData[2]);
    expect(supportText).toBe('Community');
  });
});
