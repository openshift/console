import { FirehoseResource } from '@console/internal/components/utils';
import { K8sResourceKind } from '@console/internal/module/k8s';
import {
  getKnativeServiceDepResource,
  knativeServingResources,
  knativeServingResourcesRevision,
  knativeServingResourcesConfigurations,
  knativeServingResourcesRoutes,
} from '../create-knative-utils';
import { defaultData } from './knative-serving-data';

describe('Create knative Utils', () => {
  describe('knative Serving Resources', () => {
    const SAMPLE_NAMESPACE = 'mynamespace';
    it('expect knativeServingResource to return revision, service, configurations, routes with proper namespace', () => {
      const knServingResource: FirehoseResource[] = knativeServingResources(SAMPLE_NAMESPACE);
      expect(knServingResource).toHaveLength(4);
      expect(knServingResource[0].namespace).toBe(SAMPLE_NAMESPACE);
    });

    it('expect knativeServingResourcesRevision to return revision with proper namespace', () => {
      const revisionServingResource: FirehoseResource[] = knativeServingResourcesRevision(
        SAMPLE_NAMESPACE,
      );
      expect(revisionServingResource).toHaveLength(1);
      expect(revisionServingResource[0].namespace).toBe(SAMPLE_NAMESPACE);
      expect(revisionServingResource[0].prop).toBe('revisions');
    });

    it('expect knativeServingResourcesConfigurations to return configurations with proper namespace', () => {
      const configServingResource: FirehoseResource[] = knativeServingResourcesConfigurations(
        SAMPLE_NAMESPACE,
      );
      expect(configServingResource).toHaveLength(1);
      expect(configServingResource[0].namespace).toBe(SAMPLE_NAMESPACE);
      expect(configServingResource[0].prop).toBe('configurations');
    });

    it('expect knativeServingResourcesRoutes to return routes with proper namespace', () => {
      const routeServingResource: FirehoseResource[] = knativeServingResourcesRoutes(
        SAMPLE_NAMESPACE,
      );
      expect(routeServingResource).toHaveLength(1);
      expect(routeServingResource[0].namespace).toBe(SAMPLE_NAMESPACE);
      expect(routeServingResource[0].prop).toBe('ksroutes');
    });
  });
  describe('knative Service creation', () => {
    const {
      name,
      application: { name: applicationName },
      project: { name: projectName },
      serverless: { scaling },
      labels: userLabels,
      limits,
      route: { unknownTargetPort },
    } = defaultData;
    it('expect knativeServingResourcesConfigurations to not have Ports id if unknownTargetPort is empty', () => {
      const knDeploymentResource: K8sResourceKind = getKnativeServiceDepResource(
        name,
        applicationName,
        projectName,
        scaling,
        limits,
        unknownTargetPort,
        userLabels,
        'imgStream',
      );
      expect(knDeploymentResource.spec.template.spec.containers[0].ports).toBeUndefined();
    });
    it('expect to have Ports if unknownTargetPort is defined', () => {
      const knDeploymentResource: K8sResourceKind = getKnativeServiceDepResource(
        name,
        applicationName,
        projectName,
        scaling,
        limits,
        '8080',
        userLabels,
        'imgStream',
      );
      expect(knDeploymentResource.spec.template.spec.containers[0].ports[0].containerPort).toBe(
        8080,
      );
    });
    it('expect to have minSccale, maxScale, target and containerConcurrency defined', () => {
      const knDeploymentResource: K8sResourceKind = getKnativeServiceDepResource(
        name,
        applicationName,
        projectName,
        scaling,
        limits,
        '8080',
        userLabels,
        'imgStream',
      );
      expect(
        knDeploymentResource.spec.template.metadata.annotations['autoscaling.knative.dev/target'],
      ).toBe('1');
      expect(
        knDeploymentResource.spec.template.metadata.annotations['autoscaling.knative.dev/minScale'],
      ).toBe('1');
      expect(
        knDeploymentResource.spec.template.metadata.annotations['autoscaling.knative.dev/maxScale'],
      ).toBe('5');
      expect(knDeploymentResource.spec.template.spec.containerConcurrency).toBe(1);
    });
    it('expect not to have minSccale defined', () => {
      scaling.minpods = 0;
      const knDeploymentResource: K8sResourceKind = getKnativeServiceDepResource(
        name,
        applicationName,
        projectName,
        scaling,
        limits,
        '8080',
        userLabels,
        'imgStream',
      );
      expect(
        knDeploymentResource.spec.template.metadata.annotations['autoscaling.knative.dev/minScale'],
      ).toBeUndefined();
    });
  });
});
