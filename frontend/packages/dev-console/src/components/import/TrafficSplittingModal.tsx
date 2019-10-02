import * as React from 'react';
import * as _ from 'lodash-es';
import { ModalTitle, ModalBody, ModalSubmitFooter, createModalLauncher, ModalComponentProps } from '@console/internal/components/factory/modal';
import { MultiColumnField, InputField, DropdownField } from '../formik-fields';
import { TextInputTypes } from '@patternfly/react-core';

export interface TrafficSplittingModalProps {
  save?: () => void;
  revisions: [];
  inprogress:boolean;
  errorMessage: string;
}

type props = TrafficSplittingModalProps & ModalComponentProps;

const TrafficSplittingModal: React.FC<props> = ({close, save, revisions, inprogress, errorMessage}) => {
  const handleSave = () => {
    close();
    save();
  };
  return (
    <form onSubmit={handleSave}>
      <ModalTitle>Set traffic distrubution</ModalTitle>
      <ModalBody>
          <p>
            Set traffic distribution for the Revisions of the Knative Service
          </p>
      <MultiColumnField
        name="traffic-splitting"
        addLabel="Add Revision"
        headers={['Split', 'Revision']}
        emptyValues={{ split: '', revision: ''}}
      >
        <InputField name="split" type={TextInputTypes.number} placeholder="100" />
        <DropdownField name="revision" items={revisions} fullWidth />
      </MultiColumnField>
      </ModalBody>
      <ModalSubmitFooter
          errorMessage={errorMessage}
          inProgress={inprogress}
          submitText="Save"
          cancel= {close}
      />
    </form>
  );
};

export const trafficModalLauncher = createModalLauncher<props>(TrafficSplittingModal);
export default TrafficSplittingModal;
