import * as React from 'react';
import { FormikProps, FormikValues } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import {
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
} from '@console/internal/components/factory/modal';
import { TextAreaField } from '@console/shared';

export interface ApprovalModalProps {
  labelTitle: string;
  labelDescription?: JSX.Element;
  type: string;
  cancel?: () => void;
}

type Props = FormikProps<FormikValues> & ApprovalModalProps;

const ApprovalModal: React.FC<Props> = ({
  labelTitle,
  labelDescription,
  type,
  handleSubmit,
  cancel,
  isSubmitting,
  status,
  errors,
  values,
}) => {
  const { t } = useTranslation();
  const dirty = type === 'reject' && _.isEmpty(values.reason);
  return (
    <form className="modal-content" onSubmit={handleSubmit}>
      <ModalTitle>{labelTitle}</ModalTitle>
      <ModalBody>
        {labelDescription}
        <FormSection fullWidth>
          <TextAreaField
            name={'reason'}
            label={t('pipelines-plugin~Reason')}
            rows={5}
            required={type !== 'approve'}
          />
        </FormSection>
      </ModalBody>
      <ModalSubmitFooter
        inProgress={isSubmitting}
        submitText={t('pipelines-plugin~Submit')}
        cancelText={t('pipelines-plugin~Cancel')}
        submitDisabled={dirty || !_.isEmpty(errors) || isSubmitting}
        buttonAlignment="left"
        cancel={cancel}
        errorMessage={status.error}
      />
    </form>
  );
};

export default ApprovalModal;
