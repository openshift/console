import * as React from 'react';
import { compare, gte, parse, SemVer } from 'semver';
import { k8sList } from '@console/internal/module/k8s';
import {
  ClusterServiceVersionKind,
  ClusterServiceVersionModel,
  ClusterServiceVersionPhase,
} from '@console/operator-lifecycle-manager';
import { PIPELINE_GA_VERSION, TRIGGERS_GA_VERSION } from '../const';

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
