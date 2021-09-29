import * as React from 'react';
import { match as Rmatch } from 'react-router-dom';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { referenceForModel } from '@console/internal/module/k8s';
import { PipelineModel } from '../../../models';
import { filters } from './PipelineAugmentRuns';
import PipelineAugmentRunsWrapper from './PipelineAugmentRunsWrapper';

interface PipelinesListProps {
  match: Rmatch<any>;
}

const PipelinesList: React.FC<PipelinesListProps> = ({
  match: {
    params: { ns: namespace },
  },
}) => {
  const watchedResources = {
    [PipelineModel.id]: {
      isList: true,
      kind: referenceForModel(PipelineModel),
      namespace,
      prop: PipelineModel.id,
      filters: { ...filters },
    },
  };
  const { pipeline } = useK8sWatchResources(watchedResources);

  return (
    <div className="co-m-pane__body">
      <PipelineAugmentRunsWrapper pipeline={pipeline} />
    </div>
  );
};

export default PipelinesList;
