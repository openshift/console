import * as React from 'react';
import * as fuzzy from 'fuzzysearch';
import { FormikProps, FormikValues } from 'formik';
import {
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
} from '@console/internal/components/factory/modal';
import { ResourceDropdownField } from '@console/shared';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { knativeServingResourcesServices } from '../../utils/create-knative-utils';

export interface SinkSourceModalProps {
  namespace: string;
  resourceName: string;
  cancel?: () => void;
}

type Props = FormikProps<FormikValues> & SinkSourceModalProps;

const SinkSourceModal: React.FC<Props> = ({
  namespace,
  resourceName,
  handleSubmit,
  cancel,
  isSubmitting,
  status,
  setFieldValue,
  setFieldTouched,
  validateForm,
  values,
}) => {
  const autocompleteFilter = (strText, item): boolean => fuzzy(strText, item?.props?.name);
  const onSinkChange = React.useCallback(
    (selectedValue, target) => {
      const {
        props: { model },
      } = target;
      if (selectedValue) {
        setFieldTouched('sink.ref.name', true);
        setFieldValue('sink.ref.name', selectedValue);
        if (model) {
          const sinkApiversion = `${model?.apiGroup}/${model?.apiVersion}`;
          setFieldValue('sink.ref.apiVersion', sinkApiversion);
          setFieldTouched('sink.ref.apiVersion', true);
          setFieldValue('sink.ref.kind', model?.kind);
          setFieldTouched('sink.ref.kind', true);
        }
        validateForm();
      }
    },
    [setFieldValue, setFieldTouched, validateForm],
  );
  return (
    <form className="modal-content modal-content--no-inner-scroll" onSubmit={handleSubmit}>
      <ModalTitle>Move Sink</ModalTitle>
      <ModalBody>
        <p>
          Select a sink to move the event source
          <strong>{` ${resourceName} `}</strong>
          to
        </p>
        <FormSection fullWidth>
          <ResourceDropdownField
            name="sink.ref.name"
            resources={knativeServingResourcesServices(namespace)}
            dataSelector={['metadata', 'name']}
            fullWidth
            required
            placeholder="Select a sink"
            showBadge
            autocompleteFilter={autocompleteFilter}
            onChange={onSinkChange}
            autoSelect
            selectedKey={values.sink.ref.name}
          />
        </FormSection>
      </ModalBody>
      <ModalSubmitFooter
        inProgress={isSubmitting}
        submitText="Save"
        cancel={cancel}
        errorMessage={status.error}
      />
    </form>
  );
};

export default SinkSourceModal;
