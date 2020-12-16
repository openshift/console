import * as React from 'react';
import { match as RMatch } from 'react-router-dom';
import { EventsList } from '@console/internal/components/events';

interface MonitoringEventsProps {
  match: RMatch<{
    ns?: string;
  }>;
}

const MonitoringEvents: React.FC<MonitoringEventsProps> = (props) => {
  return <EventsList {...props} namespace={props.match.params.ns} />;
};

export default MonitoringEvents;
