import * as React from 'react';
import {
  ClipboardCopy,
  ClipboardCopyVariant,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
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
      <DescriptionList className="odc-event-listener-url">
        <DescriptionListGroup>
          <DescriptionListTerm>{t('pipelines-plugin~URL')}</DescriptionListTerm>
          <DescriptionListDescription>
            <ClipboardCopy variant={ClipboardCopyVariant.inlineCompact}>{routeURL}</ClipboardCopy>
          </DescriptionListDescription>
        </DescriptionListGroup>
      </DescriptionList>
    )
  );
};

export default EventListenerURL;
