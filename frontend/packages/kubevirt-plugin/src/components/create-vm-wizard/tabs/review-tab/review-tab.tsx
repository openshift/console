import * as React from 'react';
import { connect } from 'react-redux';
import { Checkbox, Form, Title } from '@patternfly/react-core';
import { vmWizardActions } from '../../redux/actions';
import { ActionType } from '../../redux/types';
import { FormFieldMemoRow } from '../../form/form-field-row';
import { VMSettingsField, VMSettingsRenderableField } from '../../types';
import { FormField, FormFieldType } from '../../form/form-field';
import { getFieldId } from '../../utils/renderable-field-utils';
import { iGetVmSettings } from '../../selectors/immutable/vm-settings';
import { getField } from './utils';
import { GeneralReview } from './general-tab';
import { NetworkingReview } from './networking-review';
import { StorageReview } from './storage-review';
import { AdvancedReviewTab } from './advanced-tab';

import './review-tab.scss';

export const ReviewTabConnected: React.FC<ReviewTabProps> = (props) => {
  const { onFieldChange, vmSettings, wizardReduxID } = props;

  const onChange = (key: VMSettingsRenderableField) => (value) => onFieldChange(key, value);

  return (
    <>
      <Title headingLevel="h3" size="lg" className="kubevirt-create-vm-modal__review-tab-title">
        Review and confirm your settings
      </Title>
      <Title
        headingLevel="h4"
        size="lg"
        className="kubevirt-create-vm-modal__review-tab-lower-section"
      >
        General
      </Title>
      <GeneralReview wizardReduxID={wizardReduxID} />
      <Title
        headingLevel="h4"
        size="lg"
        className="kubevirt-create-vm-modal__review-tab-lower-section"
      >
        Networking
      </Title>
      <NetworkingReview
        wizardReduxID={wizardReduxID}
        className="kubevirt-create-vm-modal__review-tab-lower-section"
      />
      <Title
        headingLevel="h4"
        size="lg"
        className="kubevirt-create-vm-modal__review-tab-lower-section"
      >
        Storage
      </Title>
      <StorageReview
        wizardReduxID={wizardReduxID}
        className="kubevirt-create-vm-modal__review-tab-lower-section"
      />
      <Title
        headingLevel="h4"
        size="lg"
        className="kubevirt-create-vm-modal__review-tab-lower-section"
      >
        Advanced
      </Title>
      <AdvancedReviewTab wizardReduxID={wizardReduxID} />
      <Form>
        <FormFieldMemoRow
          field={getField(VMSettingsField.START_VM, vmSettings)}
          fieldType={FormFieldType.INLINE_CHECKBOX}
        >
          <FormField>
            <Checkbox
              className="kubevirt-create-vm-modal__start_vm_checkbox"
              id={getFieldId(VMSettingsField.START_VM)}
              onChange={onChange(VMSettingsField.START_VM)}
            />
          </FormField>
        </FormFieldMemoRow>
      </Form>
    </>
  );
};

type ReviewTabProps = {
  onFieldChange: (key: VMSettingsRenderableField, value: string) => void;
  vmSettings: any;
  wizardReduxID: string;
};

const stateToProps = (state, { wizardReduxID }) => ({
  vmSettings: iGetVmSettings(state, wizardReduxID),
});

const dispatchToProps = (dispatch, props) => ({
  onFieldChange: (key, value) =>
    dispatch(vmWizardActions[ActionType.SetVmSettingsFieldValue](props.wizardReduxID, key, value)),
});

export const ReviewTab = connect(
  stateToProps,
  dispatchToProps,
)(ReviewTabConnected);
