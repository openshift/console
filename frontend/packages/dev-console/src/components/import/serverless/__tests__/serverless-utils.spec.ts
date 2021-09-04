import {
  getAllOtherDomainMappingInUse,
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
    expect(removeDuplicateDomainMappings([], [])).toEqual([]);
  });

  it('should return the domainMapping  even if the connected domains are empty or invalid ', () => {
    expect(removeDuplicateDomainMappings(['domain.org'], null)).toEqual(['domain.org']);
    expect(removeDuplicateDomainMappings(['domain.org'], [])).toEqual(['domain.org']);
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

  it('should return null as the ksvc name if it is matching with the current ksvc name', () => {
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

describe('getAllOtherDomainMappingInUse', () => {
  it('should return empty array for the empty input', () => {
    expect(getAllOtherDomainMappingInUse([], [], 'test')).toEqual([]);
  });

  it('should return empty array if selected domain is not already in the cluster', () => {
    expect(getAllOtherDomainMappingInUse(['domain.org'], [], 'service-one')).toEqual([]);
  });

  it('should return empty if the selected domain is mapped to current knative service', () => {
    const selectedDomains = ['example.domain1.org'];
    const currentKsvc = 'service-one';
    const domainsInUse = getAllOtherDomainMappingInUse(
      selectedDomains,
      domainMappings,
      currentKsvc,
    );
    expect(domainsInUse).toHaveLength(0);
  });

  it('should return domains if the selected domains are not mapped to current Knative service', () => {
    const domainsInUse = getAllOtherDomainMappingInUse(
      ['example.domain1.org (service-one)', 'example.domain2.org (service-two)'],
      domainMappings,
      'service-three',
    );
    expect(domainsInUse).toHaveLength(2);
    expect(domainsInUse[0].metadata.name).toBe('example.domain1.org');
    expect(domainsInUse[1].metadata.name).toBe('example.domain2.org');
  });

  it('should not return domains if the user creates domain with the same name again', () => {
    const domainsInUse = getAllOtherDomainMappingInUse(
      ['example.domain1.org', 'example.domain2.org'],
      domainMappings,
      'service-three',
    );
    expect(domainsInUse).toHaveLength(0);
  });
});
