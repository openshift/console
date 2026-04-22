import type { FC } from 'react';
import { useMemo } from 'react';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Skeleton,
  Title,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import Status from '@console/dynamic-plugin-sdk/src/app/components/status/Status';
import type { MachineHealthCheckKind } from '@console/internal/module/k8s';
import { DASH } from '@console/shared/src/constants/ui';
import {
  computeRemediationTimeBoundsFromRefs,
  dedupeRemediationTemplateRefs,
  FALLBACK_REMEDIATION_BOUNDS,
  getRemediationTemplateRefsFromHealthChecks,
  useRemediationResourcesForEstimatedRecovery,
} from '../../utils/estimatedRecoveryRemediation';
import type { NodeHealthCheckKind } from '../../utils/HealthCheckUtils';
import { formatTimeoutForDisplay, getMaxTimeoutFromConditions } from '../../utils/utils';

type DetailsProps = {
  matchingMachineHealthChecks: MachineHealthCheckKind[];
  matchingNodeHealthChecks: NodeHealthCheckKind[];
  isLoading: boolean;
  loadError?: unknown;
};

const NODE_HEARTBEAT_DETECTION_SECONDS = 50;
const WORKLOAD_RESTART_SECONDS = 15;

const Details: FC<DetailsProps> = ({
  matchingMachineHealthChecks,
  matchingNodeHealthChecks,
  isLoading,
  loadError,
}) => {
  const { t } = useTranslation();
  const {
    snrConfigs,
    farTemplates,
    loaded: remediationResourcesLoaded,
  } = useRemediationResourcesForEstimatedRecovery();

  const isLoadingDetailsData = isLoading || !remediationResourcesLoaded;

  const isHighAvailability = useMemo(
    () =>
      getRemediationTemplateRefsFromHealthChecks(
        matchingMachineHealthChecks,
        matchingNodeHealthChecks,
      ).length > 0,
    [matchingMachineHealthChecks, matchingNodeHealthChecks],
  );

  const remediationDisplay = useMemo(() => {
    const primaryMHC = matchingMachineHealthChecks[0];
    const primaryNHC = matchingNodeHealthChecks[0];
    const source = primaryMHC
      ? ({ prefix: 'MHC', check: primaryMHC } as const)
      : primaryNHC
      ? ({ prefix: 'NHC', check: primaryNHC } as const)
      : undefined;
    if (!source) {
      return DASH;
    }

    const reboot =
      source.prefix === 'MHC' &&
      source.check.metadata?.annotations?.['machine.openshift.io/remediation-strategy'] ===
        'external-baremetal';
    const baseRemediation = reboot
      ? t('console-app~auto-reboot')
      : source.prefix === 'MHC'
      ? t('console-app~machine replacement')
      : t('console-app~template remediation');

    const unhealthyConditions = source.check.spec?.unhealthyConditions ?? [];
    const maxTimeoutSeconds = getMaxTimeoutFromConditions(unhealthyConditions);

    if (maxTimeoutSeconds) {
      return t('console-app~{{prefix}}: {{remediation}}; Drain: {{timeout}} timeout', {
        prefix: source.prefix,
        remediation: baseRemediation,
        timeout: formatTimeoutForDisplay(maxTimeoutSeconds),
      });
    }

    return t('console-app~{{prefix}}: {{remediation}}', {
      prefix: source.prefix,
      remediation: baseRemediation,
    });
  }, [matchingMachineHealthChecks, matchingNodeHealthChecks, t]);

  const estimatedRecoveryTimeDisplay = useMemo(() => {
    const allConditions = [
      ...matchingMachineHealthChecks.flatMap((hc) => hc.spec?.unhealthyConditions ?? []),
      ...matchingNodeHealthChecks.flatMap((hc) => hc.spec?.unhealthyConditions ?? []),
    ];
    const maxTimeoutSeconds = getMaxTimeoutFromConditions(allConditions);

    if (maxTimeoutSeconds === undefined) {
      return undefined;
    }

    const orderedRefs = dedupeRemediationTemplateRefs(
      getRemediationTemplateRefsFromHealthChecks(
        matchingMachineHealthChecks,
        matchingNodeHealthChecks,
      ),
    );
    const remediationBounds =
      computeRemediationTimeBoundsFromRefs(orderedRefs, snrConfigs, farTemplates) ??
      FALLBACK_REMEDIATION_BOUNDS;

    // Recovery estimate model from HA guidance:
    // 50s node heartbeat detection + health-check timeout + remediation time + ~15s workload restart.
    const baseSeconds =
      NODE_HEARTBEAT_DETECTION_SECONDS + maxTimeoutSeconds + WORKLOAD_RESTART_SECONDS;
    const minMinutes = Math.max(1, Math.ceil((baseSeconds + remediationBounds.minSeconds) / 60));
    const maxMinutes = Math.max(
      minMinutes,
      Math.ceil((baseSeconds + remediationBounds.maxSeconds) / 60),
    );
    return t('console-app~{{minMinutes}}-{{maxMinutes}} min', { minMinutes, maxMinutes });
  }, [matchingMachineHealthChecks, matchingNodeHealthChecks, snrConfigs, farTemplates, t]);

  return (
    <>
      <Title headingLevel="h3" className="co-section-heading">
        <span>{t('console-app~Details')}</span>
      </Title>
      {loadError ? (
        t('console-app~Unable to load high availability details')
      ) : (
        <DescriptionList
          className="pf-v6-u-ml-lg"
          columnModifier={{ default: '3Col' }}
          isInlineGrid
        >
          <DescriptionListGroup>
            <DescriptionListTerm>{t('console-app~Status')}</DescriptionListTerm>
            <DescriptionListDescription>
              {isLoadingDetailsData ? (
                <Skeleton width="120px" />
              ) : (
                <Status
                  status={isHighAvailability ? 'Ready' : 'Unknown'}
                  title={isHighAvailability ? t('console-app~Ready') : t('console-app~Unavailable')}
                />
              )}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('console-app~Remediation')}</DescriptionListTerm>
            <DescriptionListDescription>
              {isLoadingDetailsData ? <Skeleton width="220px" /> : remediationDisplay}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('console-app~Estimated recovery time')}</DescriptionListTerm>
            <DescriptionListDescription>
              {isLoadingDetailsData ? (
                <Skeleton width="90px" />
              ) : (
                estimatedRecoveryTimeDisplay ?? DASH
              )}
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      )}
    </>
  );
};

export default Details;
