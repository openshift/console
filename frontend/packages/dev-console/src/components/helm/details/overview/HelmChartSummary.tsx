import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { HelmRelease } from '../../helm-types';
import { Timestamp } from '@console/internal/components/utils';
import { K8sResourceKind } from '@console/internal/module/k8s';

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
      <dt>{t('devconsole~Chart Name')}</dt>
      <dd>{chartName}</dd>
      <dt>{t('devconsole~Chart Version')}</dt>
      <dd>{chartVersion}</dd>
      <dt>{t('devconsole~App Version')}</dt>
      <dd>{appVersion || '-'}</dd>
      <dt>{t('devconsole~Revision')}</dt>
      <dd>{revision}</dd>
      <dt>{t('devconsole~Updated')}</dt>
      <dd>
        <Timestamp timestamp={updated} />
      </dd>
    </dl>
  );
};

export default HelmChartSummary;
