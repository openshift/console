import { cloneDeep } from 'lodash';
import {
  doesHpaMatch,
  getFormData,
  getInvalidUsageError,
  getLimitWarning,
  getMetricByType,
  getYAMLData,
  hasCustomMetrics,
  isCpuUtilizationPossible,
  isMemoryUtilizationPossible,
  sanitizeHPAToForm,
  sanityForSubmit,
} from '../hpa-utils';
import { deploymentConfigExamples, deploymentExamples, hpaExamples } from './hpa-utils-data';
import { DeploymentKind, HorizontalPodAutoscalerKind } from '@console/internal/module/k8s';
import { HPAFormValues } from '../types';

describe('isCpuUtilizationPossible provides accurate checks', () => {
  it('expect an invalid resource to return no', () => {
    expect(isCpuUtilizationPossible(null)).toBe(false);
    expect(isCpuUtilizationPossible({})).toBe(false);
  });

  it('expect a resource with no limits to be not possible', () => {
    expect(isCpuUtilizationPossible(deploymentExamples.hasNoLimits)).toBe(false);
    expect(isCpuUtilizationPossible(deploymentConfigExamples.hasNoLimits)).toBe(false);
  });

  it('expect a resource with other limits but not CPU limits to be not possible', () => {
    expect(isCpuUtilizationPossible(deploymentExamples.hasMemoryOnlyLimits)).toBe(false);
    expect(isCpuUtilizationPossible(deploymentConfigExamples.hasMemoryOnlyLimits)).toBe(false);
  });

  it('expect a resource with CPU limits to be possible', () => {
    expect(isCpuUtilizationPossible(deploymentExamples.hasCpuOnlyLimits)).toBe(true);
    expect(isCpuUtilizationPossible(deploymentConfigExamples.hasCpuOnlyLimits)).toBe(true);
  });

  it('expect a resource with both CPU And Memory limits to be possible', () => {
    expect(isCpuUtilizationPossible(deploymentExamples.hasCpuAndMemoryLimits)).toBe(true);
    expect(isCpuUtilizationPossible(deploymentConfigExamples.hasCpuAndMemoryLimits)).toBe(true);
  });
});

describe('isMemoryUtilizationPossible provides accurate checks', () => {
  it('expect an invalid resource to return no', () => {
    expect(isMemoryUtilizationPossible(null)).toBe(false);
    expect(isMemoryUtilizationPossible({})).toBe(false);
  });

  it('expect a resource with no limits to be not possible', () => {
    expect(isMemoryUtilizationPossible(deploymentExamples.hasNoLimits)).toBe(false);
    expect(isMemoryUtilizationPossible(deploymentConfigExamples.hasNoLimits)).toBe(false);
  });

  it('expect a resource with other limits but not CPU limits to be not possible', () => {
    expect(isMemoryUtilizationPossible(deploymentExamples.hasCpuOnlyLimits)).toBe(false);
    expect(isMemoryUtilizationPossible(deploymentConfigExamples.hasCpuOnlyLimits)).toBe(false);
  });

  it('expect a resource with CPU limits to be possible', () => {
    expect(isMemoryUtilizationPossible(deploymentExamples.hasMemoryOnlyLimits)).toBe(true);
    expect(isMemoryUtilizationPossible(deploymentConfigExamples.hasMemoryOnlyLimits)).toBe(true);
  });

  it('expect a resource with both CPU And Memory limits to be possible', () => {
    expect(isMemoryUtilizationPossible(deploymentExamples.hasCpuAndMemoryLimits)).toBe(true);
    expect(isMemoryUtilizationPossible(deploymentConfigExamples.hasCpuAndMemoryLimits)).toBe(true);
  });
});

describe('getLimitWarning provides a string when limits are lacking', () => {
  /** Intentionally avoid checking the string value as we don't want to couple our tests to text */
  const hasWarning = (value: any) => typeof value === 'string';

  it('expect invalid resource to return a value', () => {
    expect(hasWarning(getLimitWarning(null))).toBe(true);
    expect(hasWarning(getLimitWarning({}))).toBe(true);
  });

  it('expect no limit resources to return a value', () => {
    expect(hasWarning(getLimitWarning(deploymentExamples.hasNoLimits))).toBe(true);
    expect(hasWarning(getLimitWarning(deploymentConfigExamples.hasNoLimits))).toBe(true);
  });

  it('expect partial limit resources to return a value', () => {
    expect(hasWarning(getLimitWarning(deploymentExamples.hasCpuOnlyLimits))).toBe(true);
    expect(hasWarning(getLimitWarning(deploymentExamples.hasMemoryOnlyLimits))).toBe(true);

    expect(hasWarning(getLimitWarning(deploymentConfigExamples.hasCpuOnlyLimits))).toBe(true);
    expect(hasWarning(getLimitWarning(deploymentConfigExamples.hasMemoryOnlyLimits))).toBe(true);
  });

  it('expect full limits to not return a value', () => {
    expect(hasWarning(getLimitWarning(deploymentExamples.hasCpuAndMemoryLimits))).toBe(false);
    expect(hasWarning(getLimitWarning(deploymentConfigExamples.hasCpuAndMemoryLimits))).toBe(false);
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
    const { metric, index } = getMetricByType(hpaExamples.noMetrics, 'memory');
    expect(metric).toBeTruthy();
    expect(metric.resource.name).toBe('memory');
    expect(metric.resource.target.averageUtilization).toBe(0);
    expect(index).toBe(0);
  });

  it('expect to get back a default memory metric when only cpu metric is available', () => {
    const { metric, index } = getMetricByType(hpaExamples.cpuScaled, 'memory');
    expect(metric).toBeTruthy();
    expect(metric.resource.name).toBe('memory');
    expect(metric.resource.target.averageUtilization).toBe(0);
    expect(index).toBe(1);
  });

  it('expect to get back the cpu metric when it is available', () => {
    const hpaResource: HorizontalPodAutoscalerKind = hpaExamples.cpuScaled;
    const { metric, index } = getMetricByType(hpaResource, 'cpu');
    expect(metric).toBeTruthy();
    expect(metric.resource.name).toBe('cpu');
    expect(metric.resource.target.averageUtilization).toBe(
      hpaResource.spec.metrics[0].resource.target.averageUtilization,
    );
    expect(index).toBe(0);
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
      deploymentExamples.hasCpuOnlyLimits,
    );
    expect(formData).toBeTruthy();
    expect(formData.spec.maxReplicas).toBe(hpaResource.spec.maxReplicas);
    expect(formData.spec.metrics[0]).toBeTruthy();
    expect(formData.spec.metrics[0]).toEqual(hpaResource.spec.metrics[0]);
  });
});

describe('sanityForSubmit covers some basic field locking and trimming', () => {
  const deploymentResource: DeploymentKind = deploymentExamples.hasNoLimits;
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
    overriddenResource.spec.metrics[0].resource.target.averageUtilization = 0;
    expect(sanityForSubmit(deploymentResource, overriddenResource).spec.metrics.length).toBe(0);
  });

  it('expect not to trim custom resource metrics', () => {
    const overriddenResource: HorizontalPodAutoscalerKind = cloneDeep(hpaResource);
    overriddenResource.spec.metrics[0].resource.name = 'custom-resource';
    overriddenResource.spec.metrics[0].resource.target.averageUtilization = 0;
    expect(sanityForSubmit(deploymentResource, overriddenResource).spec.metrics.length).toBe(1);
  });
});

describe('getInvalidUsageError returns an error string when limits are not set', () => {
  const formValues: HPAFormValues = {
    showCanUseYAMLMessage: false,
    disabledFields: {
      name: false,
      cpuUtilization: true,
      memoryUtilization: true,
    },
    editorType: null,
    formData: null,
    yamlData: null,
  };
  const hpaResource: HorizontalPodAutoscalerKind = hpaExamples.cpuScaled;

  it('expect no metrics to be an error', () => {
    const noMetricsHPA: HorizontalPodAutoscalerKind = hpaExamples.noMetrics;
    expect(typeof getInvalidUsageError(noMetricsHPA, formValues)).toBe('string');

    const emptyMetricsHPA: HorizontalPodAutoscalerKind = cloneDeep(noMetricsHPA);
    emptyMetricsHPA.spec.metrics = [];
    expect(typeof getInvalidUsageError(emptyMetricsHPA, formValues)).toBe('string');
  });

  it('expect cpu metric not to be allowed while disabled', () => {
    expect(typeof getInvalidUsageError(hpaResource, formValues)).toBe('string');
  });

  it('expect memory metric to not be allowed while disabled', () => {
    const memoryHPA = cloneDeep(hpaResource);
    memoryHPA.spec.metrics[0].resource.name = 'memory';
    expect(typeof getInvalidUsageError(memoryHPA, formValues)).toBe('string');
  });
});

describe('doesHpaMatch checks if it aligns to a workload', () => {
  it('expect not to match when hpa does not target workload', () => {
    expect(doesHpaMatch(deploymentExamples.hasCpuAndMemoryLimits)(hpaExamples.cpuScaled)).toBe(
      false,
    );
  });

  it('expect to match when hpa does target workload', () => {
    expect(
      doesHpaMatch(deploymentConfigExamples.hasCpuAndMemoryLimits)(hpaExamples.cpuScaled),
    ).toBe(true);
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
