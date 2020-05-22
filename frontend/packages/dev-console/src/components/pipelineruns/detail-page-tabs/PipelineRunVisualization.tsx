import * as React from 'react';
import { K8sResourceKind, k8sGet } from '@console/internal/module/k8s';
import { getPipelineTasks } from '../../../utils/pipeline-utils';
import { pipelineRefExists } from '../../../utils/pipeline-augment';
import { PipelineModel } from '../../../models';
import { pipelineRunFilterReducer } from '../../../utils/pipeline-filter-reducer';
import { PipelineVisualizationGraph } from '../../pipelines/detail-page-tabs/pipeline-details/PipelineVisualizationGraph';

export interface PipelineRunVisualizationProps {
  pipelineRun: K8sResourceKind;
}

export interface PipelineVisualizationRunState {
  pipeline: K8sResourceKind;
  errorCode?: number;
}

export class PipelineRunVisualization extends React.Component<
  PipelineRunVisualizationProps,
  PipelineVisualizationRunState
> {
  constructor(props) {
    super(props);
    this.state = {
      pipeline: { apiVersion: '', metadata: {}, kind: 'PipelineRun' },
      errorCode: null,
    };
  }

  componentDidMount() {
    if (pipelineRefExists(this.props.pipelineRun)) {
      k8sGet(
        PipelineModel,
        this.props.pipelineRun.spec.pipelineRef.name,
        this.props.pipelineRun.metadata.namespace,
      )
        .then((res) => {
          this.setState({
            pipeline: res,
          });
        })
        .catch((error) => this.setState({ errorCode: error.response.status }));
    }
  }

  render() {
    const { pipelineRun } = this.props;
    if (!pipelineRefExists(pipelineRun) || this.state.errorCode === 404) {
      return null;
    }
    return (
      <PipelineVisualizationGraph
        pipelineRun={pipelineRun.metadata.name}
        namespace={pipelineRun.metadata.namespace}
        graph={getPipelineTasks(this.state.pipeline, pipelineRun)}
        runStatus={pipelineRunFilterReducer(pipelineRun)}
      />
    );
  }
}
