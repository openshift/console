import * as React from 'react';
import { useParams } from 'react-router-dom-v5-compat';
import { ResourcesEventStream } from '@console/internal/components/events';
import { EventInvolvedObject } from '@console/internal/module/k8s';
import { Build } from '../../types';

type BuildEventsTabProps = {
  obj: Build;
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

const BuildEventsTab: React.FC<BuildEventsTabProps> = ({ obj: build }) => {
  const { ns: namespace } = useParams();
  return <ResourcesEventStream filters={getFilters(build)} namespace={namespace} />;
};

export default BuildEventsTab;
