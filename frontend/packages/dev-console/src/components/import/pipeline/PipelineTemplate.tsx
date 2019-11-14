import * as React from 'react';
import { LoadingInline } from '@console/internal/components/utils';
import { k8sList } from '@console/internal/module/k8s';
import { useFormikContext, FormikValues } from 'formik';
import { Alert, Expandable } from '@patternfly/react-core';
import { PipelineModel } from '../../../models';
import { CheckboxField } from '../../formik-fields';
import { PipelineVisualization } from '../../pipelines/PipelineVisualization';

const MISSING_DOCKERFILE_LABEL_TEXT =
  'The pipeline template for Dockerfiles is not available at this time.';
const MISSING_RUNTIME_LABEL_TEXT = 'There are no pipeline templates available for this runtime.';

const PipelineTemplate: React.FC = () => {
  const [noTemplateForRuntime, setNoTemplateForRuntime] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);

  const {
    values: { pipeline, image, build },
    setFieldValue,
  } = useFormikContext<FormikValues>();

  const isDockerStrategy = build.strategy === 'Docker';

  React.useEffect(() => {
    let ignore = false;

    const builderPipelineLabel = { 'pipeline.openshift.io/runtime': image.selected };
    const dockerPipelineLabel = { 'pipeline.openshift.io/strategy': 'docker' };

    const labelSelector = isDockerStrategy ? dockerPipelineLabel : builderPipelineLabel;

    const fetchPipelineTemplate = async () => {
      const templates = await k8sList(PipelineModel, {
        ns: 'openshift',
        labelSelector,
      });
      const pipelineTemplate = templates && templates[0];

      if (ignore) return;

      if (pipelineTemplate) {
        setFieldValue('pipeline.template', pipelineTemplate);
        setNoTemplateForRuntime(false);
      } else {
        setFieldValue('pipeline.template', null);
        setNoTemplateForRuntime(true);
      }
      setIsExpanded(false);
    };

    fetchPipelineTemplate();

    return () => {
      ignore = true;
    };
  }, [image.selected, isDockerStrategy, setFieldValue]);

  if (noTemplateForRuntime) {
    return (
      <Alert
        isInline
        variant="info"
        title={isDockerStrategy ? MISSING_DOCKERFILE_LABEL_TEXT : MISSING_RUNTIME_LABEL_TEXT}
      />
    );
  }

  return pipeline.template ? (
    <>
      <CheckboxField label="Add pipeline" name="pipeline.enabled" />
      <Expandable
        toggleText={`${isExpanded ? 'Hide' : 'Show'} pipeline visualization`}
        isExpanded={isExpanded}
        onToggle={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded && <PipelineVisualization pipeline={pipeline.template} />}
      </Expandable>
    </>
  ) : (
    <LoadingInline />
  );
};

export default PipelineTemplate;
