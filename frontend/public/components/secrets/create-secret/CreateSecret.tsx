import { useParams } from 'react-router';
import { SecretFormWrapper } from './SecretFormWrapper';
import type { SecretFormType } from './types';

export const CreateSecret = () => {
  const params = useParams();
  const formType = params.type as SecretFormType;
  return (
    <SecretFormWrapper
      fixed={{ metadata: { namespace: params.ns } }}
      formType={formType}
      isCreate
    />
  );
};
