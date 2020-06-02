import * as React from 'react';
import * as _ from 'lodash';
import { useFormikContext, FormikValues } from 'formik';
import { ResourceLink } from '@console/internal/components/utils';
import { SecretModel } from '@console/internal/models';
import { SecretType } from '@console/internal/components/secrets/create-secret';
import { SecondaryStatus } from '@console/shared';
import { SecretKind } from '@console/internal/module/k8s';
import { ServiceAccountType } from '../../../../utils/pipeline-utils';
import { useFetchServiceAccount } from './hooks';
import './SecretsList.scss';

type SecretsListProps = {
  namespace: string;
  secrets: SecretKind[];
};

const secretTypes = [SecretType.dockerconfigjson, SecretType.basicAuth, SecretType.sshAuth];

const SecretsList: React.FC<SecretsListProps> = ({ namespace, secrets }) => {
  const {
    values: { newSecrets },
  } = useFormikContext<FormikValues>();

  const serviceAccount: ServiceAccountType = useFetchServiceAccount(namespace);

  const serviceAccountSecrets = _.map(serviceAccount?.secrets, 'name');
  const filterData = _.filter(
    secrets,
    (secret) =>
      _.includes(secretTypes, secret.type) &&
      _.includes(serviceAccountSecrets, secret.metadata.name),
  );
  const sortedFilterData = _.sortBy(filterData, (data) => data.metadata.name);
  const finalData = _.concat(newSecrets, sortedFilterData);

  return (
    <div className="odc-secrets-list">
      {finalData.map((secret) => {
        return (
          <ResourceLink
            key={secret.metadata.uid || secret.metadata.name}
            kind={SecretModel.kind}
            name={
              secret.metadata.uid ? (
                secret.metadata.name
              ) : (
                <>
                  {secret.metadata.name}
                  <span className="text-muted odc-secrets-list__name">(Pending)</span>
                </>
              )
            }
            namespace={secret.metadata.namespace}
            title={secret.metadata.name}
            linkTo={false}
          />
        );
      })}
      {_.isEmpty(finalData) && <SecondaryStatus status="No source secrets found" />}
    </div>
  );
};

export default SecretsList;
