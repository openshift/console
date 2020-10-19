import * as React from 'react';
import { Form } from '@patternfly/react-core';
import { State, Action } from '../state';
import { EncryptionFormGroup } from '../../../install-wizard/configure';

export const Configure: React.FC<ConfigureProps> = ({ state, dispatch }) => {
  const { enableEncryption } = state;

  const toggleEncryption = (checked: boolean) =>
    dispatch({ type: 'setEnableEncryption', value: checked });

  return (
    <Form>
      <EncryptionFormGroup isChecked={enableEncryption} onChange={toggleEncryption} />
    </Form>
  );
};

type ConfigureProps = {
  state: State;
  dispatch: React.Dispatch<Action>;
};
