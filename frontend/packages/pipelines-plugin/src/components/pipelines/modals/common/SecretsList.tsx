import * as React from 'react';
import * as _ from 'lodash';
import {
  ResourceLink,
  Firehose,
  FirehoseResult,
  FirehoseResource,
} from '@console/internal/components/utils';
import { SecretModel, ServiceAccountModel } from '@console/internal/models';
import { SecretType } from '@console/internal/components/secrets/create-secret';
import { SecondaryStatus } from '@console/shared';
import { SecretKind } from '@console/internal/module/k8s';
import { ServiceAccountType } from '../../../../utils/pipeline-utils';
import { PIPELINE_SERVICE_ACCOUNT } from '../../const';
import './SecretsList.scss';

type SecretsProps = {
  secrets?: FirehoseResult<SecretKind[]>;
  serviceaccounts?: FirehoseResult<ServiceAccountType>;
};

type SecretsListProps = {
  namespace: string;
};

const secretTypes = [SecretType.dockerconfigjson, SecretType.basicAuth, SecretType.sshAuth];

const Secrets: React.FC<SecretsProps> = ({ secrets, serviceaccounts }) => {
  const serviceAccountSecrets = _.map(serviceaccounts.data.secrets, 'name');
  const filterData = _.filter(
    secrets.data,
    (secret) =>
      _.includes(secretTypes, secret.type) &&
      _.includes(serviceAccountSecrets, secret.metadata.name),
  );
  const sortedFilterData = _.sortBy(filterData, (data) => data.metadata.name);

  return (
    <div className="odc-secrets-list">
      {sortedFilterData.map((secret) => {
        return (
          <ResourceLink
            key={secret.metadata.uid}
            kind={SecretModel.kind}
            name={secret.metadata.name}
            namespace={secret.metadata.namespace}
            title={secret.metadata.name}
            linkTo={false}
          />
        );
      })}
      {_.isEmpty(sortedFilterData) && <SecondaryStatus status="No source secrets found" />}
    </div>
  );
};

const SecretsList: React.FC<SecretsListProps> = ({ namespace }) => {
  const resources: FirehoseResource[] = [
    {
      isList: true,
      namespace,
      kind: SecretModel.kind,
      prop: SecretModel.plural,
    },
    {
      isList: false,
      namespace,
      kind: ServiceAccountModel.kind,
      prop: ServiceAccountModel.plural,
      name: PIPELINE_SERVICE_ACCOUNT,
    },
  ];

  return (
    <Firehose resources={resources}>
      <Secrets />
    </Firehose>
  );
};

export default SecretsList;
