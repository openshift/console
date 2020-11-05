import * as React from 'react';
import { Formik } from 'formik';
import { useTranslation } from 'react-i18next';
import {
  createModalLauncher,
  ModalComponentProps,
} from '@console/internal/components/factory/modal';
import { errorModal } from '@console/internal/components/modals';
import { Pipeline, PipelineRun } from '../../../../utils/pipeline-augment';
import { useUserAnnotationForManualStart } from '../../../pipelineruns/triggered-by';
import ModalStructure from '../common/ModalStructure';
import { convertPipelineToModalData } from '../common/utils';
import { startPipelineSchema } from '../common/validation-utils';
import StartPipelineForm from './StartPipelineForm';
import { submitStartPipeline } from './submit-utils';
import { StartPipelineFormValues } from './types';

export interface StartPipelineModalProps {
  pipeline: Pipeline;
  onSubmit?: (pipelineRun: PipelineRun) => void;
}
const StartPipelineModal: React.FC<StartPipelineModalProps & ModalComponentProps> = ({
  pipeline,
  close,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const userStartedAnnotation = useUserAnnotationForManualStart();

  const initialValues: StartPipelineFormValues = {
    ...convertPipelineToModalData(pipeline),
    secretOpen: false,
  };

  const handleSubmit = (values: StartPipelineFormValues, actions): void => {
    actions.setSubmitting(true);

    submitStartPipeline(values, pipeline, null, userStartedAnnotation)
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
      validationSchema={startPipelineSchema(t)}
    >
      {(formikProps) => (
        <ModalStructure
          submitBtnText={t('devconsole~Start')}
          title={t('devconsole~Start Pipeline')}
          close={close}
          {...formikProps}
        >
          <StartPipelineForm {...formikProps} />
        </ModalStructure>
      )}
    </Formik>
  );
};

export default createModalLauncher(StartPipelineModal);
