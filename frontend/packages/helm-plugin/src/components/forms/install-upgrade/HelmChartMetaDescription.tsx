import type { FC } from 'react';
import { Title } from '@patternfly/react-core';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { getImageForIconClass } from '@console/internal/components/catalog/catalog-item-icon';
import type { HelmChart } from '../../../types/helm-types';

type HelmChartMetaDescriptionProps = {
  chart: HelmChart;
};

const HelmChartMetaDescription: FC<HelmChartMetaDescriptionProps> = ({ chart }) => {
  const { t } = useTranslation();
  const chartVersion = chart?.metadata?.version;
  const displayName = _.startCase(chart?.metadata?.name);
  const imgSrc = chart?.metadata?.icon || getImageForIconClass('icon-helm');
  const provider = chart?.metadata?.maintainers?.[0]?.name;
  return (
    <div style={{ marginBottom: '30px' }}>
      <div className="co-clusterserviceversion-logo">
        <div className="co-clusterserviceversion-logo__icon">
          <span className="co-catalog-item-icon__bg">
            <img
              className="co-catalog-item-icon__img co-catalog-item-icon__img--large"
              src={imgSrc}
              alt={displayName}
              aria-hidden
            />
          </span>
        </div>
        <div className="co-clusterserviceversion-logo__name">
          <Title
            headingLevel="h1"
            className="co-clusterserviceversion-logo__name__clusterserviceversion"
          >
            {displayName}
          </Title>
          {provider && (
            <span className="pf-v6-u-font-size-xs pf-v6-u-text-color-subtle">
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
