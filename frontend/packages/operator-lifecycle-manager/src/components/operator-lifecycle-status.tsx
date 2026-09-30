import type { FC } from 'react';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  Button,
  DescriptionListTerm,
  Label,
  Popover,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import * as semver from 'semver';
import {
  BlueInfoCircleIcon,
  GreenCheckCircleIcon,
} from '@console/dynamic-plugin-sdk/src/app/components/status/icons';
import { ExternalLink } from '@console/shared/src/components/links/ExternalLink';
import { RedExclamationCircleIcon } from '@console/shared/src/components/status/icons';
import { dateFormatter } from '@console/shared/src/utils/datetime';
import { getClusterVersion } from '../hooks/useOperatorLifecycle';

type LifecyclePhase = {
  name: string;
  startDate: string;
  endDate: string;
};

type PlatformCompatibility = {
  name: string;
  versions: string[];
};

type LifecycleVersion = {
  name: string;
  platformCompatibility?: PlatformCompatibility[];
  phases?: LifecyclePhase[];
};

export type LifecycleData = {
  package: string;
  schema: string;
  versions?: LifecycleVersion[];
};

const parseMinorVersion = (version: string): string | undefined => {
  const parsed = semver.coerce(version);
  return parsed ? `${parsed.major}.${parsed.minor}` : undefined;
};

const findVersionEntry = (
  versions: LifecycleVersion[],
  operatorVersion: string | undefined,
): LifecycleVersion | undefined => {
  if (!operatorVersion) {
    return versions[0];
  }
  const minor = parseMinorVersion(operatorVersion);
  if (minor === undefined) {
    return undefined;
  }
  return versions.find((v) => parseMinorVersion(v.name) === minor);
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

  const openshiftCompat = versionEntry?.platformCompatibility?.find((p) => p.name === 'openshift');
  if (!openshiftCompat?.versions) {
    return 'no-data';
  }

  return openshiftCompat.versions.some((v) => parseMinorVersion(v) === clusterMinor)
    ? 'compatible'
    : 'incompatible';
};

const parseLocalStartOfDay = (dateStr: string): number => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).getTime();
};

const parseLocalEndOfDay = (dateStr: string): number => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d, 23, 59, 59, 999).getTime();
};

export enum SupportPhaseStatus {
  Active = 'active',
  SelfSupport = 'self-support',
  NoData = 'no-data',
}

export type SupportPhaseResult = {
  status: SupportPhaseStatus;
  currentPhase?: LifecyclePhase;
  allPhases?: LifecyclePhase[];
};

export const getSupportPhase = (
  lifecycle: LifecycleData | undefined,
  operatorVersion: string | undefined,
  currentDate: Date = new Date(),
): SupportPhaseResult => {
  if (!lifecycle?.versions) {
    return { status: SupportPhaseStatus.NoData };
  }

  const versionEntry = findVersionEntry(lifecycle.versions, operatorVersion);

  if (!Array.isArray(versionEntry?.phases) || versionEntry.phases.length === 0) {
    return { status: SupportPhaseStatus.NoData };
  }

  const now = currentDate.getTime();
  const allPhases = [...versionEntry.phases].sort(
    (a, b) => parseLocalEndOfDay(a.endDate) - parseLocalEndOfDay(b.endDate),
  );

  for (const phase of allPhases) {
    const begin = parseLocalStartOfDay(phase.startDate);
    const end = parseLocalEndOfDay(phase.endDate);
    if (now >= begin && now <= end) {
      return { status: SupportPhaseStatus.Active, currentPhase: phase, allPhases };
    }
  }

  return { status: SupportPhaseStatus.SelfSupport, allPhases };
};

export const ClusterCompatibilityStatus: FC<{ compatible: CompatibilityResult }> = ({
  compatible,
}) => {
  const { t } = useTranslation('olm');

  if (compatible === 'compatible') {
    return (
      <span data-test="cluster-compatibility-compatible">
        <GreenCheckCircleIcon /> {t('Compatible')}
      </span>
    );
  }
  if (compatible === 'incompatible') {
    return (
      <span data-test="cluster-compatibility-incompatible">
        <RedExclamationCircleIcon /> {t('Incompatible')}
      </span>
    );
  }
  return (
    <span data-test="cluster-compatibility-no-data" aria-label={t('No data available')}>
      -
    </span>
  );
};

const formatDate = (date: Date): string => dateFormatter.format(date);

const LifecycleDatesFooter: FC = () => {
  const { t } = useTranslation('olm');
  const clusterVersion = getClusterVersion();
  const clusterMinor = clusterVersion ? parseMinorVersion(clusterVersion) : undefined;

  return (
    <>
      <hr className="pf-v6-u-mb-sm pf-v6-u-mt-0" />
      <span className="pf-v6-u-color-200">
        {t(
          'This might not reflect your actual SKU. Check your account subscription details or contact your administrator for extended support options.',
        )}
      </span>
      <div className="pf-v6-u-mt-sm">
        <ExternalLink href="https://access.redhat.com/support/policy/updates/openshift_operators/lifecycle">
          {t('OpenShift Operator lifecycle')}
        </ExternalLink>
      </div>
      {clusterMinor && (
        <div>
          <ExternalLink
            href={`https://access.redhat.com/support/policy/updates/openshift#ocp${clusterMinor.replace(
              '.',
              '',
            )}`}
          >
            {t('OpenShift lifecycle ({{version}})', { version: clusterMinor })}
          </ExternalLink>
        </div>
      )}
      <div>
        <ExternalLink href="https://access.redhat.com/product-life-cycles">
          {t('Red Hat product lifecycles')}
        </ExternalLink>
      </div>
    </>
  );
};

const LifecycleDatesPopover: FC<{
  phases: LifecyclePhase[];
  children: React.ReactElement;
}> = ({ phases, children }) => {
  const { t } = useTranslation('olm');
  const sorted = [...phases].sort(
    (a, b) => parseLocalEndOfDay(a.endDate) - parseLocalEndOfDay(b.endDate),
  );

  return (
    <Popover
      headerContent={t('Lifecycle dates')}
      appendTo="inline"
      position="left"
      onHide={() => (document.activeElement as HTMLElement)?.blur()}
      bodyContent={
        <DescriptionList isHorizontal isCompact>
          {sorted.map((p) => (
            <DescriptionListGroup key={p.name}>
              <DescriptionListTerm>{p.name}</DescriptionListTerm>
              <DescriptionListDescription>
                {formatDate(new Date(parseLocalEndOfDay(p.endDate)))}
              </DescriptionListDescription>
            </DescriptionListGroup>
          ))}
        </DescriptionList>
      }
      footerContent={<LifecycleDatesFooter />}
      data-test="lifecycle-dates-popover"
    >
      {children}
    </Popover>
  );
};

export const SupportPhaseBadge: FC<{ phase: SupportPhaseResult }> = ({ phase }) => {
  const { t } = useTranslation('olm');

  if (phase.status === SupportPhaseStatus.SelfSupport && phase.allPhases) {
    return (
      <LifecycleDatesPopover phases={phase.allPhases}>
        <Button
          variant="link"
          type="button"
          data-test="support-phase-self-support"
          onClick={(e) => e.preventDefault()}
          aria-haspopup="dialog"
          isInline
        >
          <Label variant="outline" icon={<BlueInfoCircleIcon />} textMaxWidth="100%">
            {t('Unsupported')}
          </Label>
        </Button>
      </LifecycleDatesPopover>
    );
  }

  if (phase.status === SupportPhaseStatus.NoData) {
    return (
      <span data-test="support-phase-no-data" aria-label={t('No data available')}>
        -
      </span>
    );
  }

  if (phase.status === SupportPhaseStatus.Active && phase.currentPhase && phase.allPhases) {
    const endDate = formatDate(new Date(parseLocalEndOfDay(phase.currentPhase.endDate)));

    return (
      <div data-test="support-phase-badge">
        <LifecycleDatesPopover phases={phase.allPhases}>
          <Button
            variant="link"
            type="button"
            onClick={(e) => e.preventDefault()}
            aria-haspopup="dialog"
            isInline
          >
            <Label variant="outline" icon={<BlueInfoCircleIcon />} textMaxWidth="100%">
              {phase.currentPhase.name}
            </Label>
          </Button>
        </LifecycleDatesPopover>
        <div>{endDate}</div>
      </div>
    );
  }

  return (
    <span data-test="support-phase-no-data" aria-label={t('No data available')}>
      -
    </span>
  );
};
