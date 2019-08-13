import * as React from 'react';
import * as cx from 'classnames';
import { ChevronCircleRightIcon } from '@patternfly/react-icons';
import { PipelineVisualizationTaskItem } from '../../utils/pipeline-utils';
import { PipelineVisualizationTask } from './PipelineVisualizationTask';

import './PipelineVisualizationGraph.scss';

export interface PipelineVisualizationGraphProps {
  graph: PipelineVisualizationTaskItem[][];
  namespace: string;
}

export const PipelineVisualizationGraph: React.FC<PipelineVisualizationGraphProps> = ({
  graph,
  namespace,
}) => {
  return (
    <div className="odc-pipeline-vis-graph">
      <div className="odc-pipeline-vis-graph__stages">
        <div className="odc-pipeline-vis-graph__stage">
          <div className="odc-pipeline-vis-task is-input-node">
            <ChevronCircleRightIcon />
          </div>
        </div>
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
                      task={task}
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
