import * as React from 'react';
import { ExpandCollapse, LoadingInline } from '@console/internal/components/utils';
import { useFormikContext, FormikValues } from 'formik';
import { Alert } from '@patternfly/react-core';
import { PipelineVisualization } from '../../pipelines/PipelineVisualization';
import { getPipelineTemplate } from './pipeline-template-utils';

const PipelineTemplate: React.FC = () => {
  const [noTemplateForRuntime, setNoTemplateForRuntime] = React.useState(false);
  const {
    values: {
      pipeline: { template },
      image,
    },
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
        style={{ marginLeft: 'var(--pf-global--spacer--lg)' }}
        title="Since there are no pipeline templates available for this runtime, a pipeline cannot be created."
      />
    );
  }

  return template ? (
    <ExpandCollapse
      textCollapsed="Show pipeline visualization"
      textExpanded="Hide pipeline visualization"
    >
      <PipelineVisualization pipeline={template} />
    </ExpandCollapse>
  ) : (
    <LoadingInline />
  );
};

export default PipelineTemplate;
