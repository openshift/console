import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ResourceLink } from '@console/internal/components/utils';
import { SecretModel } from '@console/internal/models';
import { referenceForModel } from '@console/internal/module/k8s';
import { KafkaConnection } from '../../utils/rhoas-types';

export const ResourcesComponent: React.FC<{ obj: KafkaConnection }> = ({ obj }) => {
  const serviceAccountSecretName = obj?.spec?.credentials?.serviceAccountSecretName;
  const { namespace } = obj.metadata;
  const { t } = useTranslation();

  const link = (
    <ResourceLink
      kind={referenceForModel(SecretModel)}
      name={serviceAccountSecretName}
      namespace={namespace}
    />
  );

  return (
    <ul>
      <h3>{t('rhoas-plugin~Secret')}</h3>
      {!serviceAccountSecretName ? (
        <span className="text-muted">{t('rhoas-plugin~No Secret')}</span>
      ) : (
        <li className="list-group-item container-fluid">
          <div className="row">
            <span className="col-xs-12">{link}</span>
          </div>
        </li>
      )}
    </ul>
  );
};
