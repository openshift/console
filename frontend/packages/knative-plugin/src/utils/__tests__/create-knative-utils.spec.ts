import { FirehoseResource } from '@console/internal/components/utils';
import { K8sResourceKind, ImagePullPolicy } from '@console/internal/module/k8s';
import {
  getKnativeServiceDepResource,
  knativeServingResourcesServices,
  knativeServingResourcesRevision,
  knativeServingResourcesConfigurations,
  knativeServingResourcesRoutes,
} from '../create-knative-utils';
import { defaultData } from './knative-serving-data';

describe('Create knative Utils', () => {
  describe('knative Serving Resources', () => {
    const SAMPLE_NAMESPACE = 'mynamespace';
    it('expect knativeServingResource to return service with proper namespace', () => {
      const serviceServingResource: FirehoseResource[] = knativeServingResourcesServices(
        SAMPLE_NAMESPACE,
      );
      expect(serviceServingResource).toHaveLength(1);
      expect(serviceServingResource[0].namespace).toBe(SAMPLE_NAMESPACE);
      expect(serviceServingResource[0].prop).toBe('ksservices');
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
    it('expect knativeServingResourcesConfigurations to not have Ports id if unknownTargetPort is empty', () => {
      const knDeploymentResource: K8sResourceKind = getKnativeServiceDepResource(
        defaultData,
        'imgStream',
      );
      expect(knDeploymentResource.spec.template.spec.containers[0].ports).toBeUndefined();
    });
    it('expect to have Ports if unknownTargetPort is defined', () => {
      defaultData.route.unknownTargetPort = '8080';
      const knDeploymentResource: K8sResourceKind = getKnativeServiceDepResource(
        defaultData,
        'imgStream',
      );
      expect(knDeploymentResource.spec.template.spec.containers[0].ports[0].containerPort).toBe(
        8080,
      );
    });
    it('expect to have minSccale, maxScale, target and containerConcurrency defined', () => {
      defaultData.route.unknownTargetPort = '8080';
      const knDeploymentResource: K8sResourceKind = getKnativeServiceDepResource(
        defaultData,
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
    it('expect not to have minScale defined', () => {
      defaultData.serverless.scaling.minpods = 0;
      defaultData.route.unknownTargetPort = '8080';
      const knDeploymentResource: K8sResourceKind = getKnativeServiceDepResource(
        defaultData,
        'imgStream',
      );
      expect(
        knDeploymentResource.spec.template.metadata.annotations['autoscaling.knative.dev/minScale'],
      ).toBeUndefined();
    });

    it('expect not to have cluster-local labels added if route is checked', () => {
      defaultData.route.create = true;
      const knDeploymentResource: K8sResourceKind = getKnativeServiceDepResource(
        defaultData,
        'imgStream',
      );
      expect(
        knDeploymentResource.metadata.labels['serving.knative.dev/visibility'],
      ).toBeUndefined();
    });

    it('expect to have cluster-local added if route is not checked', () => {
      defaultData.route.create = false;
      const knDeploymentResource: K8sResourceKind = getKnativeServiceDepResource(
        defaultData,
        'imgStream',
      );
      expect(knDeploymentResource.metadata.labels['serving.knative.dev/visibility']).toBeDefined();
      expect(knDeploymentResource.metadata.labels['serving.knative.dev/visibility']).toEqual(
        'cluster-local',
      );
    });

    it('expect to have part-of labels added if application name is present', () => {
      defaultData.application.name = 'my-app';
      const knDeploymentResource: K8sResourceKind = getKnativeServiceDepResource(
        defaultData,
        'imgStream',
      );
      expect(knDeploymentResource.metadata.labels['app.kubernetes.io/part-of']).toBeDefined();
      expect(knDeploymentResource.metadata.labels['app.kubernetes.io/part-of']).toEqual('my-app');
    });

    it('expect not to have part-of labels added if application name is not present', () => {
      defaultData.application.name = '';
      const knDeploymentResource: K8sResourceKind = getKnativeServiceDepResource(
        defaultData,
        'imgStream',
      );
      expect(knDeploymentResource.metadata.labels['app.kubernetes.io/part-of']).toBeUndefined();
    });

    it('expect to have environment added if provided', () => {
      defaultData.deployment.env = [{ name: 'NAME', value: 'myvar' }];
      const knDeploymentResource: K8sResourceKind = getKnativeServiceDepResource(
        defaultData,
        'imgStream',
      );
      expect(knDeploymentResource.spec.template.spec.containers[0].env[0].name).toEqual('NAME');
      expect(knDeploymentResource.spec.template.spec.containers[0].env[0].value).toEqual('myvar');
    });

    it('expect to have imagePullPolicy as Always if checked', () => {
      defaultData.deployment.triggers.image = true;
      const knDeploymentResource: K8sResourceKind = getKnativeServiceDepResource(
        defaultData,
        'imgStream',
      );
      expect(knDeploymentResource.spec.template.spec.containers[0].imagePullPolicy).toEqual(
        ImagePullPolicy.Always,
      );
    });

    it('expect to have imagePullPolicy as IfNotPresent if not checked', () => {
      defaultData.deployment.triggers.image = false;
      const knDeploymentResource: K8sResourceKind = getKnativeServiceDepResource(
        defaultData,
        'imgStream',
      );
      expect(knDeploymentResource.spec.template.spec.containers[0].imagePullPolicy).toEqual(
        ImagePullPolicy.IfNotPresent,
      );
    });
  });
});
