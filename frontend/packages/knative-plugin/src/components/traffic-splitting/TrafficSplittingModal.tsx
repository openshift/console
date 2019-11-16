import * as React from 'react';
import { FormikProps, FormikValues, useField } from 'formik';
import {
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
} from '@console/internal/components/factory/modal';
import { TextInputTypes } from '@patternfly/react-core';
import {
  MultiColumnField,
  InputField,
  DropdownField,
} from '@console/dev-console/src/components/formik-fields';
import * as _ from 'lodash';

export interface TrafficSplittingModalProps {
  revisionItems: any;
}

type Props = FormikProps<FormikValues> & TrafficSplittingModalProps;

const TrafficSplittingModal: React.FC<Props> = ({
  revisionItems,
  handleSubmit,
  handleReset,
  isSubmitting,
  status,
}) => {
  const getConsumedRevisions = (fieldValue): any[] => {
    return fieldValue.length
      ? fieldValue.reduce((accumulator, currentValue) => {
          accumulator.push(currentValue.revisionName);
          return accumulator;
        }, [])
      : [];
  };
  const [disableSaveButton, toggleSaveButtonState] = React.useState(false);
  const toggleSave = (toggle: boolean) => {
    toggleSaveButtonState(toggle);
  };
  const [field] = useField('trafficSplitting');
  const consumedRevisions = getConsumedRevisions(field.value);
  const disableAddRevision = _.size(field.value) >= _.size(revisionItems);
  return (
    <form className="modal-content" onSubmit={handleSubmit}>
      <ModalTitle>Set Traffic Distribution</ModalTitle>
      <ModalBody>
        <p>Set traffic distribution for the Revisions of the Knative Service</p>
        <MultiColumnField
          name="trafficSplitting"
          addLabel="Add Revision"
          headers={['Split', 'Tag', 'Revision']}
          emptyValues={{ percent: '', tag: '', revisionName: '' }}
          disableAddValues={disableAddRevision}
        >
          <InputField
            name="percent"
            type={TextInputTypes.number}
            placeholder="100"
            style={{ maxWidth: '100%' }}
            required
          />
          <InputField name="tag" type={TextInputTypes.text} placeholder="Unique Tag" required />
          <DropdownField
            name="revisionName"
            items={revisionItems}
            consumedItems={consumedRevisions}
            title="Select a revision"
            handleDuplicateEntry={toggleSave}
            fullWidth
            required
          />
        </MultiColumnField>
      </ModalBody>
      <ModalSubmitFooter
        inProgress={isSubmitting}
        submitText="Save"
        cancel={handleReset}
        errorMessage={status.error}
        submitDisabled={disableSaveButton}
      />
    </form>
  );
};

export default TrafficSplittingModal;
