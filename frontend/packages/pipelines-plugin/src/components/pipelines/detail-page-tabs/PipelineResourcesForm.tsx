import * as React from 'react';
import { Form } from '@patternfly/react-core';
import { FormikProps, FormikValues, getIn } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
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
      <div className="co-m-pane__body">
        <PipelineResources fieldName="resources" isReadOnly={!pipelineResourceAccess} />
      </div>
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
          sticky
        />
      )}
    </Form>
  );
};

export default PipelineResourcesForm;
