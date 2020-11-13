import * as React from 'react';
import { Formik } from 'formik';
import {
  createModalLauncher,
  ModalComponentProps,
} from '@console/internal/components/factory/modal';
import { Pipeline } from '../../../../utils/pipeline-augment';
import ModalStructure from '../common/ModalStructure';
import { convertPipelineToModalData } from '../common/utils';
import { addTriggerSchema } from '../common/validation-utils';
import AddTriggerForm from './AddTriggerForm';
import { TRIGGER_BINDING_EMPTY } from './const';
import { submitTrigger } from './submit-utils';
import { AddTriggerFormValues } from './types';

type AddTriggerModalProps = ModalComponentProps & {
  pipeline: Pipeline;
};

const AddTriggerModal: React.FC<AddTriggerModalProps> = ({ pipeline, close }) => {
  const initialValues: AddTriggerFormValues = {
    ...convertPipelineToModalData(pipeline, true),
    triggerBinding: {
      name: TRIGGER_BINDING_EMPTY,
      resource: null,
    },
  };

  const handleSubmit = (values: AddTriggerFormValues, actions) => {
    actions.setSubmitting(true);

    submitTrigger(pipeline, values)
      .then(() => {
        actions.setSubmitting(false);
        close();
      })
      .catch((error) => {
        actions.setStatus({ submitError: error?.message || 'There was an unknown error' });
      });
  };

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={addTriggerSchema}
    >
      {(formikProps) => (
        <ModalStructure submitBtnText="Add" title="Add Trigger" close={close} {...formikProps}>
          <AddTriggerForm {...formikProps} />
        </ModalStructure>
      )}
    </Formik>
  );
};

export default createModalLauncher(AddTriggerModal);
