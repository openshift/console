import * as React from 'react';
import { K8sResourceKind, k8sGet } from '@console/internal/module/k8s';
import { PipelineVisualizationGraph } from '../pipelines/PipelineVisualizationGraph';
import { getPipelineTasks } from '../../utils/pipeline-utils';
import { PipelineModel } from '../../models';

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

  render() {
    if (this.state.errorCode === 404) {
      return null;
    }
    return (
      <PipelineVisualizationGraph
        namespace={this.props.pipelineRun.metadata.namespace}
        graph={getPipelineTasks(this.state.pipeline, this.props.pipelineRun)}
      />
    );
  }
}
