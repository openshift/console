import * as React from 'react';
import { OverviewItem } from '@console/shared';
import { Firehose } from '@console/internal/components/utils';
import MonitoringOverview from './MonitoringOverview';
import { PodModel } from '@console/internal/models';

type MonitoringTabProps = {
  item: OverviewItem;
};

const MonitoringTab: React.FC<MonitoringTabProps> = ({ item }) => {
  const { pods, monitoringAlerts } = item;
  const {
    kind,
    metadata: { uid, name, namespace },
  } = item.obj;
  const resources = [
    {
      isList: true,
      kind: 'Event',
      namespace,
      prop: 'resourceEvents',
      fieldSelector: `involvedObject.uid=${uid},involvedObject.name=${name},involvedObject.kind=${kind}`,
    },
  ];

  if (pods) {
    pods.forEach((pod) => {
      const fieldSelector = `involvedObject.uid=${pod.metadata.uid},involvedObject.name=${pod.metadata.name},involvedObject.kind=${PodModel.kind}`;
      resources.push({
        isList: true,
        kind: 'Event',
        namespace: pod.metadata.namespace,
        prop: pod.metadata.uid,
        fieldSelector,
      });
    });
  }

  return (
    <Firehose resources={resources}>
      <MonitoringOverview resource={item.obj} pods={pods} monitoringAlerts={monitoringAlerts} />
    </Firehose>
  );
};

export default MonitoringTab;
