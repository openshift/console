import * as React from 'react';
import { Title } from '@patternfly/react-core';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { KnEventCatalogMetaData } from './import-types';

import './KnEventMetaDescription.scss';

type KnEventMetaDescriptionProps = {
  normalizedData: KnEventCatalogMetaData;
};

const KnEventMetaDescription: React.FC<KnEventMetaDescriptionProps> = ({ normalizedData }) => {
  const { t } = useTranslation();
  if (_.isEmpty(normalizedData)) {
    return null;
  }
  const { name, provider, iconUrl, description } = normalizedData;
  return (
    <div className="kn-event-metadata-description__container">
      <div className="co-clusterserviceversion-logo">
        <div className="co-clusterserviceversion-logo__icon">
          <span className="co-catalog-item-icon__bg">
            <img
              className="co-catalog-item-icon__img co-catalog-item-icon__img--large"
              src={iconUrl}
              alt={name}
              aria-hidden
            />
          </span>
        </div>
        <div className="co-clusterserviceversion-logo__name">
          <Title
            headingLevel="h1"
            className="co-clusterserviceversion-logo__name__clusterserviceversion"
          >
            {name}
          </Title>
          {provider && (
            <span className="co-clusterserviceversion-logo__name__provider text-muted">
              {t('knative-plugin~Provided by {{provider}}', {
                provider,
              })}
            </span>
          )}
        </div>
      </div>
      {description}
    </div>
  );
};

export default KnEventMetaDescription;
