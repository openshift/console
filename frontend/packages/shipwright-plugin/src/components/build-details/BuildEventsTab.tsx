import * as React from 'react';
import { match as RMatch } from 'react-router';
import { ResourcesEventStream } from '@console/internal/components/events';
import { EventInvolvedObject } from '@console/internal/module/k8s';
import { Build } from '../../types';

type BuildEventsTabProps = {
  obj: Build;
  match: RMatch<{
    ns?: string;
  }>;
};

const getFilters = (build: Build) => {
  const name = build.metadata?.name;
  if (!name) return []; // An empty filter array will show NO events.
  const namePrefix = `${name}-`;
  return [
    (involvedObject: EventInvolvedObject) =>
      involvedObject.kind === 'Build' && involvedObject.name === name,
    (involvedObject: EventInvolvedObject) =>
      involvedObject.kind === 'BuildRun' && involvedObject.name.startsWith(namePrefix),
    (involvedObject: EventInvolvedObject) =>
      involvedObject.kind === 'TaskRun' && involvedObject.name.startsWith(namePrefix),
    (involvedObject: EventInvolvedObject) =>
      involvedObject.kind === 'Pod' &&
      involvedObject.name.startsWith(namePrefix) &&
      involvedObject.name.endsWith('-pod'),
  ];
};

const BuildEventsTab: React.FC<BuildEventsTabProps> = ({
  obj: build,
  match: {
    params: { ns: namespace },
  },
}) => {
  return <ResourcesEventStream filters={getFilters(build)} namespace={namespace} />;
};

export default BuildEventsTab;
