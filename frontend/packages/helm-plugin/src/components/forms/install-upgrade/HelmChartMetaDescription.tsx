import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { getImageForIconClass } from '@console/internal/components/catalog/catalog-item-icon';
import { HelmChart } from '../../../types/helm-types';

type HelmChartMetaDescriptionProps = {
  chart: HelmChart;
};

const HelmChartMetaDescription: React.FC<HelmChartMetaDescriptionProps> = ({ chart }) => {
  const { t } = useTranslation();
  const chartVersion = chart?.metadata?.version;
  const displayName = _.startCase(chart?.metadata?.name);
  const imgSrc = chart?.metadata?.icon || getImageForIconClass('icon-helm');
  const provider = chart?.metadata?.maintainers?.[0]?.name;
  return (
    <div style={{ marginBottom: '30px' }}>
      <div className="co-clusterserviceversion-logo">
        <div className="co-clusterserviceversion-logo__icon">
          <img
            className="co-catalog-item-icon__img co-catalog-item-icon__img--large"
            src={imgSrc}
            alt={displayName}
            aria-hidden
          />
        </div>
        <div className="co-clusterserviceversion-logo__name">
          <h1 className="co-clusterserviceversion-logo__name__clusterserviceversion">
            {displayName}
          </h1>
          {provider && (
            <span className="co-clusterserviceversion-logo__name__provider text-muted">
              {t('helm-plugin~{{chartVersion}} provided by {{provider}}', {
                chartVersion: chartVersion || '',
                provider,
              })}
            </span>
          )}
        </div>
      </div>
      {chart?.metadata?.description}
    </div>
  );
};

export default HelmChartMetaDescription;
