import * as React from 'react';
import { useParams } from 'react-router-dom-v5-compat';
import { ResourcesEventStream } from '@console/internal/components/events';
import { PipelineRunKind } from '../../../types';
import { usePipelineRunFilters } from './event-utils';

type PipelineRunEventsProps = {
  obj: PipelineRunKind;
};

const PipelineRunEvents: React.FC<PipelineRunEventsProps> = ({ obj: pipelineRun }) => {
  const { ns: namespace } = useParams();
  return (
    <>
      <ResourcesEventStream
        filters={usePipelineRunFilters(namespace, pipelineRun)}
        namespace={namespace}
      />
    </>
  );
};
export default PipelineRunEvents;
