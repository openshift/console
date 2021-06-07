import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ClipboardCopy, ClipboardCopyVariant } from '@patternfly/react-core';
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
          <dt>{t('pipelines-plugin~URL')}</dt>
          <dd>
            <ClipboardCopy variant={ClipboardCopyVariant.inlineCompact}>{routeURL}</ClipboardCopy>
          </dd>
        </dl>
      </div>
    )
  );
};

export default EventListenerURL;
