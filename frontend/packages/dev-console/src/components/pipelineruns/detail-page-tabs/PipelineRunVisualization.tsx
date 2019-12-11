import * as React from 'react';
import { K8sResourceKind, k8sGet } from '@console/internal/module/k8s';
import { PipelineModel } from '../../../models';
import PipelineTopologyVisualization from '../../pipelines/detail-page-tabs/pipeline-details/pipeline-topology/PipelineTopologyVisualization';
import { Pipeline, PipelineRun } from '../../../utils/pipeline-augment';

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
      pipeline: null,
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
    const { pipelineRun } = this.props;
    const { errorCode, pipeline } = this.state;

    if (errorCode === 404) {
      return null;
    }

    if (!pipeline) return null;

    return (
      <PipelineTopologyVisualization
        pipeline={pipeline as Pipeline}
        pipelineRun={pipelineRun as PipelineRun}
      />
    );
  }
}
