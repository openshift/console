import type { FC } from 'react';
import { useCallback } from 'react';
import { Button, Form, ModalBody, ModalHeader } from '@patternfly/react-core';
import type { FormikProps, FormikValues } from 'formik';
import * as fuzzy from 'fuzzysearch';
import { Trans, useTranslation } from 'react-i18next';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import type { FirehoseResource } from '@console/internal/components/utils';
import { ResourceDropdownField } from '@console/shared';
import { ModalFooterWithAlerts } from '@console/shared/src/components/modals/ModalFooterWithAlerts';
import { craftResourceKey } from '../pub-sub/pub-sub-utils';

export interface SinkPubsubModalProps {
  resourceName: string;
  resourceDropdown: FirehoseResource[];
  labelTitle: string;
  cancel?: () => void;
}

type Props = FormikProps<FormikValues> & SinkPubsubModalProps;

const SinkPubsubModal: FC<Props> = ({
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
  const onSinkChange = useCallback(
    (selectedValue, target) => {
      const modelResource = target?.props?.model;
      if (selectedValue) {
        setFieldTouched('ref.name', true);
        setFieldValue('ref.name', selectedValue);
        if (modelResource) {
          const { apiGroup = 'core', apiVersion, kind } = modelResource;
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
    <>
      <ModalHeader
        title={labelTitle}
        labelId="sink-pubsub-modal-title"
        data-test-id="modal-title"
      />
      <ModalBody>
        <Form id="sink-pubsub-form" onSubmit={handleSubmit} className="pf-v6-u-mr-md">
          <p>
            <Trans
              t={t}
              ns="knative-plugin"
              i18nKey="Connects <strong>{{resourceName}}</strong> to"
            >
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
              customResourceKey={craftResourceKey}
              onChange={onSinkChange}
              autoSelect
              selectedKey={values?.ref?.name}
            />
          </FormSection>
        </Form>
      </ModalBody>
      <ModalFooterWithAlerts errorMessage={status.error}>
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          isDisabled={!dirty}
          form="sink-pubsub-form"
        >
          {t('knative-plugin~Save')}
        </Button>
        <Button variant="link" onClick={cancel} type="button" data-test-id="modal-cancel-action">
          {t('knative-plugin~Cancel')}
        </Button>
      </ModalFooterWithAlerts>
    </>
  );
};

export default SinkPubsubModal;
