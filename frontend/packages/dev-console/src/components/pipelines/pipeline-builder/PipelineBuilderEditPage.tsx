import * as React from 'react';
import { Link, RouteComponentProps } from 'react-router-dom';
import { Alert } from '@patternfly/react-core';
import { LoadingBox } from '@console/internal/components/utils';
import { k8sGet, referenceForModel } from '@console/internal/module/k8s';
import PipelineBuilderPage from './PipelineBuilderPage';
import { Pipeline } from '../../../utils/pipeline-augment';
import { PipelineModel } from '../../../models';

import './PipelineBuilderEditPage.scss';

type PipelineBuilderEditPageProps = RouteComponentProps<{ ns: string; pipelineName: string }>;

const PipelineBuilderEditPage: React.FC<PipelineBuilderEditPageProps> = (props) => {
  const [editPipeline, setEditPipeline] = React.useState<Pipeline>(null);
  const [error, setError] = React.useState<string>(null);
  const {
    match: {
      params: { pipelineName, ns },
    },
  } = props;

  React.useEffect(() => {
    k8sGet(PipelineModel, pipelineName, ns)
      .then((res: Pipeline) => {
        setEditPipeline(res);
      })
      .catch(() => {
        setError('Unable to load Pipeline');
      });
  }, [pipelineName, ns]);

  if (error) {
    // TODO: confirm verbiage with UX
    return (
      <div className="odc-pipeline-builder-edit-page">
        <Alert variant="danger" isInline title={error}>
          Navigate back to the{' '}
          <Link to={`/k8s/ns/${ns}/${referenceForModel(PipelineModel)}`}>Pipelines page</Link>.
        </Alert>
      </div>
    );
  }

  if (!editPipeline) {
    return <LoadingBox />;
  }

  return <PipelineBuilderPage {...props} existingPipeline={editPipeline} />;
};

export default PipelineBuilderEditPage;
