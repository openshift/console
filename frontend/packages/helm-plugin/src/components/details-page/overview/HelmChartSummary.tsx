import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Timestamp } from '@console/internal/components/utils';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { HelmRelease } from '../../../types/helm-types';

interface HelmChartSummaryProps {
  obj: K8sResourceKind;
  helmRelease: HelmRelease;
}

const HelmChartSummary: React.FC<HelmChartSummaryProps> = ({ obj, helmRelease }) => {
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
    <dl className="co-m-pane__details">
      <dt>{t('helm-plugin~Chart name')}</dt>
      <dd>{chartName}</dd>
      <dt>{t('helm-plugin~Chart version')}</dt>
      <dd>{chartVersion}</dd>
      <dt>{t('helm-plugin~App version')}</dt>
      <dd>{appVersion || '-'}</dd>
      <dt>{t('helm-plugin~Revision')}</dt>
      <dd>{revision}</dd>
      <dt>{t('helm-plugin~Updated')}</dt>
      <dd>
        <Timestamp timestamp={updated} />
      </dd>
    </dl>
  );
};

export default HelmChartSummary;
