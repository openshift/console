import * as React from 'react';
import { Firehose } from '@console/internal/components/utils';
import { PodModel } from '@console/internal/models';
import { PodKind } from '@console/internal/module/k8s';
import { OverviewItem, usePodsWatcher } from '@console/shared';
import MonitoringOverview from './MonitoringOverview';

type MonitoringTabProps = {
  item: OverviewItem;
};

const MonitoringTab: React.FC<MonitoringTabProps> = ({ item }) => {
  const { monitoringAlerts } = item;
  const {
    kind,
    metadata: { uid, name, namespace },
  } = item.obj;
  const { podData, loadError, loaded } = usePodsWatcher(item.obj, item.obj.kind, namespace);

  const resources = React.useMemo(() => {
    const res = [
      {
        isList: true,
        kind: 'Event',
        namespace,
        prop: 'resourceEvents',
        fieldSelector: `involvedObject.uid=${uid},involvedObject.name=${name},involvedObject.kind=${kind}`,
      },
    ];

    if (loaded && !loadError && podData?.pods) {
      podData.pods.forEach((pod) => {
        const fieldSelector = `involvedObject.uid=${pod.metadata.uid},involvedObject.name=${pod.metadata.name},involvedObject.kind=${PodModel.kind}`;
        res.push({
          isList: true,
          kind: 'Event',
          namespace: pod.metadata.namespace,
          prop: pod.metadata.uid,
          fieldSelector,
        });
      });
    }
    return res;
  }, [kind, uid, name, namespace, loaded, loadError, podData]);

  return (
    <Firehose resources={resources}>
      <MonitoringOverview
        resource={item.obj}
        pods={(podData?.pods as PodKind[]) || []}
        monitoringAlerts={monitoringAlerts}
      />
    </Firehose>
  );
};

export default MonitoringTab;
