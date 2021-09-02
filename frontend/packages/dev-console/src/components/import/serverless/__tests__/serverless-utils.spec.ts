import {
  getAutoscaleWindow,
  getOtherKsvcFromDomainMapping,
  hasOtherKsvcDomainMappings,
  removeDuplicateDomainMappings,
  removeKsvcInfoFromDomainMapping,
} from '../serverless-utils';
import { domainMappings } from './serverless-utils.data';

describe('serverless-utils', () => {
  it('should return valid autoscale value and unit', () => {
    const { autoscalewindow, autoscalewindowUnit, defaultAutoscalewindowUnit } = getAutoscaleWindow(
      '6s',
    );
    expect(autoscalewindow).toBe(6);
    expect(autoscalewindowUnit).toBe('s');
    expect(defaultAutoscalewindowUnit).toBe('s');
    const {
      autoscalewindow: autoscaleValue1,
      autoscalewindowUnit: autoscaleUnit1,
      defaultAutoscalewindowUnit: defaultScaleUnit1,
    } = getAutoscaleWindow('30m');
    expect(autoscaleValue1).toBe(30);
    expect(autoscaleUnit1).toBe('m');
    expect(defaultScaleUnit1).toBe('m');
  });
  it('should return valid value and unit', () => {
    const { autoscalewindow, autoscalewindowUnit, defaultAutoscalewindowUnit } = getAutoscaleWindow(
      '12min',
    );
    expect(autoscalewindow).toBe(12);
    expect(autoscalewindowUnit).toBe('min');
    expect(defaultAutoscalewindowUnit).toBe('min');
  });
  it('should return valid value and unit', () => {
    const { autoscalewindow, autoscalewindowUnit, defaultAutoscalewindowUnit } = getAutoscaleWindow(
      '12min',
    );
    expect(autoscalewindow).toBe(12);
    expect(autoscalewindowUnit).toBe('min');
    expect(defaultAutoscalewindowUnit).toBe('min');
  });
  it('should return default unit s', () => {
    const { autoscalewindow, autoscalewindowUnit, defaultAutoscalewindowUnit } = getAutoscaleWindow(
      '',
    );
    expect(autoscalewindow).toBe('');
    expect(autoscalewindowUnit).toBe('s');
    expect(defaultAutoscalewindowUnit).toBe('s');
    const {
      autoscalewindow: autoscaleValue1,
      autoscalewindowUnit: autoscaleUnit1,
      defaultAutoscalewindowUnit: defaultscaleUnit1,
    } = getAutoscaleWindow('12');
    expect(autoscaleValue1).toBe(12);
    expect(autoscaleUnit1).toBe('s');
    expect(defaultscaleUnit1).toBe('s');
  });
});

describe('hasOtherKsvcDomainMappings', () => {
  it('should return false if the domain mapping is empty', () => {
    expect(hasOtherKsvcDomainMappings([])).toBe(false);
  });

  it('should return false if the other ksvc info is not present in domain mapping', () => {
    expect(hasOtherKsvcDomainMappings(['abc.org', 'example.org'])).toBe(false);
  });

  it('should return true if the other ksvc info is present in domain mapping', () => {
    expect(hasOtherKsvcDomainMappings(['abc.org', 'example.org', 'domain.ksvc1 (ksvc1)'])).toBe(
      true,
    );
  });
});

describe('removeDuplicateDomainMappings', () => {
  it('should return empty arary if the domain mapping empty or null', () => {
    expect(removeDuplicateDomainMappings(null, null)).toEqual([]);
    expect(removeDuplicateDomainMappings(['a'], null)).toEqual([]);
    expect(removeDuplicateDomainMappings([], [])).toEqual([]);
  });

  it('should return unique value in the array', () => {
    expect(removeDuplicateDomainMappings(['domain.org'], ['domain.org'])).toEqual(['domain.org']);
  });

  it('should strip the ksvc info and return unique value in the array', () => {
    expect(
      removeDuplicateDomainMappings(['domain.org (ksvc1)', 'domain.org'], ['domain.org']),
    ).toEqual(['domain.org']);
  });
});

describe('getOtherKsvcFromDomainMapping', () => {
  it('should return null for invalid values', () => {
    expect(getOtherKsvcFromDomainMapping({}, '')).toBeNull();
  });

  it('should return null the ksvc name if is matching with the current ksvc name', () => {
    expect(
      getOtherKsvcFromDomainMapping(domainMappings[0], domainMappings[0].spec.ref.name),
    ).toBeNull();
  });

  it('should return the ksvc name if its not matching with the current ksvc name', () => {
    const currentKsvcName = domainMappings[1].spec.ref.name;
    expect(getOtherKsvcFromDomainMapping(domainMappings[0], currentKsvcName)).toEqual(
      'service-one',
    );
  });
});

describe('removeKsvcInfoFromDomainMapping', () => {
  it('should return empty string', () => {
    expect(removeKsvcInfoFromDomainMapping('')).toBe('');
  });

  it('should return the same domain name if the ksvc info is not in the string', () => {
    expect(removeKsvcInfoFromDomainMapping('domain.org')).toBe('domain.org');
  });

  it('should return only the domain name if the ksvc info is the string', () => {
    expect(removeKsvcInfoFromDomainMapping('domain.org (ksvc-service-one)')).toBe('domain.org');
  });
});
