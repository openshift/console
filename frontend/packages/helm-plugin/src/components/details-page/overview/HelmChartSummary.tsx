import type { FC } from 'react';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { Status } from '@console/shared/src/components/status/Status';
import type { HelmRelease } from '../../../types/helm-types';
import { HelmReleaseStatusLabels, releaseStatus } from '../../../utils/helm-utils';

interface HelmChartSummaryProps {
  obj: K8sResourceKind;
  helmRelease: HelmRelease;
}

const HelmChartSummary: FC<HelmChartSummaryProps> = ({ obj, helmRelease }) => {
  const { t } = useTranslation('helm-plugin');
  if (!helmRelease) return null;

  const {
    chart: {
      metadata: { name: chartName, version: chartVersion, appVersion },
    },
    info: { last_deployed: updated },
  } = helmRelease;

  const {
    metadata: {
      labels: { version: revision },
    },
  } = obj;

  return (
    <DescriptionList>
      <DescriptionListGroup>
        <DescriptionListTerm>{t('Status')}</DescriptionListTerm>
        <DescriptionListDescription data-test="helm-release-status-details">
          <Status
            status={releaseStatus(helmRelease?.info?.status)}
            title={HelmReleaseStatusLabels[helmRelease?.info?.status]}
          />
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>{t('Chart name')}</DescriptionListTerm>
        <DescriptionListDescription>{chartName}</DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>{t('Chart version')}</DescriptionListTerm>
        <DescriptionListDescription>{chartVersion}</DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>{t('App version')}</DescriptionListTerm>
        <DescriptionListDescription>{appVersion || '-'}</DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>{t('Revision')}</DescriptionListTerm>
        <DescriptionListDescription>{revision}</DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>{t('Updated')}</DescriptionListTerm>
        <DescriptionListDescription>
          <Timestamp timestamp={updated} />
        </DescriptionListDescription>
      </DescriptionListGroup>
    </DescriptionList>
  );
};

export default HelmChartSummary;
