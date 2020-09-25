import { compare, parse, SemVer } from 'semver';
import {
  ClusterServiceVersionKind,
  ClusterServiceVersionModel,
  ClusterServiceVersionPhase,
} from '@console/operator-lifecycle-manager';
import { k8sList } from '@console/internal/module/k8s';

export const getPipelineOperatorVersion = async (namespace: string): Promise<SemVer | null> => {
  const allCSVs: ClusterServiceVersionKind[] = await k8sList(ClusterServiceVersionModel, {
    ns: namespace,
  });
  const matchingCSVs = allCSVs.filter(
    (csv) =>
      csv.metadata?.name?.startsWith('openshift-pipelines-operator') &&
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
