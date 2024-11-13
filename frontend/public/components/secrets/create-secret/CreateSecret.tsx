import * as React from 'react';
import { useParams } from 'react-router-dom-v5-compat';
import { SecretTypeAbstraction } from './types';
import { SecretFormWrapper } from './SecretFormWrapper';

export const CreateSecret = () => {
  const params = useParams();
  const secretTypeAbstraction = params.type as SecretTypeAbstraction;
  return (
    <SecretFormWrapper
      fixed={{ metadata: { namespace: params.ns } }}
      secretTypeAbstraction={secretTypeAbstraction}
      isCreate={true}
    />
  );
};
