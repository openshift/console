import * as React from 'react';
import { match as RMatch } from 'react-router';
import { ResourcesEventStream } from '@console/internal/components/events';
import { EventInvolvedObject } from '@console/internal/module/k8s';
import { BuildRun } from '../../types';

type BuildRunEventsTabProps = {
  obj: BuildRun;
  match: RMatch<{
    ns?: string;
  }>;
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

const BuildRunEventsTab: React.FC<BuildRunEventsTabProps> = ({
  obj: buildRun,
  match: {
    params: { ns: namespace },
  },
}) => {
  return <ResourcesEventStream filters={getFilters(buildRun)} namespace={namespace} />;
};

export default BuildRunEventsTab;
