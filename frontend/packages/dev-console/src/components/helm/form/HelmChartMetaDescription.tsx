import * as React from 'react';
import * as _ from 'lodash';
import { HelmChart } from '../helm-types';
import { getImageForIconClass } from '@console/internal/components/catalog/catalog-item-icon';

type HelmChartMetaDescriptionProps = {
  chart: HelmChart;
};

const HelmChartMetaDescription: React.FC<HelmChartMetaDescriptionProps> = ({ chart }) => {
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
            alt=""
          />
        </div>
        <div className="co-clusterserviceversion-logo__name">
          <h1 className="co-clusterserviceversion-logo__name__clusterserviceversion">
            {displayName}
          </h1>
          {provider && (
            <span className="co-clusterserviceversion-logo__name__provider text-muted">
              {`${chartVersion || ''} provided by ${provider}`}
            </span>
          )}
        </div>
      </div>
      {chart?.metadata?.description}
    </div>
  );
};

export default HelmChartMetaDescription;
