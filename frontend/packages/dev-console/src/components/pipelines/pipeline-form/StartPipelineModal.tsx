import * as React from 'react';
import * as _ from 'lodash';
import { Formik, FormikValues } from 'formik';
import {
  createModalLauncher,
  ModalComponentProps,
} from '@console/internal/components/factory/modal';
import { k8sCreate } from '@console/internal/module/k8s';
import { PipelineRunModel } from '../../../models';
import {
  Pipeline,
  PipelineResource,
  PipelineRun,
  PipelineParam,
} from '../../../utils/pipeline-augment';
import StartPipelineForm from './StartPipelineForm';
import { startPipelineSchema } from './pipelineForm-validation-utils';

export type newPipelineRunData = (Pipeline: Pipeline, latestRun?: PipelineRun) => {};

export interface StartPipelineModalProps {
  pipeline: Pipeline;
  getPipelineRunData: newPipelineRunData;
  onSubmit?: (pipelineRun: PipelineRun) => void;
}
export interface StartPipelineFormValues extends FormikValues {
  namespace: string;
  parameters: PipelineParam[];
  resources: PipelineResource[];
}

const StartPipelineModal: React.FC<StartPipelineModalProps & ModalComponentProps> = ({
  pipeline,
  getPipelineRunData,
  close,
  onSubmit,
}) => {
  const initialValues: StartPipelineFormValues = {
    namespace: pipeline.metadata.namespace,
    parameters: _.get(pipeline.spec, 'params', []),
    resources: _.get(pipeline.spec, 'resources', []),
  };
  initialValues.resources.map((resource: PipelineResource) =>
    _.merge(resource, { resourceRef: { name: '' } }),
  );

  const handleSubmit = (values: StartPipelineFormValues, actions): void => {
    actions.setSubmitting(true);
    const newPipeline: Pipeline = {
      ...pipeline,
      spec: {
        ...pipeline.spec,
        params: values.parameters,
        resources: values.resources,
      },
    };
    k8sCreate(PipelineRunModel, getPipelineRunData(newPipeline))
      .then((res) => {
        actions.setSubmitting(false);
        onSubmit && onSubmit(res);
        close();
      })
      .catch((err) => {
        actions.setSubmitting(false);
        actions.setStatus({ submitError: err.message });
        close();
      });
  };

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={startPipelineSchema}
      render={(props) => <StartPipelineForm {...props} close={close} />}
    />
  );
};

export default createModalLauncher(StartPipelineModal);
