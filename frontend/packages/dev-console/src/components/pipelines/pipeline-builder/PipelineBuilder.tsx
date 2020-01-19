import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import PipelineBuilderVisualization from './PipelineBuilderVisualization';
import { Pipeline, PipelineTask } from '../../../utils/pipeline-augment';
import { PipelineModel } from '../../../models';

const PIPELINE_SKELETON: Pipeline = {
  apiVersion: PipelineModel.apiVersion,
  kind: PipelineModel.kind,
  metadata: {
    name: 'new-pipeline',
  },
  spec: {
    tasks: [],
  },
};

type PipelineBuilderProps = RouteComponentProps<{ ns: string }>;

const PipelineBuilder: React.FC<PipelineBuilderProps> = ({ match }) => {
  const {
    params: { ns: namespace },
  } = match;
  const [pipeline, setPipeline] = React.useState(PIPELINE_SKELETON);

  return (
    <div>
      <h1>Pipeline Builder - In Progress</h1>
      <PipelineBuilderVisualization
        namespace={namespace}
        onUpdateTasks={(updatedTasks: PipelineTask[]) =>
          setPipeline({ ...pipeline, spec: { ...pipeline.spec, tasks: [...updatedTasks] } })
        }
        pipelineTasks={pipeline.spec.tasks}
      />
    </div>
  );
};

export default PipelineBuilder;
