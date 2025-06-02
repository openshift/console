import { cloneDeep } from 'lodash';
import { DeploymentKind, HorizontalPodAutoscalerKind } from '@console/internal/module/k8s';
import {
  getFormData,
  getRequestsWarning,
  getMetricByType,
  getYAMLData,
  hasCustomMetrics,
  sanitizeHPAToForm,
  sanityForSubmit,
} from '../hpa-utils';
import { deploymentConfigExamples, deploymentExamples, hpaExamples } from './hpa-utils-data';

describe('getRequestsWarning provides a string when requests are lacking', () => {
  /** Intentionally avoid checking the string value as we don't want to couple our tests to text */
  const hasWarning = (value: any) => typeof value === 'string';

  it('expect invalid resource to return a value', () => {
    expect(hasWarning(getRequestsWarning(null))).toBe(true);
    expect(hasWarning(getRequestsWarning({}))).toBe(true);
  });

  it('expect no limit resources to return a value', () => {
    expect(hasWarning(getRequestsWarning(deploymentExamples.hasNoRequests))).toBe(true);
    expect(hasWarning(getRequestsWarning(deploymentConfigExamples.hasNoRequests))).toBe(true);
  });

  it('expect partial limit resources to return a value', () => {
    expect(hasWarning(getRequestsWarning(deploymentExamples.hasCpuOnlyReuests))).toBe(true);
    expect(hasWarning(getRequestsWarning(deploymentExamples.hasMemoryOnlyRequests))).toBe(true);

    expect(hasWarning(getRequestsWarning(deploymentConfigExamples.hasCpuOnlyRequests))).toBe(true);
    expect(hasWarning(getRequestsWarning(deploymentConfigExamples.hasMemoryOnlyRequests))).toBe(
      true,
    );
  });
});

describe('getFormData gets back an hpa structured form object', () => {
  it('expect to be scaled against the resource provided', () => {
    const deploymentResource: DeploymentKind = deploymentExamples.hasCpuAndMemoryLimits;
    expect(getFormData(deploymentResource).spec.scaleTargetRef).toEqual({
      apiVersion: deploymentResource.apiVersion,
      kind: deploymentResource.kind,
      name: deploymentResource.metadata.name,
    });
  });

  it('expect to be able to build off an existing HPA', () => {
    const hpaResource: HorizontalPodAutoscalerKind = hpaExamples.cpuScaled;
    const formData: HorizontalPodAutoscalerKind = getFormData(
      deploymentExamples.hasCpuAndMemoryLimits,
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
    const deploymentResource: DeploymentKind = deploymentExamples.hasCpuAndMemoryLimits;
    const result = getYAMLData(deploymentResource);
    expect(new RegExp(`apiVersion: ${deploymentResource.apiVersion}`).test(result)).toBe(true);
    expect(new RegExp(`kind: ${deploymentResource.kind}`).test(result)).toBe(true);
    expect(new RegExp(`name: ${deploymentResource.metadata.name}`).test(result)).toBe(true);
  });

  it('expect to be able to build off an existing HPA', () => {
    const hpaResource: HorizontalPodAutoscalerKind = hpaExamples.cpuScaled;
    const yamlData = getYAMLData(deploymentExamples.hasCpuAndMemoryLimits, hpaResource);
    expect(yamlData).toBeTruthy();
    expect(new RegExp(`minReplicas: ${hpaResource.spec.minReplicas}`).test(yamlData)).toBe(true);
    expect(new RegExp(`maxReplicas: ${hpaResource.spec.maxReplicas}`).test(yamlData)).toBe(true);
    expect(new RegExp(`name: ${hpaResource.spec.metrics[0].resource.name}`).test(yamlData)).toBe(
      true,
    );
  });
});

describe('getMetricByType returns an appropriate metric and the index it is at', () => {
  it('expect no metrics to return a default metric as a new metric on the end', () => {
    const { metric } = getMetricByType(hpaExamples.noMetrics, 'memory');
    expect(metric).toBeTruthy();
    expect(metric.resource.name).toBe('memory');
    expect(metric.resource.target.averageUtilization).toBe(50);
  });

  it('expect to get back a default memory metric when only cpu metric is available', () => {
    const { metric, index } = getMetricByType(hpaExamples.cpuScaled, 'memory');
    expect(metric).toBeTruthy();
    expect(metric.resource.name).toBe('memory');
    expect(metric.resource.target.averageUtilization).toBe(50);
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
      deploymentExamples.hasCpuAndMemoryLimits,
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
