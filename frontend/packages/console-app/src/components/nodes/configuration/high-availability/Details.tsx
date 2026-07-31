import type { FC } from 'react';
import { useCallback, useMemo } from 'react';
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
import type { NodeHealthCheckKind } from '../../utils/HealthCheckUtils';
import {
  estimatedRecoveryTimeDisplay,
  getRemediationDisplay,
  getRemediationTemplateRefsFromHealthChecks,
  useRemediationResourcesForEstimatedRecovery,
} from '../../utils/HighAvailabilityUtils';

type DetailsProps = {
  matchingMachineHealthChecks: MachineHealthCheckKind[];
  matchingNodeHealthChecks: NodeHealthCheckKind[];
  isLoading: boolean;
  loadError?: unknown;
};

const Details: FC<DetailsProps> = ({
  matchingMachineHealthChecks,
  matchingNodeHealthChecks,
  isLoading,
  loadError,
}) => {
  const { t } = useTranslation('console-app');
  const {
    snrConfigs,
    farTemplates,
    loaded: remediationResourcesLoaded,
  } = useRemediationResourcesForEstimatedRecovery();

  const isLoadingDetailsData = isLoading || !remediationResourcesLoaded;

  const isHighAvailability = useMemo(
    () =>
      // High Availability when there is at least one health check (either machine or node) and at least one remediation agent
      (matchingMachineHealthChecks.length > 0 || matchingNodeHealthChecks.length > 0) &&
      getRemediationTemplateRefsFromHealthChecks(
        matchingMachineHealthChecks,
        matchingNodeHealthChecks,
      ).length > 0,
    [matchingMachineHealthChecks, matchingNodeHealthChecks],
  );

  const renderRemediation = useCallback(
    () => getRemediationDisplay(matchingMachineHealthChecks, matchingNodeHealthChecks, t),
    [matchingMachineHealthChecks, matchingNodeHealthChecks, t],
  );

  const renderEstimatedRecoveryTimeDisplay = useCallback(
    () =>
      estimatedRecoveryTimeDisplay(
        matchingMachineHealthChecks,
        matchingNodeHealthChecks,
        snrConfigs,
        farTemplates,
        t,
      ),
    [matchingMachineHealthChecks, matchingNodeHealthChecks, snrConfigs, farTemplates, t],
  );

  return (
    <>
      <Title headingLevel="h3" className="co-section-heading">
        <span>{t('Details')}</span>
      </Title>
      {loadError ? (
        t('Unable to load high availability details')
      ) : (
        <DescriptionList
          className="pf-v6-u-ml-lg"
          columnModifier={{ default: '3Col' }}
          isInlineGrid
        >
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Status')}</DescriptionListTerm>
            <DescriptionListDescription>
              {isLoadingDetailsData ? (
                <Skeleton width="120px" data-test="status-skeleton" />
              ) : (
                <Status
                  status={isHighAvailability ? 'Ready' : 'Unknown'}
                  title={isHighAvailability ? t('Ready') : t('Unavailable')}
                />
              )}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Remediation')}</DescriptionListTerm>
            <DescriptionListDescription>
              {isLoadingDetailsData ? (
                <Skeleton width="220px" data-test="remediation-skeleton" />
              ) : (
                renderRemediation()
              )}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Estimated recovery time')}</DescriptionListTerm>
            <DescriptionListDescription>
              {isLoadingDetailsData ? (
                <Skeleton width="90px" data-test="recovery-time-skeleton" />
              ) : (
                renderEstimatedRecoveryTimeDisplay()
              )}
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      )}
    </>
  );
};

export default Details;
