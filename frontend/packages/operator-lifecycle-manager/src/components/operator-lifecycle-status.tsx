import type { FC } from 'react';
import { Label, Tooltip } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import {
  GreenCheckCircleIcon,
  YellowExclamationTriangleIcon,
} from '@console/dynamic-plugin-sdk/src/app/components/status/icons';

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

export type CompatibilityResult = 'compatible' | 'incompatible' | 'no-data';

export const getClusterCompatibility = (
  lifecycle: LifecycleData | undefined,
  operatorVersion: string | undefined,
  clusterVersion: string | undefined,
): CompatibilityResult => {
  if (!lifecycle?.versions || !clusterVersion) {
    return 'no-data';
  }

  const clusterMinor = parseMinorVersion(clusterVersion);
  if (clusterMinor === undefined) {
    return 'no-data';
  }

  const versionEntry = findVersionEntry(lifecycle.versions, operatorVersion);

  if (!versionEntry?.openshiftCompatibility) {
    return 'no-data';
  }

  return versionEntry.openshiftCompatibility.some((v) => parseMinorVersion(v) === clusterMinor)
    ? 'compatible'
    : 'incompatible';
};

export type SupportPhaseInfo = {
  currentPhase: LifecyclePhase;
  allPhases: LifecyclePhase[];
};

export type SupportPhaseResult = SupportPhaseInfo | 'self-support' | 'no-data';

export const getSupportPhase = (
  lifecycle: LifecycleData | undefined,
  operatorVersion: string | undefined,
  currentDate: Date = new Date(),
): SupportPhaseResult => {
  if (!lifecycle?.versions) {
    return 'no-data';
  }

  const versionEntry = findVersionEntry(lifecycle.versions, operatorVersion);

  if (!versionEntry?.phases || versionEntry.phases.length === 0) {
    return 'no-data';
  }

  const now = currentDate.getTime();
  const allPhases = versionEntry.phases;

  for (const phase of allPhases) {
    const begin = new Date(phase.timeBegin).getTime();
    const end = new Date(phase.timeEnd).getTime();
    if (now >= begin && now <= end) {
      return { currentPhase: phase, allPhases };
    }
  }

  const lastPhase = allPhases[allPhases.length - 1];
  if (now > new Date(lastPhase.timeEnd).getTime()) {
    return 'self-support';
  }

  return { currentPhase: allPhases[0], allPhases };
};

export const ClusterCompatibilityStatus: FC<{ compatible: CompatibilityResult }> = ({
  compatible,
}) => {
  const { t } = useTranslation();

  if (compatible === 'compatible') {
    return (
      <Label status="success" variant="outline" data-test="cluster-compatibility-compatible">
        {t('olm~Compatible')}
      </Label>
    );
  }
  if (compatible === 'incompatible') {
    return (
      <Label status="danger" variant="outline" data-test="cluster-compatibility-incompatible">
        {t('olm~Incompatible')}
      </Label>
    );
  }
  return (
    <Label variant="outline" data-test="cluster-compatibility-no-data">
      {t('olm~No data')}
    </Label>
  );
};

const TWELVE_MONTHS_MS = 365 * 24 * 60 * 60 * 1000;

const getLastPhaseEndDate = (phases: LifecyclePhase[]): Date => {
  return new Date(phases[phases.length - 1].timeEnd);
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

export const SupportPhaseStatus: FC<{
  phase: SupportPhaseResult;
  currentDate?: Date;
}> = ({ phase, currentDate = new Date() }) => {
  const { t } = useTranslation();

  if (phase === 'self-support') {
    return (
      <Label status="danger" variant="outline" data-test="support-phase-self-support">
        {t('olm~Self-support')}
      </Label>
    );
  }

  if (phase === 'no-data') {
    return (
      <Label variant="outline" data-test="support-phase-no-data">
        {t('olm~No data')}
      </Label>
    );
  }

  const lastPhaseEnd = getLastPhaseEndDate(phase.allPhases);
  const remainingMs = lastPhaseEnd.getTime() - currentDate.getTime();
  const hasLongSupport = remainingMs > TWELVE_MONTHS_MS;

  return (
    <Tooltip content={phase.currentPhase.name}>
      <span data-test={hasLongSupport ? 'support-phase-long' : 'support-phase-short'}>
        {hasLongSupport ? <GreenCheckCircleIcon /> : <YellowExclamationTriangleIcon />}{' '}
        {formatDate(lastPhaseEnd)}
      </span>
    </Tooltip>
  );
};
