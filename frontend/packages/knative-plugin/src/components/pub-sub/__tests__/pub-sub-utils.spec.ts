import {
  knativeServiceObj,
  sampleServices,
} from '../../../topology/__tests__/topology-knative-test-data';
import { RESOURCE_KEY_SEPERATOR, craftResourceKey, getResourceNameFromKey } from '../pub-sub-utils';

describe('pub-sub-utils', () => {
  const service = sampleServices.data[0];

  describe('craftResourceKey', () => {
    it('should return the name if the resource is not having kind and apiversion', () => {
      expect(craftResourceKey('test', { metadata: { name: '' } })).toBe(
        `${RESOURCE_KEY_SEPERATOR}test`,
      );
    });

    it('should return undefined if the name is not passed', () => {
      expect(craftResourceKey('', { metadata: { name: '' } })).toBeUndefined();
    });

    it('should return a valid resource key', () => {
      expect(craftResourceKey('nodejs-ex', service)).toBe('core~v1~Service#nodejs-ex');
    });

    it('should differentiate k8s service and knative service', () => {
      expect(craftResourceKey('nodejs-ex', service)).toBe('core~v1~Service#nodejs-ex');
      expect(craftResourceKey('nodejs-ex', knativeServiceObj)).toBe(
        'serving.knative.dev~v1~Service#nodejs-ex',
      );
    });
  });
  describe('getResourceNameFromKey', () => {
    it('should return the name of the resource from the resource key', () => {
      expect(getResourceNameFromKey(`${RESOURCE_KEY_SEPERATOR}test`)).toBe('test');
      expect(getResourceNameFromKey(`core~v1~Service${RESOURCE_KEY_SEPERATOR}test`)).toBe('test');
      expect(
        getResourceNameFromKey(`serving.knative.dev~v1~Service${RESOURCE_KEY_SEPERATOR}test`),
      ).toBe('test');
    });

    it('should return empty string if invalid argument is passed', () => {
      expect(getResourceNameFromKey('')).toBe('');
      expect(getResourceNameFromKey(null)).toBe('');
      expect(getResourceNameFromKey(undefined)).toBe('');
    });
  });
});
