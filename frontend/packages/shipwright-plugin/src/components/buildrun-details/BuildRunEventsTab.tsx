import type { FC } from 'react';
import { useParams } from 'react-router';
import { ResourcesEventStream } from '@console/internal/components/events';
import type { EventInvolvedObject } from '@console/internal/module/k8s';
import type { BuildRun } from '../../types';

type BuildRunEventsTabProps = {
  obj: BuildRun;
};

const getFilters = (buildRun: BuildRun) => {
  const name = buildRun.metadata?.name;
  if (!name) return []; // An empty filter array will show NO events.
  const namePrefix = `${name}-`;
  return [
    (involvedObject: EventInvolvedObject) =>
      involvedObject.kind === 'BuildRun' && involvedObject.name === name,
    (involvedObject: EventInvolvedObject) =>
      involvedObject.kind === 'TaskRun' && involvedObject.name.startsWith(namePrefix),
    (involvedObject: EventInvolvedObject) =>
      involvedObject.kind === 'Pod' &&
      involvedObject.name.startsWith(namePrefix) &&
      involvedObject.name.endsWith('-pod'),
  ];
};

const BuildRunEventsTab: FC<BuildRunEventsTabProps> = ({ obj: buildRun }) => {
  const { ns: namespace } = useParams();
  return <ResourcesEventStream filters={getFilters(buildRun)} namespace={namespace} />;
};

export default BuildRunEventsTab;
