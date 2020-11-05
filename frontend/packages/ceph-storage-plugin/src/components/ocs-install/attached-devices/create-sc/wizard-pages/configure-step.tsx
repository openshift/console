import * as React from 'react';
import { Form } from '@patternfly/react-core';
import { State, Action } from '../state';
import { EncryptionFormGroup } from '../../../install-wizard/configure';

export const Configure: React.FC<ConfigureProps> = ({ state, dispatch, mode }) => {
  return (
    <Form noValidate={false}>
      <EncryptionFormGroup state={state} dispatch={dispatch} mode={mode} />
    </Form>
  );
};

type ConfigureProps = {
  state: State;
  dispatch: React.Dispatch<Action>;
  mode: string;
};
