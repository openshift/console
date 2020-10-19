import * as React from 'react';
import { Form } from '@patternfly/react-core';
import { InternalClusterAction, InternalClusterState, ActionType } from '../reducer';
import { EncryptionFormGroup } from '../../install-wizard/configure';

export const Configure: React.FC<ConfigureProps> = ({ state, dispatch }) => {
  const { enableEncryption } = state;

  const toggleEncryption = (checked: boolean) =>
    dispatch({ type: ActionType.SET_ENABLE_ENCRYPTION, payload: checked });

  return (
    <Form>
      <EncryptionFormGroup isChecked={enableEncryption} onChange={toggleEncryption} />
    </Form>
  );
};

type ConfigureProps = {
  state: InternalClusterState;
  dispatch: React.Dispatch<InternalClusterAction>;
};
