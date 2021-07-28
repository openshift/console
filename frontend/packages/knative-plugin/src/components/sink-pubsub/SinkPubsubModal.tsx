import * as React from 'react';
import { FormikProps, FormikValues } from 'formik';
import * as fuzzy from 'fuzzysearch';
import { Trans, useTranslation } from 'react-i18next';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import {
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
} from '@console/internal/components/factory/modal';
import { FirehoseResource } from '@console/internal/components/utils';
import { ResourceDropdownField } from '@console/shared';

export interface SinkPubsubModalProps {
  resourceName: string;
  resourceDropdown: FirehoseResource[];
  labelTitle: string;
  cancel?: () => void;
}

type Props = FormikProps<FormikValues> & SinkPubsubModalProps;

const SinkPubsubModal: React.FC<Props> = ({
  resourceName,
  resourceDropdown,
  labelTitle,
  handleSubmit,
  cancel,
  isSubmitting,
  status,
  setFieldValue,
  setFieldTouched,
  validateForm,
  values,
  initialValues,
}) => {
  const { t } = useTranslation();
  const autocompleteFilter = (strText, item): boolean => fuzzy(strText, item?.props?.name);
  const onSinkChange = React.useCallback(
    (selectedValue, target) => {
      const modelResource = target?.props?.model;
      if (selectedValue) {
        setFieldTouched('ref.name', true);
        setFieldValue('ref.name', selectedValue);
        if (modelResource) {
          const { apiGroup, apiVersion, kind } = modelResource;
          const sinkApiversion = `${apiGroup}/${apiVersion}`;
          setFieldValue('ref.apiVersion', sinkApiversion);
          setFieldTouched('ref.apiVersion', true);
          setFieldValue('ref.kind', kind);
          setFieldTouched('ref.kind', true);
        }
        validateForm();
      }
    },
    [setFieldValue, setFieldTouched, validateForm],
  );
  const dirty = values?.ref?.name !== initialValues.ref.name;

  return (
    <form className="modal-content modal-content--no-inner-scroll" onSubmit={handleSubmit}>
      <ModalTitle>{labelTitle}</ModalTitle>
      <ModalBody>
        <p>
          <Trans t={t} ns="knative-plugin" i18nKey="Connects <strong>{{resourceName}}</strong> to">
            Connects <strong>{{ resourceName }}</strong> to
          </Trans>
        </p>
        <FormSection fullWidth>
          <ResourceDropdownField
            name="ref.name"
            resources={resourceDropdown}
            dataSelector={['metadata', 'name']}
            fullWidth
            required
            placeholder={t('knative-plugin~Select a sink')}
            showBadge
            autocompleteFilter={autocompleteFilter}
            onChange={onSinkChange}
            autoSelect
            selectedKey={values?.ref?.name}
          />
        </FormSection>
      </ModalBody>
      <ModalSubmitFooter
        inProgress={isSubmitting}
        submitText={t('knative-plugin~Save')}
        cancelText={t('knative-plugin~Cancel')}
        submitDisabled={!dirty}
        cancel={cancel}
        errorMessage={status.error}
      />
    </form>
  );
};

export default SinkPubsubModal;
