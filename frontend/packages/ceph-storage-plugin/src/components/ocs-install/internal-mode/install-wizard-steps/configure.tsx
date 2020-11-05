import * as React from 'react';
import { Form } from '@patternfly/react-core';
import { InternalClusterAction, InternalClusterState } from '../reducer';
import { EncryptionFormGroup } from '../../install-wizard/configure';

export const Configure: React.FC<ConfigureProps> = ({ state, dispatch, mode }) => {
  return (
    <Form noValidate={false}>
      <EncryptionFormGroup state={state} dispatch={dispatch} mode={mode} />
    </Form>
  );
};

type ConfigureProps = {
  state: InternalClusterState;
  dispatch: React.Dispatch<InternalClusterAction>;
  mode: string;
};
