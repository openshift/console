import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { EventSourceListData } from './import-types';

import './EventSourceMetaDescription.scss';

type EventSourceMetaDescriptionProps = {
  eventSourceStatus: EventSourceListData | null;
  sourceKind: string;
};

const EventSourceMetaDescription: React.FC<EventSourceMetaDescriptionProps> = ({
  eventSourceStatus,
  sourceKind,
}) => {
  const { t } = useTranslation();
  const sourceMetadata = eventSourceStatus.eventSourceList[sourceKind];
  if (!sourceMetadata || _.isEmpty(sourceMetadata)) {
    return null;
  }
  const { displayName } = sourceMetadata;
  const imgSrc = sourceMetadata.iconUrl;
  const { provider } = sourceMetadata;
  const description = sourceMetadata.description || '';
  return (
    <div className="kn-event-source-metadata-description__container">
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
