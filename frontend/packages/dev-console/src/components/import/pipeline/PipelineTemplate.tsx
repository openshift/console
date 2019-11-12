import * as React from 'react';
import { LoadingInline } from '@console/internal/components/utils';
import { useFormikContext, FormikValues } from 'formik';
import { Alert, Expandable } from '@patternfly/react-core';
import { CheckboxField } from '../../formik-fields';
import { PipelineVisualization } from '../../pipelines/PipelineVisualization';
import { getPipelineTemplate } from './pipeline-template-utils';

const PipelineTemplate: React.FC = () => {
  const [noTemplateForRuntime, setNoTemplateForRuntime] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);

  const {
    values: { pipeline, image },
    setFieldValue,
  } = useFormikContext<FormikValues>();

  React.useEffect(() => {
    let ignore = false;

    const fetchPipelineTemplate = async () => {
      const pipelineTemplate = await getPipelineTemplate(image.selected);

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
  }, [image.selected, setFieldValue]);

  if (noTemplateForRuntime) {
    return (
      <Alert
        isInline
        variant="info"
        title="There are no pipeline templates available for this runtime."
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
