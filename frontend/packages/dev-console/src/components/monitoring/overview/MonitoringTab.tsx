import * as React from 'react';
import { OverviewItem, usePodsWatcher } from '@console/shared';
import { Firehose } from '@console/internal/components/utils';
import MonitoringOverview from './MonitoringOverview';
import { PodModel } from '@console/internal/models';
import { PodKind } from '@console/internal/module/k8s';

type MonitoringTabProps = {
  item: OverviewItem;
};

const MonitoringTab: React.FC<MonitoringTabProps> = ({ item }) => {
  const { monitoringAlerts } = item;
  const {
    kind,
    metadata: { uid, name, namespace },
  } = item.obj;
  const [pods, setPods] = React.useState<PodKind[]>([]);
  const { podData, loadError, loaded } = usePodsWatcher(item.obj, item.obj.kind, namespace);

  React.useEffect(() => {
    if (!loadError && loaded) {
      const updatedPods = podData.pods as PodKind[];
      setPods(updatedPods);
    }
  }, [podData, loadError, loaded]);

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

    if (loaded && pods) {
      pods.forEach((pod) => {
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
  }, [kind, uid, name, namespace, loaded, pods]);

  return (
    <Firehose resources={resources}>
      <MonitoringOverview resource={item.obj} pods={pods} monitoringAlerts={monitoringAlerts} />
    </Firehose>
  );
};

export default MonitoringTab;
