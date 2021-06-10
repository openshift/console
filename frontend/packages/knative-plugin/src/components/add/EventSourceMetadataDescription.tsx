import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { EventSourceMetaData } from './import-types';

import './EventSourceMetaDescription.scss';

type EventSourceMetaDescriptionProps = {
  normalizedSource: EventSourceMetaData;
};

const EventSourceMetaDescription: React.FC<EventSourceMetaDescriptionProps> = ({
  normalizedSource,
}) => {
  const { t } = useTranslation();
  if (_.isEmpty(normalizedSource)) {
    return null;
  }
  const { name, provider, iconUrl, description } = normalizedSource;
  return (
    <div className="kn-event-source-metadata-description__container">
      <div className="co-clusterserviceversion-logo">
        <div className="co-clusterserviceversion-logo__icon">
          <img
            className="co-catalog-item-icon__img co-catalog-item-icon__img--large"
            src={iconUrl}
            alt={name}
            aria-hidden
          />
        </div>
        <div className="co-clusterserviceversion-logo__name">
          <h1 className="co-clusterserviceversion-logo__name__clusterserviceversion">{name}</h1>
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

export default EventSourceMetaDescription;
