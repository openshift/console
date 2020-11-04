import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { Alert } from '@patternfly/react-core';
import { EventSourceListData } from './import-types';

interface EventSourceAlertProps {
  eventSourceStatus: EventSourceListData;
  showSourceKindAlert?: boolean;
}

const EventSourceAlert: React.FC<EventSourceAlertProps> = ({
  eventSourceStatus,
  showSourceKindAlert,
}) => {
  const { t } = useTranslation();
  const noEventSources = eventSourceStatus.eventSourceList === null;
  const noEventSourceAccess =
    !noEventSources && eventSourceStatus.loaded && _.isEmpty(eventSourceStatus.eventSourceList);
  const showAlert =
    noEventSources || noEventSourceAccess || (eventSourceStatus.loaded && showSourceKindAlert);

  return showAlert ? (
    <Alert
      variant={showSourceKindAlert ? 'danger' : 'default'}
      title={t('knative-plugin~Event Source cannot be created')}
      isInline
    >
      {noEventSourceAccess && t('knative-plugin~You do not have write access in this project.')}
      {noEventSources &&
        t('knative-plugin~Creation of event sources are not currently supported on this cluster.')}
      {showSourceKindAlert && t('knative-plugin~Event Source is not found on this cluster.')}
    </Alert>
  ) : null;
};

export default EventSourceAlert;
