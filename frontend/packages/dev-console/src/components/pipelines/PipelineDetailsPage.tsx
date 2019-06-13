import * as React from 'react';
import { DetailsPage, DetailsPageProps } from '@console/internal/components/factory';
import { Kebab, navFactory } from '@console/internal/components/utils';
import { k8sGet, k8sList } from '@console/internal/module/k8s';
import PipelinEnvironmentComponent from './PipelineEnvironment';
import PipelineDetails from './PipelineDetails';
import PipelineRuns from './PipelineRuns';
import { triggerPipeline, rerunPipeline } from '../../utils/pipeline-actions';
import { getLatestRun } from '../../utils/pipeline-augment';
import { PipelineRunModel, PipelineModel } from '../../models';

interface PipelineDetailsPageStates {
  menuActions: Function[];
}

class PipelineDetailsPage extends React.Component<DetailsPageProps, PipelineDetailsPageStates> {
  constructor(props) {
    super(props);
    this.state = { menuActions: [] };
  }

  componentDidMount() {
    // eslint-disable-next-line promise/catch-or-return
    k8sGet(PipelineModel, this.props.name, this.props.namespace).then((res) => {
      // eslint-disable-next-line promise/no-nesting, promise/catch-or-return
      k8sList(PipelineRunModel, {
        labelSelector: { 'tekton.dev/pipeline': res.metadata.name },
      }).then((listres) => {
        this.setState({
          menuActions: [
            triggerPipeline(res, getLatestRun({ data: listres }, 'creationTimestamp'), 'pipelines'),
            rerunPipeline(res, getLatestRun({ data: listres }, 'creationTimestamp'), 'pipelines'),
            ...Kebab.factory.common,
          ],
        });
      });
    });
  }

  render() {
    return (
      <DetailsPage
        {...this.props}
        menuActions={this.state.menuActions}
        pages={[
          navFactory.details(PipelineDetails),
          navFactory.editYaml(),

          {
            href: 'Runs',
            name: 'Pipeline Runs',
            component: PipelineRuns,
          },
          navFactory.envEditor(PipelinEnvironmentComponent),
        ]}
      />
    );
  }
}

export default PipelineDetailsPage;
