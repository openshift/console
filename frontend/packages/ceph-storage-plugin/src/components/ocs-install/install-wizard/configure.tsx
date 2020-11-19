import * as React from 'react';

import { FormGroup, Checkbox } from '@patternfly/react-core';
import { FieldLevelHelp } from '@console/internal/components/utils';
import { encryptionTooltip } from '../../../constants/ocs-install';
import { TechPreviewBadge } from '@console/shared';
import { InternalClusterState, InternalClusterAction, ActionType } from '../internal-mode/reducer';
import { State, Action } from '../attached-devices/create-sc/state';
import { KMSConfigure } from '../../kms-config/kms-config';
import './install-wizard.scss';
import {
  Validation,
  ValidationMessage,
  VALIDATIONS,
  setDispatch,
} from '../../../utils/common-ocs-install-el';

const StorageClassEncryptionLabel: React.FC = () => (
  <div className="ocs-install-encryption__pv-title">
    <span className="ocs-install-encryption__pv-title--padding">Storage class encryption</span>
    <TechPreviewBadge />
  </div>
);

const validate = (valid: boolean): Validation => {
  let validation: Validation;
  if (!valid) {
    validation = VALIDATIONS.ENCRYPTION;
  }
  return validation;
};

export const EncryptionFormGroup: React.FC<EncryptionFormGroupProps> = ({
  state,
  dispatch,
  mode,
}) => {
  const { encryption } = state;

  const [encryptionChecked, setEncryptionChecked] = React.useState(
    encryption.clusterWide || encryption.storageClass,
  );
  const validation: Validation = validate(encryption.hasHandled);

  React.useEffect(() => {
    // To add validation message for encryption
    if (!encryption.clusterWide && !encryption.storageClass && encryptionChecked) {
      setDispatch(
        ActionType.SET_ENCRYPTION,
        { ...encryption, hasHandled: false, advanced: false },
        mode,
        dispatch,
      );
    } else {
      setDispatch(ActionType.SET_ENCRYPTION, { ...encryption, hasHandled: true }, mode, dispatch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [encryption.clusterWide, encryption.storageClass, encryptionChecked]);

  const toggleEncryption = (checked: boolean) => {
    setDispatch(ActionType.SET_ENCRYPTION, { ...encryption, clusterWide: checked }, mode, dispatch);
    setEncryptionChecked(checked);
  };

  const toggleClusterWideEncryption = (checked: boolean) => {
    setDispatch(ActionType.SET_ENCRYPTION, { ...encryption, clusterWide: checked }, mode, dispatch);
  };

  const toggleStorageClassEncryption = (checked: boolean) => {
    const encryptOj = {
      ...encryption,
      storageClass: checked,
    };
    if (checked) {
      encryptOj.advanced = true;
    }
    setDispatch(ActionType.SET_ENCRYPTION, encryptOj, mode, dispatch);
  };

  const toggleAdvancedEncryption = (checked: boolean) => {
    setDispatch(ActionType.SET_ENCRYPTION, { ...encryption, advanced: checked }, mode, dispatch);
  };

  return (
    <FormGroup fieldId="configure-encryption" label="Encryption">
      <Checkbox
        id="configure-encryption"
        isChecked={encryptionChecked}
        label="Enable Encryption"
        description="Data encryption for block and file storage. MultiCloud Object Gateway is always encrypted."
        onChange={toggleEncryption}
      />
      {encryptionChecked && (
        <div className="ocs-install-encryption">
          <FormGroup
            fieldId="encryption-options"
            label="Encryption level"
            labelIcon={<FieldLevelHelp>{encryptionTooltip}</FieldLevelHelp>}
            className="ocs-install-encryption__form-body"
          >
            <Checkbox
              id="cluster-wide-encryption"
              isChecked={encryption.clusterWide}
              label={
                <span className="ocs-install-encryption__pv-title--padding">
                  Cluster-wide encryption
                </span>
              }
              aria-label="Cluster-wide encryption"
              description="Encryption for the entire cluster (block and file)"
              onChange={toggleClusterWideEncryption}
              className="ocs-install-encryption__form-checkbox"
            />
            <Checkbox
              id="storage-class-encryption"
              isChecked={encryption.storageClass}
              label={<StorageClassEncryptionLabel />}
              aria-label="Storage class encryption"
              description="A new storage class will be created with encryption enabled. Encryption key for each Persistent volume (block only) will be generated."
              onChange={toggleStorageClassEncryption}
              className="ocs-install-encryption__form-checkbox"
            />
          </FormGroup>
          <FormGroup
            fieldId="advanced-encryption-options"
            label="Connection settings"
            className="ocs-install-encryption__form-body"
          >
            <Checkbox
              id="advanced-encryption"
              isChecked={encryption.advanced}
              label="Connect to an external key management service"
              onChange={toggleAdvancedEncryption}
              isDisabled={encryption.storageClass || !encryption.hasHandled}
            />
          </FormGroup>
          {(encryption.advanced || encryption.storageClass) && (
            <KMSConfigure state={state} dispatch={dispatch} mode={mode} />
          )}
          {validation && <ValidationMessage validation={validation} />}
        </div>
      )}
    </FormGroup>
  );
};

type EncryptionFormGroupProps = {
  state: State | InternalClusterState;
  dispatch: React.Dispatch<Action | InternalClusterAction>;
  mode: string;
};
