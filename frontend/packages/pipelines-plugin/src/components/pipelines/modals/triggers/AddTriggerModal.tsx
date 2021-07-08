import * as React from 'react';
import { Formik } from 'formik';
import { useTranslation } from 'react-i18next';
import {
  createModalLauncher,
  ModalComponentProps,
} from '@console/internal/components/factory/modal';
import { LoadingBox } from '@console/internal/components/utils';
import { PipelineKind } from '../../../../types';
import { usePipelinePVC } from '../../hooks';
import ModalStructure from '../common/ModalStructure';
import { convertPipelineToModalData } from '../common/utils';
import { addTriggerSchema } from '../common/validation-utils';
import AddTriggerForm from './AddTriggerForm';
import { TRIGGER_BINDING_EMPTY } from './const';
import { submitTrigger } from './submit-utils';
import { AddTriggerFormValues } from './types';

type AddTriggerModalProps = ModalComponentProps & {
  pipeline: PipelineKind;
};

const AddTriggerModal: React.FC<AddTriggerModalProps> = ({ pipeline, close }) => {
  const { t } = useTranslation();
  const [pipelinePVC, pipelinePVCLoaded] = usePipelinePVC(
    pipeline.metadata?.name,
    pipeline.metadata?.namespace,
  );

  if (!pipelinePVCLoaded) {
    return <LoadingBox />;
  }
  const initialValues: AddTriggerFormValues = {
    ...convertPipelineToModalData(pipeline, true, pipelinePVC?.metadata?.name),
    triggerBinding: {
      name: TRIGGER_BINDING_EMPTY,
      resource: null,
    },
  };

  const handleSubmit = (values: AddTriggerFormValues, actions) => {
    return submitTrigger(pipeline, values)
      .then(() => {
        close();
      })
      .catch((error) => {
        actions.setStatus({
          submitError: error?.message || t('pipelines-plugin~There was an unknown error'),
        });
      });
  };

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={addTriggerSchema()}
    >
      {(formikProps) => (
        <ModalStructure
          submitBtnText={t('pipelines-plugin~Add')}
          title={t('pipelines-plugin~Add Trigger')}
          close={close}
          {...formikProps}
        >
          <AddTriggerForm {...formikProps} />
        </ModalStructure>
      )}
    </Formik>
  );
};

export default createModalLauncher(AddTriggerModal);
