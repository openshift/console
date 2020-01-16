import * as React from 'react';
import { OverviewItem } from '@console/shared';
import MonitoringOverview from './MonitoringOverview';

type MonitoringTabProps = {
  item: OverviewItem;
};

const MonitoringTab: React.FC<MonitoringTabProps> = ({ item: { obj: res, events } }) => {
  return <MonitoringOverview resource={res} events={events} />;
};

export default MonitoringTab;
