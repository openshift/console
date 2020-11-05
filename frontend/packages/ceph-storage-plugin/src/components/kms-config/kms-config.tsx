import * as React from 'react';
import { FormGroup, TextInput } from '@patternfly/react-core';
import { State, Action } from '../ocs-install/attached-devices/create-sc/state';
import {
  InternalClusterState,
  InternalClusterAction,
  ActionType,
} from '../ocs-install/internal-mode/reducer';
import {
  setDispatch,
  Validation,
  VALIDATIONS,
  ValidationMessage,
} from '../../utils/common-ocs-install-el';

const validate = (valid: boolean): Validation => {
  let validation: Validation;
  if (!valid) {
    validation = VALIDATIONS.REQUIRED_FIELD_KMS;
  }
  return validation;
};

/* @TODO - complete KMS View in follow up PR */
export const KMSConfigure: React.FC<KMSConfigureProps> = ({ state, dispatch, mode }) => {
  const { kms } = state;
  const validation: Validation = validate(kms.hasHandled);

  React.useEffect(() => {
    if (!kms.name) {
      setDispatch(ActionType.SET_KMS_ENCRYPTION, { ...kms, hasHandled: false }, mode, dispatch);
    } else {
      setDispatch(ActionType.SET_KMS_ENCRYPTION, { ...kms, hasHandled: true }, mode, dispatch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kms.name]);

  const getServiceName = (name: string) => {
    setDispatch(ActionType.SET_KMS_ENCRYPTION, { ...kms, name }, mode, dispatch);
  };

  return (
    <>
      <FormGroup
        fieldId="kms-service-name"
        label="Service Name"
        className="co-m-pane__form ocs-install-encryption__form-body"
      >
        <TextInput
          value={kms.name}
          onChange={getServiceName}
          isRequired
          type="text"
          id="kms-service-name"
          name="kms-service-name"
        />
        {validation && <ValidationMessage validation={validation} />}
      </FormGroup>
    </>
  );
};

type KMSConfigureProps = {
  state: State | InternalClusterState;
  dispatch: React.Dispatch<Action | InternalClusterAction>;
  mode: string;
};
