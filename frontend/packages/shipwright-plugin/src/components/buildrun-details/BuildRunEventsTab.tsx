import * as React from 'react';
import { match as RMatch } from 'react-router';
import { ResourcesEventStream } from '@console/internal/components/events';
import { BuildRun } from '../../types';

type BuildRunEventsTabProps = {
  obj: BuildRun;
  match: RMatch<{
    ns?: string;
  }>;
};

const BuildRunEventsTab: React.FC<BuildRunEventsTabProps> = ({
  obj: buildRun,
  match: {
    params: { ns: namespace },
  },
}) => {
  const filters = [];

  return (
    <>
      {buildRun.metadata.name}
      <ResourcesEventStream filters={filters} namespace={namespace} />
    </>
  );
};

export default BuildRunEventsTab;
