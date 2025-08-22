import { useParams } from 'react-router-dom';
import { SecretFormType } from './types';
import { SecretFormWrapper } from './SecretFormWrapper';

export const CreateSecret = () => {
  const params = useParams();
  const formType = params.type as SecretFormType;
  return (
    <SecretFormWrapper
      fixed={{ metadata: { namespace: params.ns } }}
      formType={formType}
      isCreate={true}
    />
  );
};
