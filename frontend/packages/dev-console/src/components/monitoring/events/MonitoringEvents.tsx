import type { FC } from 'react';
import { EventsList } from '@console/internal/components/events';

const MonitoringEvents: FC = (props) => {
  return <EventsList {...props} />;
};

export default MonitoringEvents;
