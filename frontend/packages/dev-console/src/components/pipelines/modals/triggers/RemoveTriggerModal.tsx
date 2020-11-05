import * as React from 'react';
import { Formik, FormikHelpers } from 'formik';
import { useTranslation } from 'react-i18next';
import { createModalLauncher, ModalComponentProps } from '@console/internal/components/factory';
import { Pipeline } from '../../../../utils/pipeline-augment';
import ModalStructure from '../common/ModalStructure';
import RemoveTriggerForm from './RemoveTriggerForm';
import { removeTrigger } from './remove-utils';
import { RemoveTriggerFormValues } from './types';
import { removeTriggerSchema } from './validation-utils';

type RemoveTriggerModalProps = ModalComponentProps & {
  pipeline: Pipeline;
};

const RemoveTriggerModal: React.FC<RemoveTriggerModalProps> = ({ pipeline, close }) => {
  const { t } = useTranslation();
  const initialValues: RemoveTriggerFormValues = {
    selectedTrigger: null,
  };

  const handleSubmit = (
    values: RemoveTriggerFormValues,
    actions: FormikHelpers<RemoveTriggerFormValues>,
  ) => {
    actions.setSubmitting(true);

    removeTrigger(values, pipeline)
      .then(() => {
        actions.setSubmitting(false);
        close();
      })
      .catch((e) => {
        actions.setSubmitting(false);
        actions.setStatus({ submitError: e.message });
      });
  };

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={removeTriggerSchema(t)}
    >
      {(formikProps) => (
        <ModalStructure
          {...formikProps}
          submitBtnText={t('devconsole~Remove')}
          submitDanger
          title={t('devconsole~Remove Trigger')}
          close={close}
        >
          <RemoveTriggerForm pipeline={pipeline} />
        </ModalStructure>
      )}
    </Formik>
  );
};

export default createModalLauncher(RemoveTriggerModal);
