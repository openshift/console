import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ExternalLink } from '@console/internal/components/utils';
import { EventListenerKind } from '../resource-types';
import { useEventListenerURL } from '../utils/triggers';

import './EventListenerURL.scss';

type EventListenerURLProps = {
  eventListener: EventListenerKind;
  namespace: string;
};

const EventListenerURL: React.FC<EventListenerURLProps> = ({ eventListener, namespace }) => {
  const { t } = useTranslation();
  const routeURL = useEventListenerURL(eventListener, namespace);
  return (
    routeURL && (
      <div className="odc-event-listener-url">
        <dl>
          <dt>{t('devconsole~URL')}</dt>
          <dd>
            <ExternalLink href={routeURL} text={routeURL} />
          </dd>
        </dl>
      </div>
    )
  );
};

export default EventListenerURL;
