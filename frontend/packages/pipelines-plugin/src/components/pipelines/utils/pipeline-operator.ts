import * as React from 'react';
import { compare, gt, gte, parse, SemVer } from 'semver';
import { SetFeatureFlag, useAccessReview } from '@console/dynamic-plugin-sdk';
import { k8sList } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import {
  ClusterServiceVersionKind,
  ClusterServiceVersionModel,
  ClusterServiceVersionPhase,
} from '@console/operator-lifecycle-manager';
import { useActiveNamespace } from '@console/shared/src';
import { TektonConfigModel } from '../../../models';
import {
  PIPELINE_UNSIMPLIFIED_METRICS_VERSION,
  PIPELINE_GA_VERSION,
  TRIGGERS_GA_VERSION,
  PipelineMetricsLevel,
  PIPELINE_NAMESPACE,
  FLAG_TEKTON_V1_ENABLED,
} from '../const';
import { MetricsQueryPrefix } from '../pipeline-metrics/pipeline-metrics-utils';
import { getPipelineMetricsLevel, usePipelineConfig } from './pipeline-config';

export const getPipelineOperatorVersion = async (namespace: string): Promise<SemVer | null> => {
  const allCSVs: ClusterServiceVersionKind[] = await k8sList(ClusterServiceVersionModel, {
    ns: namespace,
  });
  const matchingCSVs = allCSVs.filter(
    (csv) =>
      (csv.metadata?.name?.startsWith('openshift-pipelines-operator') ||
        csv.metadata?.name?.startsWith('redhat-openshift-pipelines')) &&
      csv.status?.phase === ClusterServiceVersionPhase.CSVPhaseSucceeded,
  );
  const versions = matchingCSVs.map((csv) => parse(csv.spec.version)).filter(Boolean);
  // Orders from small (oldest) to highest (newest) version
  versions.sort(compare);
  if (versions.length > 0) {
    return versions[versions.length - 1];
  }
  return null;
};

export const usePipelineOperatorVersion = (namespace: string): SemVer | null => {
  const [version, setVersion] = React.useState<SemVer | null>(null);
  React.useEffect(() => {
    getPipelineOperatorVersion(namespace)
      .then(setVersion)
      .catch((error) =>
        // eslint-disable-next-line no-console
        console.warn('Error while determinate OpenShift Pipelines Operator version:', error),
      );
  }, [namespace]);
  return version;
};

export const isGAVersionInstalled = (operator: SemVer): boolean => {
  if (!operator) return false;
  return gte(operator.version, PIPELINE_GA_VERSION);
};

export const isTriggersGAVersion = (operator: SemVer): boolean => {
  if (!operator) return false;
  return gte(operator.version, TRIGGERS_GA_VERSION);
};

export const isSimplifiedMetricsInstalled = (operator: SemVer): boolean => {
  if (!operator) return false;
  return gt(operator.version, PIPELINE_UNSIMPLIFIED_METRICS_VERSION);
};

export const usePipelineMetricsLevel = (namespace: string) => {
  const pipelineOperator: SemVer = usePipelineOperatorVersion(namespace);
  const [config] = usePipelineConfig();

  const [hasUpdatePermission] = useAccessReview({
    group: TektonConfigModel.apiGroup,
    resource: TektonConfigModel.plural,
    namespace: PIPELINE_NAMESPACE,
    verb: 'update',
  });

  const simplifiedMetrics = isSimplifiedMetricsInstalled(pipelineOperator);
  const metricsLevel = simplifiedMetrics
    ? getPipelineMetricsLevel(config)
    : PipelineMetricsLevel.UNSIMPLIFIED_METRICS_LEVEL;

  const queryPrefix =
    pipelineOperator && !isGAVersionInstalled(pipelineOperator)
      ? MetricsQueryPrefix.TEKTON
      : MetricsQueryPrefix.TEKTON_PIPELINES_CONTROLLER;

  return {
    metricsLevel,
    queryPrefix,
    hasUpdatePermission,
  };
};

export const useIsTektonV1VersionPresent = (setFeatureFlag: SetFeatureFlag) => {
  const [activeNamespace] = useActiveNamespace();
  const operatorVersion = usePipelineOperatorVersion(activeNamespace);
  const isTektonV1VersionPresent = operatorVersion?.major === 1 && operatorVersion?.minor >= 11;
  setFeatureFlag(FLAG_TEKTON_V1_ENABLED, isTektonV1VersionPresent);
};
