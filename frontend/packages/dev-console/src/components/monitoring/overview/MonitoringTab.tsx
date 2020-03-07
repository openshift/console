import * as React from 'react';
import { OverviewItem } from '@console/shared';
import { Firehose } from '@console/internal/components/utils';
import MonitoringOverview from './MonitoringOverview';

type MonitoringTabProps = {
  item: OverviewItem;
};

const MonitoringTab: React.FC<MonitoringTabProps> = ({ item }) => {
  const {
    kind,
    metadata: { uid, name, namespace },
  } = item.obj;
  const fieldSelector = `involvedObject.uid=${uid},involvedObject.name=${name},involvedObject.kind=${kind}`;

  const resources = [
    {
      isList: true,
      kind: 'Event',
      namespace,
      prop: 'events',
      fieldSelector,
    },
  ];

  return (
    <Firehose resources={resources}>
      <MonitoringOverview resource={item.obj} />
    </Firehose>
  );
};

export default MonitoringTab;
