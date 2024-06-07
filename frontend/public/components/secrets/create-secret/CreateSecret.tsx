/* eslint-disable @typescript-eslint/no-use-before-define */
import * as React from 'react';
import { useParams } from 'react-router-dom-v5-compat';
import { SecretTypeAbstraction, SecretFormWrapper, secretFormExplanation } from '.';

export const CreateSecret = () => {
  const params = useParams();
  const secretTypeAbstraction = params.type as SecretTypeAbstraction;
  return (
    <SecretFormWrapper
      fixed={{ metadata: { namespace: params.ns } }}
      secretTypeAbstraction={secretTypeAbstraction}
      explanation={secretFormExplanation(secretTypeAbstraction)}
      isCreate={true}
    />
  );
};
