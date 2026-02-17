import type { FC } from 'react';
import { useMemo } from 'react';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { EventKind, PodKind } from '@console/internal/module/k8s';
import { OverviewItem, usePodsWatcher } from '@console/shared';
import MonitoringOverview from './MonitoringOverview';

type MonitoringTabProps = {
  item: OverviewItem;
};

const MonitoringTab: FC<MonitoringTabProps> = ({ item }) => {
  const { monitoringAlerts } = item;
  const {
    kind,
    metadata: { uid, name, namespace },
  } = item.obj;
  const { podData, loadError, loaded } = usePodsWatcher(item.obj, item.obj.kind, namespace);

  const watchResources = useMemo(() => {
    const res: Record<
      string,
      { isList: boolean; kind: string; namespace: string; fieldSelector?: string }
    > = {
      resourceEvents: {
        isList: true,
        kind: 'Event',
        namespace,
        fieldSelector: `involvedObject.uid=${uid},involvedObject.name=${name},involvedObject.kind=${kind}`,
      },
    };

    if (loaded && !loadError && podData?.pods && podData.pods.length > 0) {
      res.podEvents = {
        isList: true,
        kind: 'Event',
        namespace,
      };
    }
    return res;
  }, [kind, uid, name, namespace, loaded, loadError, podData]);

  const resources = useK8sWatchResources<Record<string, EventKind[]>>(watchResources);

  // Transform resources to the expected format for MonitoringOverview
  const resourceEvents = resources.resourceEvents
    ? {
        data: resources.resourceEvents.data || [],
        loaded: resources.resourceEvents.loaded,
        loadError: resources.resourceEvents.loadError,
      }
    : undefined;

  // Filter pod events from the single watch and build props object
  const podEventProps: Record<string, { data: EventKind[]; loaded: boolean }> = {};
  if (podData?.pods && resources.podEvents) {
    const podEventData = resources.podEvents.data || [];
    podData.pods.forEach((pod) => {
      const filteredEvents = podEventData.filter(
        (event) => event.involvedObject?.uid === pod.metadata.uid,
      );
      podEventProps[pod.metadata.uid] = {
        data: filteredEvents,
        loaded: resources.podEvents.loaded,
      };
    });
  }

  return (
    <MonitoringOverview
      resource={item.obj}
      pods={(podData?.pods as PodKind[]) || []}
      monitoringAlerts={monitoringAlerts}
      resourceEvents={resourceEvents}
      {...podEventProps}
    />
  );
};

export default MonitoringTab;
