import * as React from 'react';
import { DetailsPage, DetailsPageProps } from '@console/internal/components/factory';
import { Kebab, navFactory } from '@console/internal/components/utils';
import { k8sGet, k8sList } from '@console/internal/module/k8s';
import { ErrorPage404 } from '@console/internal/components/error';
import {
  rerunPipelineAndRedirect,
  startPipeline,
  handlePipelineRunSubmit,
  editPipeline,
} from '../../utils/pipeline-actions';
import { getLatestRun } from '../../utils/pipeline-augment';
import { PipelineRunModel, PipelineModel } from '../../models';
import {
  PipelineDetails,
  PipelineParametersForm,
  PipelineResourcesForm,
  PipelineRuns,
} from './detail-page-tabs';
import PipelineForm from './pipeline-form/PipelineForm';
import {
  parametersValidationSchema,
  resourcesValidationSchema,
} from './pipeline-form/pipelineForm-validation-utils';

interface PipelineDetailsPageStates {
  menuActions: Function[];
  errorCode?: number;
}

class PipelineDetailsPage extends React.Component<DetailsPageProps, PipelineDetailsPageStates> {
  constructor(props) {
    super(props);
    this.state = { menuActions: [], errorCode: null };
  }

  componentDidMount() {
    k8sGet(PipelineModel, this.props.name, this.props.namespace)
      .then((res) => {
        // eslint-disable-next-line promise/no-nesting
        k8sList(PipelineRunModel, {
          labelSelector: { 'tekton.dev/pipeline': res.metadata.name },
        })
          .then((listres) => {
            const latestRun = getLatestRun({ data: listres }, 'creationTimestamp');
            this.setState({
              menuActions: [
                () => startPipeline(PipelineModel, res, handlePipelineRunSubmit),
                ...(latestRun && latestRun.metadata
                  ? [() => rerunPipelineAndRedirect(PipelineRunModel, latestRun)]
                  : []),
                editPipeline,
                Kebab.factory.Delete,
              ],
            });
          })
          .catch((error) => {
            this.setState({ errorCode: error.response.status });
          });
      })
      .catch((error) => this.setState({ errorCode: error.response.status }));
  }

  render() {
    if (this.state.errorCode === 404) {
      return <ErrorPage404 />;
    }
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
          {
            href: 'parameters',
            name: 'Parameters',
            component: (props) => (
              <PipelineForm
                PipelineFormComponent={PipelineParametersForm}
                formName="parameters"
                validationSchema={parametersValidationSchema}
                obj={props.obj}
                {...props}
              />
            ),
          },
          {
            href: 'resources',
            name: 'Resources',
            component: (props) => (
              <PipelineForm
                PipelineFormComponent={PipelineResourcesForm}
                formName="resources"
                validationSchema={resourcesValidationSchema}
                obj={props.obj}
                {...props}
              />
            ),
          },
        ]}
      />
    );
  }
}

export default PipelineDetailsPage;
