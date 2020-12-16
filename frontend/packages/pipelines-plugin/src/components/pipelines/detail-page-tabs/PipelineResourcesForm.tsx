import * as React from 'react';
import * as _ from 'lodash';
import { FormikProps, FormikValues, getIn } from 'formik';
import { useTranslation } from 'react-i18next';
import { Form } from '@patternfly/react-core';
import { useAccessReview } from '@console/internal/components/utils';
import { FormFooter } from '@console/shared';
import PipelineResources from './PipelineResources';

type PipelineResourcesFormProps = FormikProps<FormikValues> & {
  namespace: string;
};

const PipelineResourcesForm: React.FC<PipelineResourcesFormProps> = ({
  namespace,
  handleSubmit,
  handleReset,
  isSubmitting,
  status,
  errors,
  dirty,
}) => {
  const pipelineResourceAccess = useAccessReview({
    group: 'tekton.dev',
    resource: 'pipelines',
    namespace,
    verb: 'update',
  });
  const { t } = useTranslation();
  const disableSubmit = !dirty || !_.isEmpty(_.compact(getIn(errors, 'resources')));
  return (
    <Form onSubmit={handleSubmit}>
      <div className="co-m-pane__form">
        <PipelineResources fieldName="resources" isReadOnly={!pipelineResourceAccess} />
        <hr />
        {pipelineResourceAccess && (
          <FormFooter
            handleReset={handleReset}
            isSubmitting={isSubmitting}
            errorMessage={status && status.submitError}
            successMessage={status && !dirty && status.success}
            disableSubmit={disableSubmit}
            showAlert={!disableSubmit}
            submitLabel={t('pipelines-plugin~Save')}
            resetLabel={t('pipelines-plugin~Reload')}
          />
        )}
      </div>
    </Form>
  );
};

export default PipelineResourcesForm;
