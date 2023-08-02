import * as React from 'react';
import { EventsList } from '@console/internal/components/events';

const MonitoringEvents: React.FC = (props) => {
  return <EventsList {...props} />;
};

export default MonitoringEvents;
