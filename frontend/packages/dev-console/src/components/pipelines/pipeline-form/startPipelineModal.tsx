import * as React from 'react';
import * as _ from 'lodash-es';
import { Formik } from 'formik';
import { createModalLauncher } from '@console/internal/components/factory/modal';
import { k8sCreate } from '@console/internal/module/k8s';
import { errorModal } from '@console/internal/components/modals/error-modal';
import { newPipelineRun } from '../../../utils/pipeline-actions';
import { PipelineRunModel } from '../../../models';
import { StartPipelineForm } from './startPipelineForm';
import { validationSchema } from './pipelineForm-validation-utils';


// add props
export const _startPipelineModalForm: React.FC<any> = ({ pipeline, close }) => {
  const initialValues = {
    parameters: _.get(pipeline.spec, 'params', []),
    resources: _.get(pipeline.spec, 'resources', []),
  };
  initialValues.resources.map((resource) => _.merge(resource, { resourceRef: { name: '' } }));

  const handleSubmit = (values) => {
    const pipelineRunData = {
      spec: {
        pipelineRef: {
          name: pipeline.metadata.name,
        },
        params: values.parameters,
        resources: values.resources,
        trigger: {
          type: 'manual',
        },
      },
    };
    k8sCreate(PipelineRunModel, newPipelineRun(pipeline, pipelineRunData))
      .then((newValue) => {
        console.log('Subbmitted successfully', newValue);
        close();
      })
      .catch((err) => errorModal({ error: err.message }));
  };

  const handleReset = (values) => {
    console.log('handleReset', values);
  };

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      onReset={handleReset}
      validateOnBlur
      validateOnChange
      validationSchema={validationSchema}
      render={(props) => <StartPipelineForm {...props} close={close} />}
    />
  );
};

export const startPipelineModalForm = createModalLauncher(_startPipelineModalForm);
