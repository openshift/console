import * as React from 'react';
import { connect } from 'react-redux';
import { Checkbox, Form } from '@patternfly/react-core';
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
      <h2 className="pf-c-title pf-m-xl">Review and confirm your settings</h2>

      <section className="kubevirt-create-vm-modal__review-tab-section">
        <h3 className="kubevirt-create-vm-modal__review-tab-section__title pf-c-title pf-m-lg">
          General
        </h3>
        <GeneralReview wizardReduxID={wizardReduxID} />
      </section>

      <section className="kubevirt-create-vm-modal__review-tab-section">
        <h3 className="kubevirt-create-vm-modal__review-tab-section__title pf-c-title pf-m-lg">
          Networking
        </h3>
        <NetworkingReview
          wizardReduxID={wizardReduxID}
          className="kubevirt-create-vm-modal__review-tab-lower-section"
        />
      </section>

      <section className="kubevirt-create-vm-modal__review-tab-section">
        <h3 className="kubevirt-create-vm-modal__review-tab-section__title pf-c-title pf-m-lg">
          Storage
        </h3>
        <StorageReview
          wizardReduxID={wizardReduxID}
          className="kubevirt-create-vm-modal__review-tab-lower-section"
        />
      </section>

      <section className="kubevirt-create-vm-modal__review-tab-section">
        <h3 className="kubevirt-create-vm-modal__review-tab-section__title pf-c-title pf-m-lg">
          Advanced
        </h3>
        <AdvancedReviewTab wizardReduxID={wizardReduxID} />
      </section>

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
