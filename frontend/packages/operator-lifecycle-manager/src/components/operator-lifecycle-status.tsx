import type { FC } from 'react';
import { Label, Tooltip } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

export type LifecyclePhase = {
  name: string;
  timeBegin: string;
  timeEnd: string;
};

export type LifecycleVersion = {
  name: string;
  openshiftCompatibility?: string[];
  phases?: LifecyclePhase[];
};

export type LifecycleData = {
  package: string;
  schema: string;
  versions?: LifecycleVersion[];
};

const parseMinorVersion = (version: string): string | undefined => {
  const match = version.match(/(\d+\.\d+)/);
  return match ? match[1] : undefined;
};

const findVersionEntry = (
  versions: LifecycleVersion[],
  operatorVersion: string | undefined,
): LifecycleVersion | undefined => {
  if (!operatorVersion) {
    return versions[0];
  }
  return (
    versions.find((v) => v.name === operatorVersion) ??
    versions.find((v) => parseMinorVersion(v.name) === parseMinorVersion(operatorVersion))
  );
};

export const getClusterCompatibility = (
  lifecycle: LifecycleData | undefined,
  operatorVersion: string | undefined,
  clusterVersion: string | undefined,
): boolean | undefined => {
  if (!lifecycle?.versions || !clusterVersion) {
    return undefined;
  }

  const clusterMinor = parseMinorVersion(clusterVersion);
  if (clusterMinor === undefined) {
    return undefined;
  }

  const versionEntry = findVersionEntry(lifecycle.versions, operatorVersion);

  if (!versionEntry?.openshiftCompatibility) {
    return undefined;
  }

  return versionEntry.openshiftCompatibility.some((v) => parseMinorVersion(v) === clusterMinor);
};

export const getSupportPhase = (
  lifecycle: LifecycleData | undefined,
  operatorVersion: string | undefined,
  currentDate: Date = new Date(),
): LifecyclePhase | 'end-of-life' | undefined => {
  if (!lifecycle?.versions) {
    return undefined;
  }

  const versionEntry = findVersionEntry(lifecycle.versions, operatorVersion);

  if (!versionEntry?.phases?.length) {
    return undefined;
  }

  const now = currentDate.getTime();

  for (const phase of versionEntry.phases) {
    const begin = new Date(phase.timeBegin).getTime();
    const end = new Date(phase.timeEnd).getTime();
    if (now >= begin && now <= end) {
      return phase;
    }
  }

  const lastPhase = versionEntry.phases[versionEntry.phases.length - 1];
  if (now > new Date(lastPhase.timeEnd).getTime()) {
    return 'end-of-life';
  }

  return versionEntry.phases[0];
};

export const ClusterCompatibilityStatus: FC<{ compatible: boolean | undefined }> = ({
  compatible,
}) => {
  const { t } = useTranslation();

  if (compatible === undefined) {
    return <>-</>;
  }

  return compatible ? (
    <Label status="success" variant="outline" data-test="cluster-compatibility-compatible">
      {t('olm~Compatible')}
    </Label>
  ) : (
    <Label status="danger" variant="outline" data-test="cluster-compatibility-incompatible">
      {t('olm~Incompatible')}
    </Label>
  );
};

export const SupportPhaseStatus: FC<{
  phase: LifecyclePhase | 'end-of-life' | undefined;
}> = ({ phase }) => {
  const { t } = useTranslation();

  if (phase === undefined) {
    return <>-</>;
  }

  if (phase === 'end-of-life') {
    return (
      <Label status="danger" variant="outline" data-test="support-phase-eol">
        {t('olm~End of life')}
      </Label>
    );
  }

  return (
    <Tooltip content={t('olm~{{begin}} - {{end}}', { begin: phase.timeBegin, end: phase.timeEnd })}>
      <Label status="success" variant="outline" data-test="support-phase-active">
        {phase.name}
      </Label>
    </Tooltip>
  );
};
