import * as React from 'react';
import * as cx from 'classnames';
import { PipelineVisualizationTaskItem } from '../../../../utils/pipeline-utils';
import { PipelineVisualizationTask } from './PipelineVisualizationTask';

import './PipelineVisualizationGraph.scss';

export interface PipelineVisualizationGraphProps {
  pipelineRun?: string;
  graph: PipelineVisualizationTaskItem[][];
  namespace: string;
  runStatus?: string;
}

export const PipelineVisualizationGraph: React.FC<PipelineVisualizationGraphProps> = ({
  pipelineRun,
  graph,
  namespace,
  runStatus,
}) => {
  return (
    <div className="odc-pipeline-vis-graph">
      <div className="odc-pipeline-vis-graph__stages">
        {graph.map((stage) => {
          return (
            <div
              className={cx('odc-pipeline-vis-graph__stage', { 'is-parallel': stage.length > 1 })}
              key={stage.map((t) => `${t.taskRef.name}-${t.name}`).join(',')}
            >
              <ul className="odc-pipeline-vis-graph__stage-column">
                {stage.map((task) => {
                  return (
                    <PipelineVisualizationTask
                      key={`${task.taskRef.name}-${task.name}`}
                      pipelineRun={pipelineRun}
                      task={task}
                      pipelineRunStatus={runStatus}
                      namespace={namespace}
                    />
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
};
