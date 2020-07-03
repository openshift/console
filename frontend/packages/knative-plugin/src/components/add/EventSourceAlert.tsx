import * as React from 'react';
import * as _ from 'lodash';
import { Alert } from '@patternfly/react-core';
import { EventSourceListData } from './import-types';

interface EventSourceAlertProps {
  eventSourceStatus: EventSourceListData | null;
}

const EventSourceAlert: React.FC<EventSourceAlertProps> = ({ eventSourceStatus }) => {
  const noEventSources = eventSourceStatus === null;
  const noEventSourceAccess =
    !noEventSources && eventSourceStatus.loaded && _.isEmpty(eventSourceStatus.eventSourceList);
  const showAlert = noEventSources || noEventSourceAccess;

  return showAlert ? (
    <Alert variant="default" title="Event Source cannot be created" isInline>
      {noEventSourceAccess && 'You do not have write access in this project.'}
      {noEventSources && 'Creation of event sources are not currently supported on this cluster.'}
    </Alert>
  ) : null;
};

export default EventSourceAlert;
