import { MockKnativeResources } from '@console/dev-console/src/components/topology/__tests__/topology-knative-test-data';
import { MockResources } from '@console/dev-console/src/components/topology/__tests__/topology-test-data';
import {
  getKnativeServingRevisions,
  getKnativeServingConfigurations,
  getKnativeServingRoutes,
  getKnativeServingServices,
  getEventSourceCronjob,
  getEventSourceContainer,
  getEventSourceCamel,
  getEventSourceKafka,
  getEventSourceSinkBinding,
} from '../get-knative-resources';
import {
  deploymentData,
  deploymentKnativeData,
  deploymentKnativeEventData,
} from './knative-serving-data';

describe('Get knative resources', () => {
  describe('knative Serving Resources', () => {
    it('expect getKnativeServingRevisions to return revision data', () => {
      const knServingRevResource = getKnativeServingRevisions(
        deploymentKnativeData,
        MockKnativeResources,
      );
      expect(knServingRevResource.revisions).toBeDefined();
      expect(knServingRevResource.revisions).toHaveLength(1);
    });
    it('expect getKnativeServingRevisions to return revision as undefined', () => {
      const knServingResource = getKnativeServingRevisions(deploymentData, MockResources);
      expect(knServingResource).toBeUndefined();
    });
    it('expect getKnativeServingConfigurations to return configuration data', () => {
      const knServingResource = getKnativeServingConfigurations(
        deploymentKnativeData,
        MockKnativeResources,
      );
      expect(knServingResource.configurations).toBeDefined();
      expect(knServingResource.configurations).toHaveLength(1);
    });
    it('expect getKnativeServingConfigurations to return configuration as undefined', () => {
      const knServingResource = getKnativeServingConfigurations(deploymentData, MockResources);
      expect(knServingResource).toBeUndefined();
    });
    it('expect getKnativeServingRoutes to return route data', () => {
      const knServingResource = getKnativeServingRoutes(
        deploymentKnativeData,
        MockKnativeResources,
      );
      expect(knServingResource.ksroutes).toBeDefined();
      expect(knServingResource.ksroutes).toHaveLength(1);
    });
    it('expect getKnativeServingRoutes to return route as undefined', () => {
      const knServingResource = getKnativeServingRoutes(deploymentData, MockResources);
      expect(knServingResource).toBeUndefined();
    });
    it('expect getKnativeServingServices to return service data', () => {
      const knServingResource = getKnativeServingServices(
        deploymentKnativeData,
        MockKnativeResources,
      );
      expect(knServingResource.ksservices).toBeDefined();
      expect(knServingResource.ksservices).toHaveLength(1);
    });
    it('expect getKnativeServingServices to return service as undefined', () => {
      const knServingResource = getKnativeServingServices(deploymentData, MockResources);
      expect(knServingResource).toBeUndefined();
    });
    it('expect getEventSourceCronjob to return event source data', () => {
      const knEventResource = getEventSourceCronjob(
        deploymentKnativeEventData,
        MockKnativeResources,
      );
      expect(knEventResource.eventSourceCronjob).toBeDefined();
      expect(knEventResource.eventSourceCronjob).toHaveLength(1);
    });
    it('expect getEventSourceCronjob to return event source as undefined', () => {
      const knEventResource = getKnativeServingServices(deploymentData, MockResources);
      expect(knEventResource).toBeUndefined();
    });
    it('expect getEventSourceContainer to return event source data', () => {
      const knEventResource = getEventSourceContainer(
        deploymentKnativeEventData,
        MockKnativeResources,
      );
      expect(knEventResource.eventSourceContainers).toBeDefined();
      expect(knEventResource.eventSourceContainers).toHaveLength(1);
    });
    it('expect getEventSourceContainer to return event source as undefined', () => {
      const knEventResource = getEventSourceContainer(deploymentData, MockResources);
      expect(knEventResource).toBeUndefined();
    });
    it('expect getEventSourceCamel to return event source data', () => {
      const knEventResource = getEventSourceCamel(deploymentKnativeEventData, MockKnativeResources);
      expect(knEventResource.eventSourceCamel).toBeDefined();
      expect(knEventResource.eventSourceCamel).toHaveLength(1);
    });
    it('expect getEventSourceCamel to return event source as undefined', () => {
      const knEventResource = getEventSourceCamel(deploymentData, MockResources);
      expect(knEventResource).toBeUndefined();
    });
    it('expect getEventSourceKafka to return event source data', () => {
      const knEventResource = getEventSourceKafka(deploymentKnativeEventData, MockKnativeResources);
      expect(knEventResource.eventSourceKafka).toBeDefined();
      expect(knEventResource.eventSourceKafka).toHaveLength(1);
    });
    it('expect getEventSourceKafka to return event source as undefined', () => {
      const knEventResource = getEventSourceKafka(deploymentData, MockResources);
      expect(knEventResource).toBeUndefined();
    });
    it('expect getEventSourceSinkBinding to return event source data', () => {
      const knEventResource = getEventSourceSinkBinding(
        deploymentKnativeEventData,
        MockKnativeResources,
      );
      expect(knEventResource.eventSourceServicebinding).toBeDefined();
      expect(knEventResource.eventSourceServicebinding).toHaveLength(1);
    });
    it('expect getEventSourceSinkBinding to return event source as undefined', () => {
      const knEventResource = getEventSourceSinkBinding(deploymentData, MockResources);
      expect(knEventResource).toBeUndefined();
    });
  });
});
