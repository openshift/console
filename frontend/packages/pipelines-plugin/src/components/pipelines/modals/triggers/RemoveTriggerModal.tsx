import * as React from 'react';
import { Formik, FormikHelpers } from 'formik';
import { useTranslation } from 'react-i18next';
import { createModalLauncher, ModalComponentProps } from '@console/internal/components/factory';
import { PipelineKind } from '../../../../types';
import ModalStructure from '../common/ModalStructure';
import RemoveTriggerForm from './RemoveTriggerForm';
import { removeTrigger } from './remove-utils';
import { RemoveTriggerFormValues } from './types';
import { removeTriggerSchema } from './validation-utils';

type RemoveTriggerModalProps = ModalComponentProps & {
  pipeline: PipelineKind;
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
    return removeTrigger(values, pipeline)
      .then(() => {
        close();
      })
      .catch((e) => {
        actions.setStatus({ submitError: e.message });
      });
  };

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={removeTriggerSchema()}
    >
      {(formikProps) => (
        <ModalStructure
          {...formikProps}
          submitBtnText={t('pipelines-plugin~Remove')}
          submitDanger
          title={t('pipelines-plugin~Remove Trigger')}
          close={close}
        >
          <RemoveTriggerForm pipeline={pipeline} />
        </ModalStructure>
      )}
    </Formik>
  );
};

export default createModalLauncher(RemoveTriggerModal);
