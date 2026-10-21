import { cloneDeep } from 'lodash';
import type { DeploymentKind, HorizontalPodAutoscalerKind } from '@console/internal/module/k8s';
import {
  getFormData,
  getRequestsWarning,
  getMetricByType,
  getYAMLData,
  hasCustomMetrics,
  sanitizeHPAToForm,
  sanityForSubmit,
} from '../hpa-utils';
import { deploymentExamples, deploymentConfigExamples, hpaExamples } from './hpa-utils-data';

describe('getRequestsWarning provides appropriate warnings', () => {
  it('should warn about both CPU and memory when no requests exist', () => {
    const warning = getRequestsWarning(deploymentExamples.hasNoRequests);
    expect(warning).toContain('CPU and memory');
    expect(warning).toContain('resource requests');
  });

  it('should warn about CPU when only memory requests exist', () => {
    const warning = getRequestsWarning(deploymentExamples.hasMemoryOnlyRequests);
    expect(warning).toContain('CPU resource');
    expect(warning).not.toContain('Memory resource');
  });

  it('should warn about memory when only CPU requests exist', () => {
    const warning = getRequestsWarning(deploymentExamples.hasCpuOnlyRequests);
    expect(warning).toContain('Memory resource');
    expect(warning).not.toContain('CPU resource');
  });

  it('should not warn when both CPU and memory requests exist', () => {
    expect(getRequestsWarning(deploymentExamples.hasCpuAndMemoryRequests)).toBeNull();
  });

  it('should warn about both CPU and memory when no requests exist for DeploymentConfig', () => {
    const warning = getRequestsWarning(deploymentConfigExamples.hasNoRequests);
    expect(warning).toContain('CPU and memory');
    expect(warning).toContain('resource requests');
  });

  it('should warn about CPU when only memory requests exist for DeploymentConfig', () => {
    const warning = getRequestsWarning(deploymentConfigExamples.hasMemoryOnlyRequests);
    expect(warning).toContain('CPU resource');
    expect(warning).not.toContain('Memory resource');
  });

  it('should warn about memory when only CPU requests exist for DeploymentConfig', () => {
    const warning = getRequestsWarning(deploymentConfigExamples.hasCpuOnlyRequests);
    expect(warning).toContain('Memory resource');
    expect(warning).not.toContain('CPU resource');
  });

  it('should not warn when both CPU and memory requests exist for DeploymentConfig', () => {
    expect(getRequestsWarning(deploymentConfigExamples.hasCpuAndMemoryRequests)).toBeNull();
  });
});

describe('getFormData gets back an hpa structured form object', () => {
  it('expect to be scaled against the resource provided', () => {
    const deploymentResource: DeploymentKind = deploymentExamples.hasCpuAndMemoryRequests;
    expect(getFormData(deploymentResource).spec.scaleTargetRef).toEqual({
      apiVersion: deploymentResource.apiVersion,
      kind: deploymentResource.kind,
      name: deploymentResource.metadata.name,
    });
  });

  it('expect to be able to build off an existing HPA', () => {
    const hpaResource: HorizontalPodAutoscalerKind = hpaExamples.cpuScaled;
    const formData: HorizontalPodAutoscalerKind = getFormData(
      deploymentExamples.hasCpuAndMemoryRequests,
      hpaResource,
    );
    expect(formData).toBeTruthy();
    expect(formData.spec.minReplicas).toBe(hpaResource.spec.minReplicas);
    expect(formData.spec.maxReplicas).toBe(hpaResource.spec.maxReplicas);
    expect(formData.spec.metrics.length).toBe(1);
    expect(formData.spec.metrics[0]).toEqual(hpaResource.spec.metrics[0]);
  });
});

describe('getYAMLData gets back an hpa structured editor string', () => {
  it('expect to be scaled against the resource provided', () => {
    const deploymentResource: DeploymentKind = deploymentExamples.hasCpuAndMemoryRequests;
    const result = getYAMLData(deploymentResource);
    expect(new RegExp(`apiVersion: ${deploymentResource.apiVersion}`).test(result)).toBe(true);
    expect(new RegExp(`kind: ${deploymentResource.kind}`).test(result)).toBe(true);
    expect(new RegExp(`name: ${deploymentResource.metadata.name}`).test(result)).toBe(true);
  });

  it('expect to be able to build off an existing HPA', () => {
    const hpaResource: HorizontalPodAutoscalerKind = hpaExamples.cpuScaled;
    const yamlData = getYAMLData(deploymentExamples.hasCpuAndMemoryRequests, hpaResource);
    expect(yamlData).toBeTruthy();
    expect(new RegExp(`minReplicas: ${hpaResource.spec.minReplicas}`).test(yamlData)).toBe(true);
    expect(new RegExp(`maxReplicas: ${hpaResource.spec.maxReplicas}`).test(yamlData)).toBe(true);
    expect(new RegExp(`name: ${hpaResource.spec.metrics[0].resource.name}`).test(yamlData)).toBe(
      true,
    );
  });
});

describe('getMetricByType returns an appropriate metric and the index it is at', () => {
  it('expect to return null when HPA has no metrics defined', () => {
    const { metric, index } = getMetricByType(hpaExamples.noMetrics, 'memory');
    expect(metric).toBeNull();
    expect(index).toBe(0);
  });

  it('expect to get back no default memory metric when only cpu metric is available', () => {
    const { metric, index } = getMetricByType(hpaExamples.cpuScaled, 'memory');
    expect(metric).toBeNull();
    expect(index).toBe(1);
  });

  it('expect to get back the cpu metric when it is available', () => {
    const hpaResource: HorizontalPodAutoscalerKind = hpaExamples.cpuScaled;
    const { metric } = getMetricByType(hpaResource, 'cpu');
    expect(metric).toBeTruthy();
    expect(metric.resource.name).toBe('cpu');
    expect(metric.resource.target.averageUtilization).toBe(
      hpaResource.spec.metrics[0].resource.target.averageUtilization,
    );
  });
});

describe('sanitizeHPAToForm always returns valid HPA', () => {
  it('expect an empty form to return a default HPA', () => {
    const formData: HorizontalPodAutoscalerKind = sanitizeHPAToForm(
      {},
      deploymentExamples.hasCpuAndMemoryRequests,
    );
    expect(formData).toBeTruthy();
    expect(formData.kind).toBe('HorizontalPodAutoscaler');
    expect(formData.spec.metrics).not.toBeTruthy();
  });

  it('expect it not to remove existing metrics', () => {
    const hpaResource: HorizontalPodAutoscalerKind = hpaExamples.cpuScaled;
    const formData: HorizontalPodAutoscalerKind = sanitizeHPAToForm(
      hpaResource,
      deploymentExamples.hasCpuOnlyRequests,
    );
    expect(formData).toBeTruthy();
    expect(formData.spec.maxReplicas).toBe(hpaResource.spec.maxReplicas);
    expect(formData.spec.metrics[0]).toBeTruthy();
    expect(formData.spec.metrics[0]).toEqual(hpaResource.spec.metrics[0]);
  });
});

describe('sanityForSubmit covers some basic field locking and trimming', () => {
  const deploymentResource: DeploymentKind = deploymentExamples.hasNoRequests;
  const hpaResource: HorizontalPodAutoscalerKind = hpaExamples.cpuScaled;

  it('expect to always return in the deployment namespace', () => {
    const overriddenResource: HorizontalPodAutoscalerKind = cloneDeep(hpaResource);
    overriddenResource.metadata.namespace = 'not-the-deployment-namespace';
    expect(sanityForSubmit(deploymentResource, overriddenResource).metadata.namespace).toBe(
      deploymentResource.metadata.namespace,
    );
  });

  it('expect to work fine if there are no metrics', () => {
    const noMetricsHPA: HorizontalPodAutoscalerKind = hpaExamples.noMetrics;
    expect(sanityForSubmit(deploymentResource, noMetricsHPA).spec.metrics).toBeUndefined();
  });

  it('expect to always scale to the same resource despite hpa settings', () => {
    const scaledTargetRef = {
      apiVersion: deploymentResource.apiVersion,
      kind: deploymentResource.kind,
      name: deploymentResource.metadata.name,
    };

    const exampleRemoved: HorizontalPodAutoscalerKind = cloneDeep(hpaResource);
    delete exampleRemoved.spec.scaleTargetRef;
    expect(sanityForSubmit(deploymentResource, exampleRemoved).spec.scaleTargetRef).toEqual(
      scaledTargetRef,
    );

    const exampleChanged: HorizontalPodAutoscalerKind = cloneDeep(hpaResource);
    exampleChanged.spec.scaleTargetRef.name = 'not-the-deployment';
    expect(sanityForSubmit(deploymentResource, exampleChanged).spec.scaleTargetRef).toEqual(
      scaledTargetRef,
    );
  });

  it('expect not to have empty cpu or memory metrics', () => {
    const overriddenResource: HorizontalPodAutoscalerKind = cloneDeep(hpaResource);
    overriddenResource.spec.metrics[0].resource.target.averageUtilization = 50;
    expect(sanityForSubmit(deploymentResource, overriddenResource).spec.metrics.length).toBe(1);
  });

  it('expect not to trim custom resource metrics', () => {
    const overriddenResource: HorizontalPodAutoscalerKind = cloneDeep(hpaResource);
    overriddenResource.spec.metrics[0].resource.name = 'custom-resource';
    overriddenResource.spec.metrics[0].resource.target.averageUtilization = 0;
    expect(sanityForSubmit(deploymentResource, overriddenResource).spec.metrics.length).toBe(1);
  });
});

describe('hasCustomMetrics accurately determines if an hpa contains non-default metrics', () => {
  it('expect no metrics to mean no custom metrics', () => {
    expect(hasCustomMetrics(null)).toBe(false);
    expect(hasCustomMetrics({} as any)).toBe(false);
    expect(hasCustomMetrics(hpaExamples.noMetrics)).toBe(false);
  });

  it('expect cpu and memory metrics to not be custom', () => {
    expect(hasCustomMetrics(hpaExamples.cpuScaled)).toBe(false);

    const memoryScaled = cloneDeep(hpaExamples.cpuScaled);
    memoryScaled.spec.metrics[0].resource.name = 'memory';
    expect(hasCustomMetrics(memoryScaled)).toBe(false);
  });

  it('expect any unknown metric to be custom', () => {
    const unknownMetric = cloneDeep(hpaExamples.cpuScaled);
    unknownMetric.spec.metrics[0].resource.name = 'custom-metric';
    expect(hasCustomMetrics(unknownMetric)).toBe(true);
  });

  it('expect an unknown metric to trump known metrics', () => {
    const mixedMetrics = cloneDeep(hpaExamples.cpuScaled);
    mixedMetrics.spec.metrics.push({
      type: 'Resource',
      resource: {
        name: 'custom-metric',
        target: {
          type: 'Utilization',
          averageUtilization: 66,
        },
      },
    });
    expect(hasCustomMetrics(mixedMetrics)).toBe(true);
  });
});
