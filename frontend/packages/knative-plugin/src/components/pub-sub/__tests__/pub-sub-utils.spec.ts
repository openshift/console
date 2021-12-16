import {
  EventBrokerObj,
  EventIMCObj,
  knativeServiceObj,
  sampleDeploymentsCamelConnector,
  sampleServices,
} from '../../../topology/__tests__/topology-knative-test-data';
import {
  RESOURCE_KEY_SEPERATOR,
  craftResourceKey,
  getResourceNameFromKey,
  getSinkableResourceOrder,
} from '../pub-sub-utils';

describe('pub-sub-utils', () => {
  const service = { ...sampleServices.data[0], apiVersion: 'core/v1' };

  describe('craftResourceKey', () => {
    it('should return undefined if the resource is not having kind or apiversion', () => {
      expect(craftResourceKey('test', { metadata: { name: 'test' } })).toBeUndefined();
    });

    it('should return undefined if the name is not passed', () => {
      expect(craftResourceKey('', { ...service, metadata: { name: '' } })).toBeUndefined();
    });

    it('should return a valid resource key', () => {
      expect(craftResourceKey('nodejs-ex', service)).toBe('4#core~v1~Service#nodejs-ex');
    });

    it('should differentiate k8s service and knative service', () => {
      expect(craftResourceKey('nodejs-ex', service)).toBe('4#core~v1~Service#nodejs-ex');
      expect(craftResourceKey('nodejs-ex', knativeServiceObj)).toBe(
        '1#serving.knative.dev~v1~Service#nodejs-ex',
      );
    });
  });

  describe('getSinkableResourceOrder', () => {
    it('sort order should 1 if knative service is passed', () => {
      expect(getSinkableResourceOrder(knativeServiceObj.apiVersion)).toBe(1);
    });

    it('sort order should 2 if channel is passed', async () => {
      expect(getSinkableResourceOrder(EventIMCObj.apiVersion)).toBe(2);
    });

    it('sort order should 3 if broker is passed', () => {
      expect(getSinkableResourceOrder(EventBrokerObj.apiVersion)).toBe(3);
    });

    it('sort order should 4 if k8s service is passed', () => {
      expect(getSinkableResourceOrder(service.apiVersion)).toBe(4);
    });

    it('sort order should 4 for any unknown or non-knative resources', () => {
      expect(getSinkableResourceOrder(sampleDeploymentsCamelConnector.data[0].apiVersion)).toBe(4);
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
