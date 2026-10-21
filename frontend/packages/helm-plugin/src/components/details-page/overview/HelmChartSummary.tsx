import type { FC } from 'react';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { Status } from '@console/shared';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import type { HelmRelease } from '../../../types/helm-types';
import { HelmReleaseStatusLabels, releaseStatus } from '../../../utils/helm-utils';

interface HelmChartSummaryProps {
  obj: K8sResourceKind;
  helmRelease: HelmRelease;
}

const HelmChartSummary: FC<HelmChartSummaryProps> = ({ obj, helmRelease }) => {
  const { t } = useTranslation();
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
        <DescriptionListTerm>{t('helm-plugin~Status')}</DescriptionListTerm>
        <DescriptionListDescription data-test="helm-release-status-details">
          <Status
            status={releaseStatus(helmRelease?.info?.status)}
            title={HelmReleaseStatusLabels[helmRelease?.info?.status]}
          />
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>{t('helm-plugin~Chart name')}</DescriptionListTerm>
        <DescriptionListDescription>{chartName}</DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>{t('helm-plugin~Chart version')}</DescriptionListTerm>
        <DescriptionListDescription>{chartVersion}</DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>{t('helm-plugin~App version')}</DescriptionListTerm>
        <DescriptionListDescription>{appVersion || '-'}</DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>{t('helm-plugin~Revision')}</DescriptionListTerm>
        <DescriptionListDescription>{revision}</DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>{t('helm-plugin~Updated')}</DescriptionListTerm>
        <DescriptionListDescription>
          <Timestamp timestamp={updated} />
        </DescriptionListDescription>
      </DescriptionListGroup>
    </DescriptionList>
  );
};

export default HelmChartSummary;
