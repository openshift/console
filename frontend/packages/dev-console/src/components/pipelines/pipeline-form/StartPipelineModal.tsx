import * as React from 'react';
import * as _ from 'lodash';
import { Formik, FormikValues } from 'formik';
import {
  createModalLauncher,
  ModalComponentProps,
} from '@console/internal/components/factory/modal';
import { k8sCreate } from '@console/internal/module/k8s';
import { errorModal } from '@console/internal/components/modals';
import { PipelineRunModel } from '../../../models';
import {
  Pipeline,
  PipelineResource,
  PipelineParam,
  PipelineRun,
  PipelineWorkspace,
} from '../../../utils/pipeline-augment';
import { getPipelineRunParams, getPipelineRunWorkspaces } from '../../../utils/pipeline-utils';
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
  workspaces: PipelineWorkspace[];
}

const StartPipelineModal: React.FC<StartPipelineModalProps & ModalComponentProps> = ({
  pipeline,
  getPipelineRunData,
  close,
  onSubmit,
}) => {
  const initialValues: StartPipelineFormValues = {
    namespace: pipeline.metadata.namespace,
    parameters: _.get(pipeline, 'spec.params', []),
    resources: _.get(pipeline, 'spec.resources', []),
    workspaces:
      pipeline.spec.workspaces?.map((workspace: PipelineWorkspace) => ({
        ...workspace,
        type: 'EmptyDirectory',
      })) ?? [],
  };
  initialValues.resources.map((resource: PipelineResource) =>
    _.merge(resource, { resourceRef: { name: '' } }),
  );

  const handleSubmit = (values: StartPipelineFormValues, actions): void => {
    actions.setSubmitting(true);

    const pipelineRunData: PipelineRun = {
      spec: {
        pipelineRef: {
          name: pipeline.metadata.name,
        },
        params: getPipelineRunParams(values.parameters),
        resources: values.resources,
        workspaces: getPipelineRunWorkspaces(values.workspaces),
      },
    };
    k8sCreate(PipelineRunModel, getPipelineRunData(pipeline, pipelineRunData))
      .then((res) => {
        actions.setSubmitting(false);
        onSubmit && onSubmit(res);
        close();
      })
      .catch((err) => {
        actions.setSubmitting(false);
        actions.setStatus({ submitError: err.message });
        errorModal({ error: err.message });
        close();
      });
  };

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={startPipelineSchema}
    >
      {(props) => <StartPipelineForm {...props} close={close} />}
    </Formik>
  );
};

export default createModalLauncher(StartPipelineModal);
