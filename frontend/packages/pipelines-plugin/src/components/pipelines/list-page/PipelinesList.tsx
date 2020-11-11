import * as React from 'react';
import { match as Rmatch } from 'react-router-dom';
import { referenceForModel } from '@console/internal/module/k8s';
import PipelineAugmentRunsWrapper from './PipelineAugmentRunsWrapper';
import { PipelineModel } from '../../../models';
import { filters } from './PipelineAugmentRuns';
import { Firehose } from '@console/internal/components/utils';

interface PipelinesListProps {
  match: Rmatch<any>;
}

const PipelinesList: React.FC<PipelinesListProps> = ({
  match: {
    params: { ns: namespace },
  },
}) => {
  const resources = [
    {
      isList: true,
      kind: referenceForModel(PipelineModel),
      namespace,
      prop: PipelineModel.id,
      filters: { ...filters },
    },
  ];
  return (
    <div className="co-m-pane__body">
      <Firehose resources={resources}>
        <PipelineAugmentRunsWrapper />
      </Firehose>
    </div>
  );
};

export default PipelinesList;
